/**
 * Device-local authentication.
 *
 * INTERIM. FarmBridge has no backend yet, so accounts live on the device. This
 * module's job is to make that arrangement safe to ship, not to pretend it is
 * real authentication:
 *
 *   - passwords are stored only as salted, iterated hashes (never recoverable)
 *   - the session lives in the platform keystore and expires
 *   - password reset is disabled rather than simulated on-device
 *
 * When the backend lands, this becomes a thin client over the auth API and the
 * local user table is retired. Anything added here should be written with that
 * migration in mind.
 */
import { hashPassword, isHashedPassword, verifyPassword } from '@/lib/password';
import type { User, UserRole } from '@/types';

import { getJSON, removeItem, setJSON } from './storage';
import { fastGetAsync, fastRemove, fastSetAsync } from './fastStorage';
import { deleteSecureItem, getSecureJSON, setSecureJSON } from './secureStorage';

const USERS_KEY = 'users';
const REMEMBER_EMAIL_KEY = 'remember_email';

/** Retired keys, purged on startup. Do not reuse these names. */
const LEGACY_CURRENT_USER_KEY = 'current_user';
const LEGACY_REMEMBER_PASSWORD_KEY = 'remember_password';

const SESSION_KEY = 'farmbridge.session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface StoredUser extends User {
  /** Salted hash produced by `lib/password`. Never a plaintext password. */
  passwordHash: string;
}

/** A stored record written before hashing existed. */
type LegacyStoredUser = User & { password?: string; passwordHash?: string };

interface Session {
  userId: string;
  issuedAt: number;
  expiresAt: number;
}

export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  province: string;
}

// ─── Development-only demo account ───────────────────────────────────────────
// Guarded by __DEV__ so it is stripped from release builds. It is seeded with a
// hashed password on first use like any other account.

const DEMO_USER_ID = 'demo_user_001';
const DEMO_EMAIL = 'demo@farmbridge.zw';
const DEMO_PASSWORD = 'demo1234';

function demoUserTemplate(): Omit<StoredUser, 'passwordHash'> {
  return {
    id: DEMO_USER_ID,
    name: 'Demo Farmer',
    email: DEMO_EMAIL,
    phone: '+263771234567',
    role: 'farmer',
    province: 'Harare',
    subscription: { planId: 'basic', isActive: true },
    createdAt: '2025-01-01T00:00:00.000Z',
  };
}

/**
 * Adds the demo account in development, and removes it in release builds — an
 * install that already carries one from an earlier version must not keep it.
 */
async function reconcileDemoUser(users: StoredUser[]): Promise<StoredUser[]> {
  if (!__DEV__) {
    if (!users.some((u) => u.id === DEMO_USER_ID)) return users;
    const stripped = users.filter((u) => u.id !== DEMO_USER_ID);
    await saveAllUsers(stripped);
    return stripped;
  }

  if (users.some((u) => u.id === DEMO_USER_ID)) return users;
  const seeded: StoredUser = {
    ...demoUserTemplate(),
    passwordHash: await hashPassword(DEMO_PASSWORD),
  };
  const next = [seeded, ...users];
  await saveAllUsers(next);
  return next;
}

// ─── Storage ─────────────────────────────────────────────────────────────────

/**
 * Upgrades any record still holding a plaintext password. The account id is
 * preserved, so crop plans, tasks and financial records stay linked to it.
 */
async function migrateLegacyRecords(raw: LegacyStoredUser[]): Promise<{
  users: StoredUser[];
  changed: boolean;
}> {
  let changed = false;
  const users: StoredUser[] = [];

  for (const record of raw) {
    const { password, passwordHash, ...profile } = record;

    if (passwordHash && isHashedPassword(passwordHash)) {
      users.push({ ...profile, passwordHash });
      continue;
    }

    if (password) {
      users.push({ ...profile, passwordHash: await hashPassword(password) });
      changed = true;
      continue;
    }

    // Neither form present — the account cannot authenticate. Keep the profile
    // so its data stays addressable, with a hash nothing can match.
    users.push({ ...profile, passwordHash: 'v1$500$deadbeef$unusable' });
    changed = true;
  }

  return { users, changed };
}

async function getAllUsers(): Promise<StoredUser[]> {
  const raw = (await getJSON<LegacyStoredUser[]>(USERS_KEY)) ?? [];
  const { users, changed } = await migrateLegacyRecords(raw);
  if (changed) await saveAllUsers(users);
  return reconcileDemoUser(users);
}

async function saveAllUsers(users: StoredUser[]): Promise<void> {
  await setJSON(USERS_KEY, users);
}

/**
 * Removes credential material written by earlier versions. Safe to call
 * repeatedly; runs once at startup.
 */
export async function purgeLegacyCredentials(): Promise<void> {
  await removeItem(LEGACY_CURRENT_USER_KEY);
  fastRemove(LEGACY_REMEMBER_PASSWORD_KEY);
  // Re-reading the table rewrites any plaintext password as a hash.
  await getAllUsers();
}

// ─── Normalisation ───────────────────────────────────────────────────────────

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('263')) return `+${digits}`;
  if (digits.startsWith('0')) return `+263${digits.slice(1)}`;
  if (digits.length === 9) return `+263${digits}`;
  return `+${digits}`;
}

function toPublicUser(user: StoredUser): User {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

// ─── Session ─────────────────────────────────────────────────────────────────

async function startSession(userId: string): Promise<void> {
  const now = Date.now();
  await setSecureJSON<Session>(SESSION_KEY, {
    userId,
    issuedAt: now,
    expiresAt: now + SESSION_TTL_MS,
  });
}

async function readValidSession(): Promise<Session | null> {
  const session = await getSecureJSON<Session>(SESSION_KEY);
  if (!session) return null;
  if (typeof session.expiresAt !== 'number' || Date.now() > session.expiresAt) {
    await deleteSecureItem(SESSION_KEY);
    return null;
  }
  return session;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function registerUser(input: RegisterInput): Promise<User> {
  const users = await getAllUsers();
  const email = normalizeEmail(input.email);

  if (users.some((u) => normalizeEmail(u.email) === email)) {
    throw new Error('An account with this email already exists.');
  }

  const user: StoredUser = {
    id: `user_${Date.now()}`,
    name: input.name.trim(),
    email,
    phone: normalizePhone(input.phone),
    role: input.role,
    province: input.province,
    passwordHash: await hashPassword(input.password),
    subscription: { planId: 'basic', isActive: false },
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  await saveAllUsers(users);
  await startSession(user.id);
  return toPublicUser(user);
}

export async function loginUser(email: string, password: string): Promise<User> {
  const users = await getAllUsers();
  const normalized = normalizeEmail(email);
  const found = users.find((u) => normalizeEmail(u.email) === normalized);

  // Verify even when no account matched, so a missing account and a wrong
  // password take comparable time and cannot be told apart.
  const hash = found?.passwordHash ?? (await hashPassword(password));
  const ok = await verifyPassword(password, hash);

  if (!found || !ok) {
    throw new Error('Invalid email or password.');
  }

  await startSession(found.id);
  return toPublicUser(found);
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await readValidSession();
  if (!session) return null;

  const users = await getAllUsers();
  const found = users.find((u) => u.id === session.userId);
  if (!found) {
    await deleteSecureItem(SESSION_KEY);
    return null;
  }
  return toPublicUser(found);
}

export async function logoutUser(): Promise<void> {
  await deleteSecureItem(SESSION_KEY);
}

/**
 * Remembers the email address only. Passwords are never persisted for
 * convenience — the previous version stored them in cleartext.
 */
export async function setRememberMe(email: string, remember: boolean): Promise<void> {
  if (remember) {
    await fastSetAsync(REMEMBER_EMAIL_KEY, normalizeEmail(email));
  } else {
    fastRemove(REMEMBER_EMAIL_KEY);
  }
}

export async function getRememberedEmail(): Promise<string | null> {
  return fastGetAsync(REMEMBER_EMAIL_KEY);
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User> {
  const users = await getAllUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) throw new Error('User not found.');

  // A profile update must never be able to overwrite credentials.
  const { id: _id, ...safeUpdates } = updates;
  const merged: StoredUser = { ...users[idx], ...safeUpdates };
  users[idx] = merged;
  await saveAllUsers(users);

  return toPublicUser(merged);
}

/** Dev-only helper so the demo account can be offered on the login screen. */
export function getDemoCredentials(): { email: string; password: string } | null {
  return __DEV__ ? { email: DEMO_EMAIL, password: DEMO_PASSWORD } : null;
}
