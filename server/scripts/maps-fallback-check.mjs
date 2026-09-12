/**
 * Guards one rule: a failing Google Maps call must never fail a request.
 *
 * WHY THIS EXISTS. RoutesService used to call the Routes API inside its
 * `configured` check with nothing around it. `postJson` throws on any non-OK
 * response, so the straight-line fallback underneath was unreachable whenever
 * the API actually failed — it only ran when there was no key at all. The state
 * that exposes it is completely ordinary: a key pasted into the environment
 * before billing is switched on returns 403, and every single transport request
 * on the platform answered 502 instead of costing a slightly rougher distance.
 * It was demonstrated, not theorised: the transport end-to-end walk failed at
 * "request created with coordinates" with exactly that 502.
 *
 * This constructs the services directly rather than through Nest. They are
 * plain classes, the collaborators are two small interfaces, and a container
 * would only obscure what is being asserted.
 *
 * Run: npm run build && node scripts/maps-fallback-check.mjs
 */
import { GeocodingService } from '../dist/maps/geocoding.service.js';
import { RoutesService } from '../dist/maps/routes.service.js';

let failures = 0;

function check(label, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures += 1;
}

/** A key that Google rejects: configured, and failing on every call. */
const rejectingClient = {
  configured: true,
  requireKey: () => 'AIza-configured-but-not-billed',
  getJson: () => Promise.reject(new Error('Maps request failed.')),
  postJson: () => Promise.reject(new Error('Maps request failed.')),
};

/** No key at all — the case that always worked. */
const absentClient = {
  configured: false,
  requireKey: () => {
    throw new Error('Maps are not configured on this server.');
  },
  getJson: () => Promise.reject(new Error('should not be called')),
  postJson: () => Promise.reject(new Error('should not be called')),
};

const noCache = { get: () => undefined, set: () => {} };

const HARARE = { latitude: -17.8292, longitude: 31.0522 };
const BULAWAYO = { latitude: -20.1594, longitude: 28.5886 };

// ── routes ─────────────────────────────────────────────────────────────────
{
  const routes = new RoutesService(rejectingClient, noCache);
  let estimate = null;
  let threw = null;
  try {
    estimate = await routes.compute(HARARE, BULAWAYO);
  } catch (error) {
    threw = error;
  }

  check(
    'a rejected Routes call still returns an estimate',
    threw === null && estimate !== null,
    threw ? `threw ${threw.message}` : `${estimate?.distanceKm} km`
  );
  check(
    'the estimate is marked as the fallback, not a road route',
    estimate?.source === 'gazetteer',
    `source ${estimate?.source}`
  );
  check(
    'the fallback distance is plausible for Harare to Bulawayo',
    typeof estimate?.distanceKm === 'number' &&
      estimate.distanceKm > 300 &&
      estimate.distanceKm < 600,
    `${estimate?.distanceKm} km`
  );
  check(
    'the fallback carries a duration a screen can show',
    typeof estimate?.durationSeconds === 'number' && estimate.durationSeconds > 0,
    `${estimate?.durationSeconds}s`
  );
}

{
  const routes = new RoutesService(absentClient, noCache);
  const estimate = await routes.compute(HARARE, BULAWAYO);
  check(
    'an absent key also falls back rather than throwing',
    estimate?.source === 'gazetteer',
    `${estimate?.distanceKm} km`
  );
}

// ── geocoding ──────────────────────────────────────────────────────────────
{
  const geocoding = new GeocodingService(rejectingClient, noCache);
  let result;
  let threw = null;
  try {
    result = await geocoding.geocode('Chinhoyi');
  } catch (error) {
    threw = error;
  }
  check(
    'a rejected geocode answers null instead of throwing',
    threw === null && result === null,
    threw ? `threw ${threw.message}` : 'null'
  );
}

{
  const geocoding = new GeocodingService(absentClient, noCache);
  let result;
  let threw = null;
  try {
    result = await geocoding.geocode('Chinhoyi');
  } catch (error) {
    // Caught rather than allowed to escape: an unhandled rejection here would
    // end the run with a stack trace instead of the failing check that explains
    // what broke, which is the whole point of a guard.
    threw = error;
  }
  check(
    'an absent key geocodes to null, not a 503',
    threw === null && result === null,
    threw ? `threw ${threw.message}` : `${result}`
  );
}

console.log('');
if (failures > 0) {
  console.log(`${failures} CHECK(S) FAILED`);
  process.exit(1);
}
console.log('ALL CHECKS PASSED');
