/**
 * On-device password hashing.
 *
 * SCOPE — read before changing the work factor. This exists to stop FarmBridge
 * storing *recoverable* passwords on the device. It is not a substitute for
 * server-side hashing: authentication moves to the backend with Argon2id, and
 * this module is retired at that point.
 *
 * Construction: salted, iterated SHA-256 via expo-crypto. Each iteration is a
 * JS→native round trip, so the work factor is deliberately modest — a low-end
 * Android phone is the target device and login has to stay responsive. The cost
 * parameters are encoded in the stored string, so they can be raised later
 * without invalidating existing hashes.
 *
 * Format: `v1$<iterations>$<saltHex>$<digestHex>`
 */
import * as Crypto from 'expo-crypto';

const VERSION = 'v1';
const DEFAULT_ITERATIONS = 500;
const SALT_BYTES = 16;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sha256(input: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input);
}

async function derive(password: string, salt: string, iterations: number): Promise<string> {
  let digest = await sha256(`${salt}:${password}`);
  for (let i = 1; i < iterations; i++) {
    digest = await sha256(`${digest}:${salt}`);
  }
  return digest;
}

/** Compares two hex digests without leaking their difference through timing. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function hashPassword(
  password: string,
  iterations: number = DEFAULT_ITERATIONS
): Promise<string> {
  const salt = toHex(await Crypto.getRandomBytesAsync(SALT_BYTES));
  const digest = await derive(password, salt, iterations);
  return `${VERSION}$${iterations}$${salt}$${digest}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 4) return false;

  const [version, iterationsRaw, salt, expected] = parts;
  if (version !== VERSION) return false;

  const iterations = Number(iterationsRaw);
  if (!Number.isInteger(iterations) || iterations < 1 || iterations > 100_000) return false;
  if (!salt || !expected) return false;

  const actual = await derive(password, salt, iterations);
  return timingSafeEqual(actual, expected);
}

/** True when a stored value is one of ours rather than a legacy plaintext password. */
export function isHashedPassword(stored: string): boolean {
  return stored.startsWith(`${VERSION}$`);
}
