/**
 * One-time migration from the `zimfarm` namespace to `farmbridge`.
 *
 * The app was built as ZimFarm and renamed to FarmBridge, but its storage
 * namespaces were never renamed with it: AsyncStorage keys were prefixed
 * `zimfarm:`, MMKV used the instance id `zimfarm-storage`, and the SQLite file
 * was `zimfarm.db`. Renaming those without moving the data would make every
 * existing crop plan, task, financial record and order invisible.
 *
 * DESIGN PRINCIPLE: never lose data. Every step here copies before it removes,
 * verifies before it deletes, and falls back to the old namespace if anything
 * goes wrong. A failed migration must leave a farmer with their records intact
 * under the old names, not with an empty app.
 */
import { fastGet, fastSet } from '@/services/fastStorage';

import { migrateKeyPrefix } from './kv-migration';

const LEGACY_PREFIX = 'zimfarm:';
const CURRENT_PREFIX = 'farmbridge:';

export const LEGACY_DB_NAME = 'zimfarm.db';
export const CURRENT_DB_NAME = 'farmbridge.db';

/** Set once the migration has completed, so it never runs twice. */
const MIGRATION_FLAG = 'farmbridge:migration:namespace-v1';

async function getAsyncStorage() {
  try {
    const mod = await import('@react-native-async-storage/async-storage');
    return mod.default;
  } catch {
    return null;
  }
}

/**
 * Moves AsyncStorage keys onto the new prefix.
 *
 * The algorithm lives in `kv-migration`, which has no React Native imports so
 * it can be executed directly — see `scripts/test-kv-migration.ts`.
 */
async function migrateAsyncStorage(): Promise<{ moved: number; failed: number }> {
  const store = await getAsyncStorage();
  if (!store) return { moved: 0, failed: 0 };

  const result = await migrateKeyPrefix(
    {
      getAllKeys: () => store.getAllKeys(),
      multiGet: (keys) => store.multiGet(keys),
      multiSet: (entries) => store.multiSet(entries),
      multiRemove: (keys) => store.multiRemove(keys),
    },
    LEGACY_PREFIX,
    CURRENT_PREFIX
  );

  return { moved: result.moved, failed: result.failed };
}

/**
 * Copies MMKV values into the renamed instance.
 *
 * Best-effort by design: MMKV only holds a remembered email, queue snapshots
 * and a notification id — all regenerable. It is also unavailable in Expo Go,
 * where this is a no-op.
 */
function migrateFastStorage(): number {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { MMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv');
    const legacy = new MMKV({ id: 'zimfarm-storage' });
    const keys = legacy.getAllKeys();
    let moved = 0;
    for (const key of keys) {
      const value = legacy.getString(key);
      if (value === undefined) continue;
      fastSet(key, value);
      moved += 1;
    }
    return moved;
  } catch {
    return 0;
  }
}

/**
 * Decides which SQLite file to open, copying the legacy one across on first
 * run.
 *
 * Returns the legacy name if the copy cannot be completed, so a failure here
 * degrades to "still using the old file" rather than "your records are gone".
 */
export async function resolveDatabaseName(): Promise<string> {
  try {
    const [{ Directory, File }, SQLite] = await Promise.all([
      import('expo-file-system'),
      import('expo-sqlite'),
    ]);

    // Asking the library where it keeps databases, rather than assuming
    // documents/SQLite — that path differs between platforms and is not ours
    // to guess.
    const sqliteDir = new Directory(SQLite.defaultDatabaseDirectory);
    if (!sqliteDir.exists) return CURRENT_DB_NAME;

    const legacy = new File(sqliteDir, LEGACY_DB_NAME);
    const current = new File(sqliteDir, CURRENT_DB_NAME);

    if (!legacy.exists) return CURRENT_DB_NAME;
    // Already migrated on a previous launch.
    if (current.exists) return CURRENT_DB_NAME;

    // Copy rather than move: the original stays as a backup until someone
    // deliberately removes it. Disk is cheaper than a farmer's season of
    // records.
    legacy.copy(current);

    // Write-ahead logging leaves sidecar files; without them the copy can open
    // missing recent transactions.
    for (const suffix of ['-wal', '-shm']) {
      const sidecar = new File(sqliteDir, LEGACY_DB_NAME + suffix);
      if (sidecar.exists) {
        sidecar.copy(new File(sqliteDir, CURRENT_DB_NAME + suffix));
      }
    }

    return current.exists ? CURRENT_DB_NAME : LEGACY_DB_NAME;
  } catch {
    // Any failure means we keep reading the file we know is intact.
    return LEGACY_DB_NAME;
  }
}

/**
 * Runs the key-value parts of the migration. Safe to call on every launch;
 * does nothing after the first successful run.
 *
 * The SQLite side is handled separately by `resolveDatabaseName`, because it
 * has to happen before the database is opened rather than alongside it.
 */
export async function migrateNamespace(): Promise<void> {
  if (fastGet(MIGRATION_FLAG) === 'done') return;

  try {
    const { failed } = await migrateAsyncStorage();
    migrateFastStorage();

    // Only mark it done if nothing was left behind, so a partial run is
    // retried on the next launch rather than silently abandoned.
    if (failed === 0) fastSet(MIGRATION_FLAG, 'done');
  } catch {
    // Left unflagged, so the next launch tries again.
  }
}
