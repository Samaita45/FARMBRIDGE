import type { User, UserRole } from '@/types';

import { getJSON, setJSON, removeItem } from './storage';
import { fastGetAsync, fastRemove, fastSetAsync } from './fastStorage';

const USERS_KEY = 'users';
const CURRENT_USER_KEY = 'current_user';
const REMEMBER_EMAIL_KEY = 'remember_email';
const REMEMBER_PASSWORD_KEY = 'remember_password';

// ─── Built-in demo account (always available, survives app restarts) ──────────
const DEMO_USER: StoredUser = {
  id: 'demo_user_001',
  name: 'Demo Farmer',
  email: 'demo@farmbridge.zw',
  phone: '+263771234567',
  role: 'farmer',
  province: 'Harare',
  password: 'demo1234',
  subscription: { planId: 'basic', isActive: true },
  createdAt: '2025-01-01T00:00:00.000Z',
};

export interface StoredUser extends User {
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  province: string;
}

async function getAllUsers(): Promise<StoredUser[]> {
  const stored = (await getJSON<StoredUser[]>(USERS_KEY)) ?? [];
  // Always include the demo account (deduplicate by id)
  const hasDemo = stored.some((u) => u.id === DEMO_USER.id);
  return hasDemo ? stored : [DEMO_USER, ...stored];
}

async function saveAllUsers(users: StoredUser[]): Promise<void> {
  await setJSON(USERS_KEY, users);
}

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
    password: input.password,
    subscription: { planId: 'basic', isActive: false },
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  await saveAllUsers(users);
  await setCurrentUser(user);
  return stripPassword(user);
}

export async function loginUser(email: string, password: string): Promise<User> {
  const users = await getAllUsers();
  const normalized = normalizeEmail(email);
  const found = users.find(
    (u) => normalizeEmail(u.email) === normalized && u.password === password
  );

  if (!found) {
    throw new Error('Invalid email or password.');
  }

  await setCurrentUser(found);
  return stripPassword(found);
}

export async function getCurrentUser(): Promise<User | null> {
  return getJSON<User>(CURRENT_USER_KEY);
}

async function setCurrentUser(user: StoredUser): Promise<void> {
  await setJSON(CURRENT_USER_KEY, stripPassword(user));
}

export async function logoutUser(): Promise<void> {
  await removeItem(CURRENT_USER_KEY);
}

export async function setRememberMe(
  email: string,
  password: string,
  remember: boolean
): Promise<void> {
  if (remember) {
    await fastSetAsync(REMEMBER_EMAIL_KEY, normalizeEmail(email));
    await fastSetAsync(REMEMBER_PASSWORD_KEY, password);
  } else {
    fastRemove(REMEMBER_EMAIL_KEY);
    fastRemove(REMEMBER_PASSWORD_KEY);
  }
}

export async function getRememberedCredentials(): Promise<{
  email: string;
  password: string;
} | null> {
  const email = await fastGetAsync(REMEMBER_EMAIL_KEY);
  const password = await fastGetAsync(REMEMBER_PASSWORD_KEY);
  if (email && password) return { email, password };
  return null;
}

export async function sendPasswordResetCode(phone: string): Promise<string> {
  const users = await getAllUsers();
  const normalized = normalizePhone(phone);
  const found = users.find((u) => u.phone === normalized);

  if (!found) {
    throw new Error('No account found with this phone number.');
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  await setJSON(`reset_code:${normalized}`, { code, expires: Date.now() + 10 * 60 * 1000 });
  return code;
}

export async function verifyResetCode(phone: string, code: string): Promise<boolean> {
  const normalized = normalizePhone(phone);
  const data = await getJSON<{ code: string; expires: number }>(`reset_code:${normalized}`);
  if (!data) return false;
  if (Date.now() > data.expires) return false;
  return data.code === code;
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User> {
  const users = await getAllUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) throw new Error('User not found.');

  const merged = { ...users[idx], ...updates };
  users[idx] = merged;
  await saveAllUsers(users);

  const current = await getCurrentUser();
  const publicUser = stripPassword(merged);
  if (current?.id === userId) {
    await setJSON(CURRENT_USER_KEY, publicUser);
  }
  return publicUser;
}

function stripPassword(user: StoredUser): User {
  const { password: _, ...rest } = user;
  return rest;
}
