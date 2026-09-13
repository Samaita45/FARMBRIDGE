/**
 * Walks the whole authentication lifecycle against a running API.
 *
 * Register, sign in, refresh, rotate, change password, sign out — plus the
 * refusals that matter more than the happy path: a wrong password, a reused
 * refresh token, a revoked session, and a tenant that does not exist.
 *
 * Every account it creates is unique to the run, so it can be run repeatedly
 * without cleanup and without colliding with the seeded demo users.
 *
 * Run: npm run test:auth-e2e   (needs the API on localhost:3000)
 */
const BASE = 'http://localhost:3000/v1';
const TENANT = '018f3a7c-4c1e-7a2b-9f4d-5e6a7b8c9d01';

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
    /* a non-JSON body is itself the finding; `text` is reported instead */
  }
  return { status: res.status, json, text };
}

/** Unique per run so the script is safe to run twice in a row. */
const stamp = Date.now().toString(36);
const EMAIL = `e2e-${stamp}@farmbridge.test`;
const PASSWORD = 'correct-horse-battery';
const NEXT_PASSWORD = 'a-different-long-phrase';
/** Valid Zimbabwe mobile: 07 then 1-9 then 7 digits. */
const PHONE = `07${(Math.floor(Math.random() * 9) + 1)}${String(Math.floor(Math.random() * 1e7)).padStart(7, '0')}`;

// ── register ───────────────────────────────────────────────────────────────
const registered = await call('/auth/register', {
  method: 'POST',
  body: { tenantId: TENANT, name: 'E2E Tester', email: EMAIL, phone: PHONE, password: PASSWORD },
});
check(
  'a new account can be registered',
  registered.status < 300 && Boolean(registered.json?.user?.id),
  registered.status < 300 ? EMAIL : `${registered.status} ${registered.text.slice(0, 200)}`
);
check(
  'registration returns tokens, so the app is signed in straight away',
  Boolean(registered.json?.accessToken && registered.json?.refreshToken),
  registered.json?.accessToken ? '' : 'missing tokens'
);
/*
  A registration response is the first thing the app stores about a person. It
  must not carry the password back in any form.
*/
check(
  'the registration response contains no password material',
  !/password|passwordHash/i.test(JSON.stringify(registered.json?.user ?? {})),
  Object.keys(registered.json?.user ?? {}).join(', ')
);

const duplicate = await call('/auth/register', {
  method: 'POST',
  body: { tenantId: TENANT, name: 'E2E Tester', email: EMAIL, phone: PHONE, password: PASSWORD },
});
check(
  'the same email cannot register twice',
  duplicate.status >= 400,
  `got ${duplicate.status}`
);

const weak = await call('/auth/register', {
  method: 'POST',
  body: { tenantId: TENANT, name: 'Short Pass', email: `x-${stamp}@farmbridge.test`, phone: PHONE, password: 'short' },
});
check('a password under 12 characters is refused', weak.status === 400, `got ${weak.status}`);

const badTenant = await call('/auth/register', {
  method: 'POST',
  body: {
    tenantId: '00000000-0000-4000-8000-000000000000',
    name: 'No Tenant',
    email: `nt-${stamp}@farmbridge.test`,
    phone: PHONE,
    password: PASSWORD,
  },
});
/*
  400, not 500. This was an unhandled foreign-key violation: the app showed a
  generic failure for what is really a misconfigured build, and the server
  logged a stack trace for an ordinary bad request.
*/
check(
  'an unknown tenant is refused as a client error, not a server crash',
  badTenant.status === 400,
  `got ${badTenant.status}`
);

// ── login ──────────────────────────────────────────────────────────────────
const wrong = await call('/auth/login', {
  method: 'POST',
  body: { tenantId: TENANT, email: EMAIL, password: 'not-the-password' },
});
check('a wrong password is refused', wrong.status === 401, `got ${wrong.status}`);
/*
  The failure must not distinguish "no such account" from "wrong password", or
  the endpoint becomes a way to enumerate who has an account here.
*/
check(
  'the refusal does not say whether the account exists',
  !/not found|no such|unknown user|does not exist/i.test(wrong.text),
  wrong.text.slice(0, 120)
);

const unknownUser = await call('/auth/login', {
  method: 'POST',
  body: { tenantId: TENANT, email: `ghost-${stamp}@farmbridge.test`, password: PASSWORD },
});
check(
  'an unknown account fails the same way as a wrong password',
  unknownUser.status === wrong.status,
  `${unknownUser.status} vs ${wrong.status}`
);

const signedIn = await call('/auth/login', {
  method: 'POST',
  body: { tenantId: TENANT, email: EMAIL, password: PASSWORD },
});
check(
  'the new account can sign in',
  signedIn.status === 200 && Boolean(signedIn.json?.accessToken),
  signedIn.status === 200 ? '' : `${signedIn.status} ${signedIn.text.slice(0, 160)}`
);

let access = signedIn.json?.accessToken;
let refresh = signedIn.json?.refreshToken;

// ── the access token actually opens something ──────────────────────────────
const noToken = await call('/transport/requests');
check('a protected route refuses an anonymous caller', noToken.status === 401, `got ${noToken.status}`);

const withToken = await call('/transport/requests', { token: access });
check(
  'the access token opens a protected route',
  withToken.status < 300,
  withToken.status < 300 ? '' : `${withToken.status} ${withToken.text.slice(0, 160)}`
);

const garbage = await call('/transport/requests', { token: `${access}tampered` });
check('a tampered token is refused', garbage.status === 401, `got ${garbage.status}`);

// ── refresh and rotation ───────────────────────────────────────────────────
if (refresh) {
  const rotated = await call('/auth/refresh', { method: 'POST', body: { refreshToken: refresh } });
  check(
    'a refresh token returns a fresh pair',
    rotated.status === 200 && Boolean(rotated.json?.accessToken && rotated.json?.refreshToken),
    rotated.status === 200 ? '' : `${rotated.status} ${rotated.text.slice(0, 160)}`
  );
  check(
    'refreshing rotates the refresh token rather than reusing it',
    rotated.json?.refreshToken !== refresh,
    rotated.json?.refreshToken === refresh ? 'the same token came back' : ''
  );

  /*
    The old token must be dead the moment a new one is issued. Without this a
    stolen refresh token stays valid for its full lifetime even after the real
    owner has refreshed.
  */
  const replayed = await call('/auth/refresh', { method: 'POST', body: { refreshToken: refresh } });
  check('the spent refresh token is rejected', replayed.status >= 400, `got ${replayed.status}`);

  access = rotated.json?.accessToken ?? access;
  refresh = rotated.json?.refreshToken ?? refresh;
}

const nonsense = await call('/auth/refresh', {
  method: 'POST',
  body: { refreshToken: 'not-a-real-token' },
});
check('a made-up refresh token is refused', nonsense.status >= 400, `got ${nonsense.status}`);

// ── change password ────────────────────────────────────────────────────────
const wrongCurrent = await call('/auth/change-password', {
  method: 'POST',
  token: access,
  body: { currentPassword: 'not-it', newPassword: NEXT_PASSWORD },
});
check(
  'changing the password needs the current one',
  wrongCurrent.status >= 400,
  `got ${wrongCurrent.status}`
);

const changed = await call('/auth/change-password', {
  method: 'POST',
  token: access,
  body: { currentPassword: PASSWORD, newPassword: NEXT_PASSWORD },
});
check(
  'the password can be changed',
  changed.status < 300,
  changed.status < 300 ? '' : `${changed.status} ${changed.text.slice(0, 160)}`
);

if (changed.status < 300) {
  const oldPassword = await call('/auth/login', {
    method: 'POST',
    body: { tenantId: TENANT, email: EMAIL, password: PASSWORD },
  });
  check('the old password stops working', oldPassword.status === 401, `got ${oldPassword.status}`);

  const newPassword = await call('/auth/login', {
    method: 'POST',
    body: { tenantId: TENANT, email: EMAIL, password: NEXT_PASSWORD },
  });
  check(
    'the new password works',
    newPassword.status === 200,
    newPassword.status === 200 ? '' : `${newPassword.status} ${newPassword.text.slice(0, 160)}`
  );

  access = newPassword.json?.accessToken ?? access;
  refresh = newPassword.json?.refreshToken ?? refresh;
}

// ── logout ─────────────────────────────────────────────────────────────────
const loggedOut = await call('/auth/logout', {
  method: 'POST',
  token: access,
  body: { refreshToken: refresh },
});
check(
  'signing out succeeds',
  loggedOut.status < 300,
  loggedOut.status < 300 ? '' : `${loggedOut.status} ${loggedOut.text.slice(0, 160)}`
);

const afterLogout = await call('/auth/refresh', {
  method: 'POST',
  body: { refreshToken: refresh },
});
check(
  'the refresh token is dead after signing out',
  afterLogout.status >= 400,
  `got ${afterLogout.status}`
);

console.log('');
if (failures > 0) {
  console.log(`${failures} CHECK(S) FAILED`);
  process.exit(1);
}
console.log('ALL CHECKS PASSED');
