/**
 * Fast synchronous key/value storage.
 *
 * MMKV when it is available (a development or production build), and an
 * in-memory mirror backed by AsyncStorage otherwise, which is what Expo Go
 * gets.
 *
 * THE MIRROR EXISTS BECAUSE OF A REAL BUG. `fastSet` wrote to AsyncStorage
 * while `fastGet` returned null unconditionally whenever MMKV was missing, so
 * every synchronous read came back empty no matter what had been stored. In
 * Expo Go that made the offline sync queue and the SMS reminder queue
 * write-only: work was queued and then silently lost, which is the opposite of
 * what an offline-first app promises. The mirror keeps reads and writes
 * consistent on both paths.
 *
 * Call `hydrateFastStorage()` once at startup so the mirror is populated before
 * anything reads it.
 */
const PREFIX = 'farmbridge:fast:';

type MMKVInstance = {
  getString: (k: string) => string | undefined;
  set: (k: string, v: string) => void;
  delete: (k: string) => void;
  getAllKeys: () => string[];
};

let mmkv: MMKVInstance | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv');
  const instance = new MMKV({ id: 'farmbridge-storage' });
  mmkv = {
    getString: (k) => instance.getString(k),
    set: (k, v) => instance.set(k, v),
    delete: (k) => instance.delete(k),
    getAllKeys: () => instance.getAllKeys(),
  };
} catch {
  mmkv = null;
}

/** Synchronous view of AsyncStorage, used only when MMKV is unavailable. */
const mirror = new Map<string, string>();
let hydrated = false;

async function getAsyncStorage() {
  try {
    const mod = await import('@react-native-async-storage/async-storage');
    return mod.default;
  } catch {
    return null;
  }
}

/**
 * Loads persisted values into the mirror. A no-op when MMKV is present, and
 * safe to call more than once.
 */
export async function hydrateFastStorage(): Promise<void> {
  if (mmkv || hydrated) return;
  const store = await getAsyncStorage();
  if (!store) return;

  try {
    const keys = (await store.getAllKeys()).filter((k) => k.startsWith(PREFIX));
    if (keys.length > 0) {
      for (const [key, value] of await store.multiGet(keys)) {
        if (value !== null) mirror.set(key.slice(PREFIX.length), value);
      }
    }
  } finally {
    // Marked hydrated even on failure: an empty mirror that accepts writes is
    // better than one that reloads on every access.
    hydrated = true;
  }
}

export function fastGet(key: string): string | null {
  if (mmkv) return mmkv.getString(key) ?? null;
  return mirror.get(key) ?? null;
}

export async function fastGetAsync(key: string): Promise<string | null> {
  const sync = fastGet(key);
  if (sync !== null) return sync;
  if (mmkv) return null;

  // The mirror may not be hydrated yet; fall through to the real store.
  const store = await getAsyncStorage();
  if (!store) return null;
  const value = await store.getItem(`${PREFIX}${key}`);
  if (value !== null) mirror.set(key, value);
  return value;
}

export function fastSet(key: string, value: string): void {
  if (mmkv) {
    mmkv.set(key, value);
    return;
  }
  // The mirror updates immediately so a following fastGet sees the write, and
  // the persisted copy catches up.
  mirror.set(key, value);
  void getAsyncStorage().then((store) => store?.setItem(`${PREFIX}${key}`, value));
}

export async function fastSetAsync(key: string, value: string): Promise<void> {
  if (mmkv) {
    mmkv.set(key, value);
    return;
  }
  mirror.set(key, value);
  const store = await getAsyncStorage();
  await store?.setItem(`${PREFIX}${key}`, value);
}

export function fastRemove(key: string): void {
  if (mmkv) {
    mmkv.delete(key);
    return;
  }
  mirror.delete(key);
  void getAsyncStorage().then((store) => store?.removeItem(`${PREFIX}${key}`));
}

/** True when values persist synchronously. False in Expo Go. */
export function isFastStorageNative(): boolean {
  return mmkv !== null;
}
