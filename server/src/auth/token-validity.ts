/**
 * Whether a token predates the moment its owner's sessions were invalidated.
 *
 * THE SUBTLETY THIS EXISTS TO CONTAIN. A JWT's `iat` is expressed in whole
 * seconds, because that is what the JWT spec says. `tokensValidFrom` is a
 * database timestamp with millisecond precision. Comparing them directly —
 * `payload.iat * 1000 < tokensValidFrom.getTime()` — silently rounds the token
 * down by up to 999ms, so a token minted in the *same second* as a password
 * change looks older than the change and is treated as revoked.
 *
 * That is not a theoretical window. Changing a password sets the cutoff and
 * immediately issues a new session; both happen inside one second. The
 * end-to-end auth walk caught it as a logout that answered 401 straight after a
 * successful sign-in with the new password — the user changes their password,
 * appears to be signed in, and is thrown out by the next request.
 *
 * Comparing at second granularity fixes it. A token issued in the same second
 * as the cutoff survives, which is the intent: the cutoff exists to kill tokens
 * issued *before* the change, and the only token minted in that same second is
 * the one just handed to the person who made the change.
 *
 * It lives in one place because three call sites had their own copy of the
 * comparison — the HTTP guard, the socket gateway, and the token service — and
 * a rule about when someone is signed out should not be able to disagree with
 * itself.
 */
export function isTokenRevoked(
  issuedAtSeconds: number | undefined,
  tokensValidFrom: Date,
): boolean {
  if (!issuedAtSeconds) return false;
  return issuedAtSeconds < Math.floor(tokensValidFrom.getTime() / 1000);
}
