/**
 * Walks the whole add-product workflow against a running API.
 *
 * Create a draft, publish it, find it on the public shelf, edit it, sell out,
 * soft-delete it — and the refusals: another seller editing your listing,
 * a stranger reading your draft, a price of zero, a hostile image URL.
 *
 * Run: npm run test:products-e2e   (needs the API on localhost:3000)
 */
const BASE = 'http://localhost:3000/v1';
const TENANT = '018f3a7c-4c1e-7a2b-9f4d-5e6a7b8c9d01';
const PASSWORD = 'development-only-password';

let failures = 0;

function check(label, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures += 1;
}

async function call(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* reported via `text` */
  }
  return { status: res.status, json, text };
}

async function login(email) {
  const res = await call('/auth/login', {
    method: 'POST',
    body: { tenantId: TENANT, email, password: PASSWORD },
  });
  return res.json?.accessToken ?? null;
}

const farmer = await login('farmer@dev.local');
const buyer = await login('buyer@dev.local');
check('both accounts authenticate', Boolean(farmer && buyer));
if (!farmer) {
  console.log('\nCannot continue without a seller token.');
  process.exit(1);
}

const stamp = Date.now().toString(36);
const NAME = `E2E Tomatoes ${stamp}`;

// ── validation first ───────────────────────────────────────────────────────
const freePrice = await call('/products', {
  method: 'POST',
  token: farmer,
  body: { name: NAME, category: 'Vegetables', priceUsdCents: 0, quantity: 10 },
});
check('a price of zero is refused', freePrice.status === 400, `got ${freePrice.status}`);

/*
  An image URL goes straight into every buyer's image view. A javascript: URL
  reaching that field is how a listing becomes an attack on whoever opens it.
*/
const hostileImage = await call('/products', {
  method: 'POST',
  token: farmer,
  body: {
    name: NAME,
    category: 'Vegetables',
    priceUsdCents: 500,
    quantity: 10,
    imageUrls: ['javascript:alert(1)'],
  },
});
check('a non-http image URL is refused', hostileImage.status === 400, `got ${hostileImage.status}`);

const noName = await call('/products', {
  method: 'POST',
  token: farmer,
  body: { name: 'x', category: 'Vegetables', priceUsdCents: 500, quantity: 1 },
});
check('a one-character name is refused', noName.status === 400, `got ${noName.status}`);

// ── create as a draft ──────────────────────────────────────────────────────
const draft = await call('/products', {
  method: 'POST',
  token: farmer,
  body: {
    name: NAME,
    description: 'Picked this morning.',
    category: 'Vegetables',
    priceUsdCents: 850,
    unit: 'crate',
    quantity: 12,
    province: 'Mashonaland East',
    status: 'DRAFT',
  },
});
check(
  'a seller can save a draft',
  draft.status < 300 && draft.json?.product?.status === 'DRAFT',
  draft.status < 300 ? `id ${draft.json.product.id}` : `${draft.status} ${draft.text.slice(0, 200)}`
);

const id = draft.json?.product?.id;
/*
  The real name, not the "Seller" fallback. That fallback exists for a row
  fetched without its relation, and if it shows up here the create response is
  missing its include — the app would display it until something refetched.
*/
check(
  'the create response carries the real seller name, not the fallback',
  typeof draft.json?.product?.sellerName === 'string' &&
    draft.json.product.sellerName.length > 0 &&
    draft.json.product.sellerName !== 'Seller',
  `sellerName ${JSON.stringify(draft.json?.product?.sellerName)}`
);
/*
  Listing something for sale is not a reason to publish your phone number. The
  order flow is where the two sides are introduced.
*/
check(
  'the listing exposes no seller contact details',
  !/email|phone|passwordHash/i.test(JSON.stringify(draft.json?.product ?? {})),
  Object.keys(draft.json?.product ?? {}).join(', ')
);

if (id) {
  // ── a draft is private ───────────────────────────────────────────────────
  const shelfWhileDraft = await call('/products?limit=100', { token: buyer });
  check(
    'a draft does not appear on the public shelf',
    !(shelfWhileDraft.json?.products ?? []).some((p) => p.id === id),
    `shelf had ${(shelfWhileDraft.json?.products ?? []).length} items`
  );

  const peek = await call(`/products/${id}`, { token: buyer });
  check(
    'a stranger cannot open a draft by its id',
    peek.status >= 400,
    `got ${peek.status}`
  );

  const ownDraft = await call(`/products/${id}`, { token: farmer });
  check('the seller can open their own draft', ownDraft.status < 300, `got ${ownDraft.status}`);

  const mine = await call('/products/mine', { token: farmer });
  check(
    'the seller sees the draft in their own listings',
    (mine.json?.products ?? []).some((p) => p.id === id),
    `mine returned ${(mine.json?.products ?? []).length}`
  );

  // ── publish ──────────────────────────────────────────────────────────────
  const published = await call(`/products/${id}`, {
    method: 'PATCH',
    token: farmer,
    body: { status: 'ACTIVE' },
  });
  check(
    'the seller can publish the draft',
    published.status < 300 && published.json?.product?.status === 'ACTIVE',
    published.status < 300 ? '' : `${published.status} ${published.text.slice(0, 160)}`
  );

  const shelf = await call(`/products?search=${encodeURIComponent(NAME)}`, { token: buyer });
  check(
    'a buyer finds the published listing by name',
    (shelf.json?.products ?? []).some((p) => p.id === id),
    `search returned ${(shelf.json?.products ?? []).length}`
  );

  const wrongCategory = await call('/products?category=NoSuchCategory', { token: buyer });
  check(
    'filtering by an unused category returns nothing rather than everything',
    (wrongCategory.json?.products ?? []).length === 0,
    `got ${(wrongCategory.json?.products ?? []).length}`
  );

  // ── another seller must not be able to touch it ──────────────────────────
  const hijackEdit = await call(`/products/${id}`, {
    method: 'PATCH',
    token: buyer,
    body: { priceUsdCents: 1 },
  });
  check(
    "another account cannot edit someone else's listing",
    hijackEdit.status >= 400,
    `got ${hijackEdit.status}`
  );

  const hijackDelete = await call(`/products/${id}`, { method: 'DELETE', token: buyer });
  check(
    "another account cannot delete someone else's listing",
    hijackDelete.status >= 400,
    `got ${hijackDelete.status}`
  );

  const stillThere = await call(`/products/${id}`, { token: farmer });
  check(
    'the listing survived both attempts',
    stillThere.status < 300 && stillThere.json?.product?.priceUsdCents === 850,
    `price ${stillThere.json?.product?.priceUsdCents}`
  );

  // ── edit ─────────────────────────────────────────────────────────────────
  const edited = await call(`/products/${id}`, {
    method: 'PATCH',
    token: farmer,
    body: { priceUsdCents: 900, quantity: 6 },
  });
  check(
    'the seller can change price and quantity',
    edited.json?.product?.priceUsdCents === 900 && edited.json?.product?.quantity === 6,
    `${edited.json?.product?.priceUsdCents}c, qty ${edited.json?.product?.quantity}`
  );

  /*
    Selling out is a fact about stock, not a request. Asking to stay ACTIVE with
    nothing left must not put an unbuyable listing in front of a buyer.
  */
  const soldOut = await call(`/products/${id}`, {
    method: 'PATCH',
    token: farmer,
    body: { quantity: 0, status: 'ACTIVE' },
  });
  check(
    'a listing with no stock reads SOLD_OUT even when ACTIVE was asked for',
    soldOut.json?.product?.status === 'SOLD_OUT',
    `status ${soldOut.json?.product?.status}`
  );

  // ── delete ───────────────────────────────────────────────────────────────
  const removed = await call(`/products/${id}`, { method: 'DELETE', token: farmer });
  check('the seller can remove the listing', removed.status < 300, `got ${removed.status}`);

  const afterDelete = await call(`/products/${id}`, { token: farmer });
  check('the removed listing is gone', afterDelete.status === 404, `got ${afterDelete.status}`);

  const shelfAfter = await call(`/products?search=${encodeURIComponent(NAME)}`, { token: buyer });
  check(
    'the removed listing is off the shelf',
    !(shelfAfter.json?.products ?? []).some((p) => p.id === id),
    `shelf returned ${(shelfAfter.json?.products ?? []).length}`
  );
}

// ── anonymous access ───────────────────────────────────────────────────────
const anon = await call('/products');
check('the shelf is not readable without a token', anon.status === 401, `got ${anon.status}`);

console.log('');
if (failures > 0) {
  console.log(`${failures} CHECK(S) FAILED`);
  process.exit(1);
}
console.log('ALL CHECKS PASSED');
