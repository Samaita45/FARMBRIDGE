import { fastGetAsync, fastRemove, fastSetAsync } from '@/services/fastStorage';

const KEY = 'market.recentSearches';
const MAX = 8;

/**
 * The last few things this person searched the marketplace for.
 *
 * Kept on the device only. A search term is a reasonable proxy for what someone
 * is short of or planning to plant, and there is no reason for that to leave
 * the phone — so it does not go through the sync queue.
 *
 * Capped at eight because the list is a set of chips on one screen, not a
 * history: past that it stops being a shortcut and starts being clutter.
 */
export async function getRecentSearches(): Promise<string[]> {
  const raw = await fastGetAsync(KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === 'string' && v.length > 0).slice(0, MAX);
  } catch {
    // A corrupt value is not worth surfacing — an empty history is harmless.
    return [];
  }
}

/** Records a term, most recent first, without duplicating one already held. */
export async function addRecentSearch(term: string): Promise<string[]> {
  const clean = term.trim();
  if (clean.length < 2) return getRecentSearches();

  const existing = await getRecentSearches();
  const next = [clean, ...existing.filter((t) => t.toLowerCase() !== clean.toLowerCase())].slice(
    0,
    MAX
  );
  await fastSetAsync(KEY, JSON.stringify(next));
  return next;
}

export async function removeRecentSearch(term: string): Promise<string[]> {
  const next = (await getRecentSearches()).filter((t) => t !== term);
  await fastSetAsync(KEY, JSON.stringify(next));
  return next;
}

export async function clearRecentSearches(): Promise<void> {
  fastRemove(KEY);
  await fastSetAsync(KEY, JSON.stringify([]));
}
