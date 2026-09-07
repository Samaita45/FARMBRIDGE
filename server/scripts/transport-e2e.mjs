/**
 * End-to-end walk of the transport lifecycle against the running API.
 *
 * REQUESTED -> BIDDING -> ACCEPTED -> DRIVER_ASSIGNED -> GOODS_COLLECTED
 * -> IN_TRANSIT -> DELIVERED
 *
 * Two accounts, because the point is that authorisation holds: the farmer
 * creates and accepts, the transporter bids and drives. It also checks that a
 * third party cannot read the request.
 */
const BASE = 'http://localhost:3000/v1';
const TENANT = '018f3a7c-4c1e-7a2b-9f4d-5e6a7b8c9d01';
const PASSWORD = 'development-only-password';

let failures = 0;

function check(label, ok, detail = '') {
  console.log(`${ok ? 'PASS ' : 'FAIL '} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures += 1;
}

async function call(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, json, text };
}

async function login(email) {
  const res = await call('/auth/login', {
    method: 'POST',
    body: { email, password: PASSWORD, tenantId: TENANT },
  });
  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`login ${email} -> ${res.status} ${res.text.slice(0, 300)}`);
  }
  return res.json.accessToken ?? res.json.tokens?.accessToken;
}

const farmer = await login('farmer@dev.local');
const transporter = await login('transporter@dev.local');
const buyer = await login('buyer@dev.local');
check('both accounts authenticate', Boolean(farmer && transporter));

// ── pricing ────────────────────────────────────────────────────────────────
const quote = await call('/transport/pricing/quote', {
  method: 'POST',
  token: farmer,
  body: { distanceKm: 439, weightKg: 1200, goodsType: 'Fresh Produce' },
});
check(
  'pricing quote returns cents and a breakdown',
  quote.status < 300 && typeof quote.json?.quote?.estimatedPriceUsdCents === 'number',
  quote.status < 300 ? `$${(quote.json.quote.estimatedPriceUsdCents / 100).toFixed(2)} for 439km / 1200kg` : quote.text.slice(0, 200)
);

// Pricing must move with the inputs, or the table is not being read.
const heavier = await call('/transport/pricing/quote', {
  method: 'POST',
  token: farmer,
  body: { distanceKm: 439, weightKg: 6000, goodsType: 'Fresh Produce' },
});
check(
  'a heavier load costs more',
  heavier.json?.quote?.estimatedPriceUsdCents > quote.json?.quote?.estimatedPriceUsdCents,
  `$${(heavier.json?.quote?.estimatedPriceUsdCents / 100).toFixed(2)} vs $${(quote.json?.quote?.estimatedPriceUsdCents / 100).toFixed(2)}`
);

// ── request ────────────────────────────────────────────────────────────────
const created = await call('/transport/requests', {
  method: 'POST',
  token: farmer,
  body: {
    pickupAddress: 'Mbare Musika, Harare',
    pickupLat: -17.8292,
    pickupLng: 31.0522,
    destinationAddress: 'Renkini, Bulawayo',
    destinationLat: -20.15,
    destinationLng: 28.5833,
    goodsType: 'Fresh Produce',
    goodsDescription: 'Tomatoes, 40 crates',
    weightKg: 1200,
    vehicleType: 'TRUCK',
    urgency: 'STANDARD',
  },
});
check(
  'request created with coordinates',
  created.status < 300 && Boolean(created.json?.request?.id),
  created.status < 300
    ? `${created.json.request.status}, ${Math.round((created.json.request.distanceMeters ?? 0) / 1000)}km stored`
    : `${created.status} ${created.text.slice(0, 300)}`
);
const requestId = created.json?.request?.id;

/*
  An OPEN request is visible across the tenant on purpose — that is how a
  transporter finds work to bid on. The invariant worth testing is not secrecy
  of the request but secrecy of the BIDS: a third party must never see what
  someone else offered, or they could undercut it by a dollar.
*/
if (requestId) {
  const peek = await call(`/transport/requests/${requestId}`, { token: buyer });
  check(
    'an open request is browsable by other tenant members',
    peek.status === 200,
    `got ${peek.status}`
  );
}

// ── bidding ────────────────────────────────────────────────────────────────
let bidId = null;
if (requestId) {
  const bid = await call(`/transport/requests/${requestId}/bids`, {
    method: 'POST',
    token: transporter,
    body: { amountUsdCents: 42000, note: 'Can collect at 7am.' },
  });
  check(
    'transporter can bid',
    bid.status < 300 && Boolean(bid.json?.bid?.id),
    bid.status < 300 ? `bid ${bid.json.bid.status}` : `${bid.status} ${bid.text.slice(0, 200)}`
  );
  bidId = bid.json?.bid?.id;

  const after = await call(`/transport/requests/${requestId}`, { token: farmer });
  check(
    'request moves to BIDDING',
    after.json?.request?.status === 'BIDDING',
    `status ${after.json?.request?.status}`
  );

  // The offers screen asks a farmer to choose between transporters, which is
  // not a choice if every bid is a UUID.
  const seen = after.json?.bids?.[0];
  check(
    'the customer sees who is bidding',
    typeof seen?.transporterName === 'string' && seen.transporterName.length > 0,
    `name ${JSON.stringify(seen?.transporterName)}`
  );

  /*
    …and nothing further. Placing a bid identifies you to the customer; it does
    not hand them your contact details. This asserts on the keys rather than on
    known values, so a field added to the Prisma select later fails here instead
    of quietly shipping.
  */
  const allowed = new Set([
    'id',
    'requestId',
    'transporterId',
    'transporterName',
    'transporterSince',
    'amountUsdCents',
    'note',
    'etaMinutes',
    'status',
    'createdAt',
  ]);
  const leaked = Object.keys(seen ?? {}).filter((k) => !allowed.has(k));
  check(
    'a bid carries no contact details beyond a name',
    leaked.length === 0,
    leaked.length ? `leaked ${leaked.join(', ')}` : ''
  );

  // The bidder sees their own offer — not zero, and not the competition.
  const own = await call(`/transport/requests/${requestId}`, { token: transporter });
  check(
    'a transporter sees their own bid and only their own',
    Array.isArray(own.json?.bids) &&
      own.json.bids.length === 1 &&
      own.json.bids[0].id === bidId,
    `saw ${own.json?.bids?.length ?? '?'} bids`
  );
}

// ── acceptance ─────────────────────────────────────────────────────────────
let bookingId = null;
if (bidId) {
  // Another account must not be able to see the bid that was placed.
  const bidPeek = await call(`/transport/requests/${requestId}`, { token: buyer });
  check(
    "a third party cannot see someone else's bids",
    Array.isArray(bidPeek.json?.bids) && bidPeek.json.bids.length === 0,
    `saw ${bidPeek.json?.bids?.length ?? '?'} bids`
  );

  const stolen = await call(`/transport/bids/${bidId}/accept`, {
    method: 'POST',
    token: buyer,
  });
  check(
    'only the customer can accept a bid',
    stolen.status >= 400,
    `unrelated account got ${stolen.status}`
  );

  const accepted = await call(`/transport/bids/${bidId}/accept`, {
    method: 'POST',
    token: farmer,
  });
  check(
    'customer accepts and a booking is created',
    accepted.status < 300 && Boolean(accepted.json?.booking?.id),
    accepted.status < 300 ? `booking ${accepted.json.booking.status}` : `${accepted.status} ${accepted.text.slice(0, 200)}`
  );
  bookingId = accepted.json?.booking?.id;

  /*
    The tracking screen publishes a position for a transporter and follows one
    for a customer, and it picks which from this field. Get it backwards and the
    farmer's phone starts broadcasting their location — so both sides are
    asserted, not just the happy one.
  */
  const mineFarmer = await call('/transport/bookings/active', { token: farmer });
  const asCustomer = mineFarmer.json?.bookings?.find((b) => b.id === bookingId);
  check(
    'the customer is told they are the customer',
    asCustomer?.viewer === 'customer',
    `viewer ${JSON.stringify(asCustomer?.viewer)}`
  );

  const mineDriver = await call('/transport/bookings/active', { token: transporter });
  const asDriver = mineDriver.json?.bookings?.find((b) => b.id === bookingId);
  check(
    'the transporter is told they are the transporter',
    asDriver?.viewer === 'transporter',
    `viewer ${JSON.stringify(asDriver?.viewer)}`
  );

  // An unrelated account has no active bookings to be a side of.
  const mineBuyer = await call('/transport/bookings/active', { token: buyer });
  check(
    'a third party gets no booking to track',
    !mineBuyer.json?.bookings?.some((b) => b.id === bookingId),
    `saw ${mineBuyer.json?.bookings?.length ?? '?'} bookings`
  );
}

// ── the rest of the lifecycle ──────────────────────────────────────────────
if (bookingId) {
  /*
    Accepting a bid IS assigning the driver in a bid-based flow, so the booking
    arrives at DRIVER_ASSIGNED already — there is no separate ACCEPTED step to
    walk through. Re-sending it is refused, which is the state machine doing its
    job rather than a fault.
  */
  const noop = await call(`/transport/bookings/${bookingId}/status`, {
    method: 'PATCH',
    token: transporter,
    body: { status: 'DRIVER_ASSIGNED' },
  });
  check('a redundant transition is refused', noop.status === 400, `got ${noop.status}`);

  const backwards = await call(`/transport/bookings/${bookingId}/status`, {
    method: 'PATCH',
    token: transporter,
    body: { status: 'REQUESTED' },
  });
  check('the lifecycle cannot run backwards', backwards.status >= 400, `got ${backwards.status}`);

  for (const status of ['GOODS_COLLECTED', 'IN_TRANSIT']) {
    const res = await call(`/transport/bookings/${bookingId}/status`, {
      method: 'PATCH',
      token: transporter,
      body: { status },
    });
    check(`transporter advances to ${status}`, res.status < 300, res.status < 300 ? '' : `${res.status} ${res.text.slice(0, 160)}`);
    /*
      The driver's trip screen replaces its booking with this response. If it
      comes back without `viewer`, the screen decides they are not the driver
      and every control they just used disappears.
    */
    check(
      `the ${status} response still says who is asking`,
      res.json?.booking?.viewer === 'transporter',
      `viewer ${JSON.stringify(res.json?.booking?.viewer)}`
    );
  }

  // Position only means anything while the load is moving.
  const loc = await call(`/transport/bookings/${bookingId}/location`, {
    method: 'POST',
    token: transporter,
    body: { latitude: -19.45, longitude: 29.8167 },
  });
  check('driver location accepted in transit', loc.status < 300, loc.status < 300 ? '' : `${loc.status} ${loc.text.slice(0, 160)}`);

  const hijack = await call(`/transport/bookings/${bookingId}/location`, {
    method: 'POST',
    token: buyer,
    body: { latitude: 0, longitude: 0 },
  });
  check('an unrelated account cannot post a driver location', hijack.status >= 400, `got ${hijack.status}`);

  const delivered = await call(`/transport/bookings/${bookingId}/status`, {
    method: 'PATCH',
    token: transporter,
    body: { status: 'DELIVERED' },
  });
  check('transporter advances to DELIVERED', delivered.status < 300, delivered.status < 300 ? '' : `${delivered.status}`);

  /*
    Past the per-driver 5-second throttle first. Without the wait this returns
    429 and the check passes without ever reaching the lifecycle guard — proving
    the rate limiter works, not that a delivered booking rejects positions.
  */
  await new Promise((r) => setTimeout(r, 5_500));
  const late = await call(`/transport/bookings/${bookingId}/location`, {
    method: 'POST',
    token: transporter,
    body: { latitude: -20.15, longitude: 28.5833 },
  });
  check(
    'location is refused once delivered, on lifecycle grounds not rate limit',
    late.status === 400,
    `got ${late.status} ${String(late.json?.message ?? '').slice(0, 80)}`
  );
}

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
