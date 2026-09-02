/**
 * The key/value half of the namespace migration, isolated from React Native.
 *
 * Kept in its own module with no platform imports so it can be executed and
 * verified directly. Migrations that move a farmer's records are exactly the
 * code that should not be shipped on the strength of "it looks right".
 */

/** The slice of AsyncStorage this migration needs. */
export interface KeyValueStore {
  getAllKeys(): Promise<readonly string[]>;
  multiGet(keys: string[]): Promise<readonly (readonly [string, string | null])[]>;
  multiSet(entries: [string, string][]): Promise<void>;
  multiRemove(keys: string[]): Promise<void>;
}

export interface MigrationResult {
  /** Keys copied and verified, then removed from the old namespace. */
  moved: number;
  /** Keys that had a value but could not be verified at the new key. */
  failed: number;
  /** True when nothing was left behind and the migration need not run again. */
  complete: boolean;
}

/**
 * Re-prefixes every key from one namespace to another.
 *
 * Order matters: write, read back, and only then delete. Deleting first — or
 * trusting the write without reading it — risks a half-migrated store where the
 * data exists under neither prefix. Safe to run repeatedly; a second run over
 * an already-migrated store finds nothing and reports complete.
 */
export async function migrateKeyPrefix(
  store: KeyValueStore,
  fromPrefix: string,
  toPrefix: string
): Promise<MigrationResult> {
  const allKeys = await store.getAllKeys();
  const legacyKeys = allKeys.filter((key) => key.startsWith(fromPrefix));

  if (legacyKeys.length === 0) return { moved: 0, failed: 0, complete: true };

  const rename = (key: string) => toPrefix + key.slice(fromPrefix.length);

  const entries = await store.multiGet([...legacyKeys]);
  const values = new Map(entries.map(([key, value]) => [key, value]));

  const writes: [string, string][] = [];
  for (const key of legacyKeys) {
    const value = values.get(key);
    if (value === null || value === undefined) continue;
    writes.push([rename(key), value]);
  }

  if (writes.length > 0) await store.multiSet(writes);

  // Read back rather than assuming the write succeeded.
  const written = await store.multiGet(writes.map(([key]) => key));
  const verified = new Map(written.map(([key, value]) => [key, value]));

  const safeToRemove: string[] = [];
  let failed = 0;

  for (const key of legacyKeys) {
    const original = values.get(key);

    // A key that held nothing carries no data to lose.
    if (original === null || original === undefined) {
      safeToRemove.push(key);
      continue;
    }

    if (verified.get(rename(key)) === original) safeToRemove.push(key);
    else failed += 1;
  }

  if (safeToRemove.length > 0) await store.multiRemove(safeToRemove);

  return { moved: safeToRemove.length, failed, complete: failed === 0 };
}
