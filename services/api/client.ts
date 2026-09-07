import {
  deleteSecureItem,
  getSecureJSON,
  setSecureJSON,
} from '@/services/secureStorage';

import { apiUrl, REQUEST_TIMEOUT_MS } from './config';
import { ApiError, apiErrorFromResponse } from './errors';

/**
 * The HTTP client.
 *
 * Everything that talks to the API goes through here so that timeouts, token
 * attachment, refresh-on-401 and error classification exist once rather than
 * being re-implemented per screen.
 */

const TOKENS_KEY = 'farmbridge.tokens';

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  /** Epoch ms. Used to refresh proactively rather than waiting for a 401. */
  expiresAt: number;
}

export async function getStoredTokens(): Promise<StoredTokens | null> {
  return getSecureJSON<StoredTokens>(TOKENS_KEY);
}

export async function storeTokens(tokens: {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}): Promise<void> {
  await setSecureJSON<StoredTokens>(
    TOKENS_KEY,
    {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: Date.now() + tokens.expiresIn * 1000,
    },
    /*
      Readable while the phone is locked, once it has been unlocked since boot.

      A transporter sharing their position on a long haul has the phone in a
      pocket with the screen off. The background task still has to authenticate
      that upload, and under the default accessibility the keychain hands back
      nothing while locked — so the task would run, read no token, post nothing,
      and the farmer would watch a pin that stopped moving. It would look
      flawless in any test done with the screen on.
    */
    'background'
  );
}

export async function clearTokens(): Promise<void> {
  await deleteSecureItem(TOKENS_KEY);
}

/**
 * Called when the session cannot be recovered, so the app can send the user
 * back to sign-in. Set once at startup by the auth store; kept as a callback so
 * this module does not depend on navigation or state.
 */
let onSessionExpired: (() => void) | null = null;

export function setSessionExpiredHandler(handler: (() => void) | null): void {
  onSessionExpired = handler;
}

/**
 * In-flight refresh, shared across callers.
 *
 * Without this, five requests failing with 401 at once would each try to
 * refresh; four would present an already-rotated token, and the server would
 * correctly treat that as reuse and revoke the whole family — logging the user
 * out precisely because the app was busy.
 */
let refreshInFlight: Promise<StoredTokens | null> | null = null;

async function refreshTokens(): Promise<StoredTokens | null> {
  refreshInFlight ??= (async () => {
    try {
      const current = await getStoredTokens();
      if (!current?.refreshToken) return null;

      const response = await fetchWithTimeout(apiUrl('/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: current.refreshToken }),
      });

      if (!response.ok) {
        await clearTokens();
        return null;
      }

      const body = (await response.json()) as {
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
      };
      await storeTokens(body);
      return getStoredTokens();
    } catch {
      // A network failure during refresh is not proof the session is invalid,
      // so the tokens are kept and the caller sees an offline error instead.
      return null;
    } finally {
      // Cleared on the next tick so concurrent callers all observe one result.
      setTimeout(() => {
        refreshInFlight = null;
      }, 0);
    }
  })();

  return refreshInFlight;
}

/**
 * A currently-valid access token, refreshing first if it is about to expire.
 *
 * The socket needs this: a WebSocket authenticates once at the handshake, so
 * connecting with a token that expires in ten seconds gives a connection the
 * server drops ten seconds later. Shares the same in-flight refresh as HTTP,
 * so a reconnect during a refresh waits for that one rather than starting a
 * second and racing the rotation.
 */
export async function getValidAccessToken(): Promise<string | null> {
  let tokens = await getStoredTokens();
  if (!tokens) return null;
  if (tokens.expiresAt - Date.now() < 30_000) {
    tokens = (await refreshTokens()) ?? tokens;
  }
  return tokens.accessToken;
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Skips the Authorization header — for login, register and refresh. */
  anonymous?: boolean;
  /** Extra headers, e.g. an idempotency key. */
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

/**
 * Performs a request and returns the parsed body.
 *
 * On a 401 it refreshes once and retries. It never refreshes twice for the
 * same request: if the retry also fails, the session is genuinely gone.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, anonymous = false, headers = {}, signal } = options;

  const send = async (accessToken: string | null): Promise<Response> => {
    const requestHeaders: Record<string, string> = {
      Accept: 'application/json',
      ...headers,
    };
    if (body !== undefined) requestHeaders['Content-Type'] = 'application/json';
    if (accessToken) requestHeaders.Authorization = `Bearer ${accessToken}`;

    return fetchWithTimeout(apiUrl(path), {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      ...(signal ? { signal } : {}),
    });
  };

  let tokens = anonymous ? null : await getStoredTokens();

  // Refresh before the request when the access token is about to expire, which
  // avoids a guaranteed 401 round trip on every call near the boundary.
  if (!anonymous && tokens && tokens.expiresAt - Date.now() < 30_000) {
    tokens = (await refreshTokens()) ?? tokens;
  }

  let response: Response;
  try {
    response = await send(tokens?.accessToken ?? null);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('timeout', 'The request timed out.', { cause: error });
    }
    throw new ApiError('offline', 'Could not reach FarmBridge.', { cause: error });
  }

  if (response.status === 401 && !anonymous) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      try {
        response = await send(refreshed.accessToken);
      } catch (error) {
        throw new ApiError('offline', 'Could not reach FarmBridge.', { cause: error });
      }
    } else {
      await clearTokens();
      onSessionExpired?.();
      throw new ApiError('unauthenticated', 'Your session has ended.', { status: 401 });
    }
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      if (response.ok) {
        throw new ApiError('unknown', 'The server sent an unreadable response.', {
          status: response.status,
        });
      }
    }
  }

  if (!response.ok) throw apiErrorFromResponse(response.status, parsed);

  return parsed as T;
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
