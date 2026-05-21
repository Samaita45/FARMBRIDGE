import { getJSON, setJSON } from './storage';

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
}

export async function getCached<T>(
  key: string,
  maxAgeMs: number
): Promise<T | null> {
  const entry = await getJSON<CacheEntry<T>>(`cache:${key}`);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > maxAgeMs) return null;
  return entry.data;
}

export async function setCached<T>(key: string, data: T): Promise<void> {
  await setJSON(`cache:${key}`, { data, cachedAt: Date.now() } satisfies CacheEntry<T>);
}

/** Returns cached data even if TTL expired — for offline fallback. */
export async function getStaleCached<T>(key: string): Promise<T | null> {
  const entry = await getJSON<CacheEntry<T>>(`cache:${key}`);
  return entry?.data ?? null;
}

/** Stale-while-revalidate: data + whether TTL has passed (caller may refetch in background). */
export async function getCachedWithAge<T>(
  key: string,
  maxAgeMs: number
): Promise<{ data: T | null; isStale: boolean; ageMs: number }> {
  const entry = await getJSON<CacheEntry<T>>(`cache:${key}`);
  if (!entry) return { data: null, isStale: true, ageMs: 0 };
  const ageMs = Date.now() - entry.cachedAt;
  return {
    data: entry.data,
    isStale: ageMs > maxAgeMs,
    ageMs,
  };
}

export const CACHE_TTL = {
  weather: 1000 * 60 * 60,
  crops: 1000 * 60 * 60 * 6,
  market: 1000 * 60 * 60 * 2,
  community: 1000 * 60 * 30,
} as const;
