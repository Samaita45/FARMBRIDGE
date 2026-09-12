import { Platform } from 'react-native';

/**
 * API endpoint configuration.
 *
 * The base URL comes from EXPO_PUBLIC_API_URL. When it is unset the app runs
 * fully local — which is the current default, so an install with no backend
 * keeps working exactly as it does today rather than failing every request.
 */

/**
 * Android emulators cannot reach the host's localhost; 10.0.2.2 is the bridge.
 * A physical phone needs the machine's LAN address instead, which is why this
 * is only a development convenience and never a production default.
 */
function developmentFallback(): string | null {
  if (!__DEV__) return null;
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
}

const configured = process.env.EXPO_PUBLIC_API_URL?.trim();

export const API_BASE_URL: string | null =
  configured && configured.length > 0 ? configured.replace(/\/+$/, '') : developmentFallback();

/**
 * Whether the app should talk to a server at all.
 *
 * False means every feature runs against local SQLite, which is the honest
 * state of a fresh checkout. Nothing should silently behave as if a backend
 * exists.
 */
export const IS_API_ENABLED = process.env.EXPO_PUBLIC_API_ENABLED === 'true' && !!API_BASE_URL;

/**
 * The tenant this build belongs to.
 *
 * Single-tenant today; the value is sent on auth calls so the server can scope
 * the account without the app having to know about tenancy. Multi-tenant
 * builds will resolve this per install rather than from the bundle.
 */
export const TENANT_ID = process.env.EXPO_PUBLIC_TENANT_ID?.trim() ?? '';

export const API_VERSION = 'v1';

/** Requests are aborted after this long rather than hanging a screen forever. */
export const REQUEST_TIMEOUT_MS = 15_000;

export function apiUrl(path: string): string {
  if (!API_BASE_URL) throw new Error('API_BASE_URL is not configured');
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}/${API_VERSION}${clean}`;
}
