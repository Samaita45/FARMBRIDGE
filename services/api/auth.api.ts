import type { User, UserRole } from '@/types';

import { api, clearTokens, storeTokens } from './client';
import { TENANT_ID } from './config';

/**
 * Auth endpoints.
 *
 * Maps the server's shape onto the app's `User` so screens keep using one type
 * whether the session came from the API or from the device-local fallback.
 */

interface ServerUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  roles: string[];
  tenantId: string;
  province: string | null;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: ServerUser;
}

/**
 * The server's nine roles collapse onto the app's three today.
 *
 * The app's UserRole predates the RBAC model and only distinguishes what the
 * UI branches on. Privileged roles map to 'both' so an admin sees the full
 * feature set; real capability checks belong on the server, never here.
 */
function toAppRole(roles: string[]): UserRole {
  if (roles.includes('FARMER_BUYER')) return 'both';
  if (roles.includes('BUYER') && roles.includes('FARMER')) return 'both';
  if (roles.includes('BUYER')) return 'buyer';
  if (roles.includes('FARMER')) return 'farmer';
  return 'both';
}

function toAppUser(user: ServerUser): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: toAppRole(user.roles),
    province: user.province ?? '',
    // Entitlement is server-owned once the subscriptions endpoint exists. Until
    // then a fresh server session starts unsubscribed rather than inheriting
    // whatever the device happened to have stored.
    subscription: { planId: 'basic', isActive: false },
    createdAt: new Date().toISOString(),
  };
}

export async function apiRegister(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  province: string;
}): Promise<User> {
  const response = await api.post<AuthResponse>(
    '/auth/register',
    {
      tenantId: TENANT_ID,
      name: input.name,
      email: input.email,
      phone: input.phone,
      password: input.password,
      role: input.role === 'both' ? 'FARMER_BUYER' : input.role === 'buyer' ? 'BUYER' : 'FARMER',
      province: input.province,
    },
    { anonymous: true }
  );

  await storeTokens(response);
  return toAppUser(response.user);
}

export async function apiLogin(email: string, password: string): Promise<User> {
  const response = await api.post<AuthResponse>(
    '/auth/login',
    { tenantId: TENANT_ID, email, password },
    { anonymous: true }
  );

  await storeTokens(response);
  return toAppUser(response.user);
}

export async function apiLogout(refreshToken: string | undefined): Promise<void> {
  try {
    if (refreshToken) await api.post<void>('/auth/logout', { refreshToken });
  } finally {
    // The local session is cleared whether or not the server was reachable —
    // "sign out" must always sign the user out of this device.
    await clearTokens();
  }
}

export async function apiChangePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await api.post<void>('/auth/change-password', { currentPassword, newPassword });
}
