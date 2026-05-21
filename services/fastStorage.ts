const PREFIX = 'zimfarm:fast:';

type MMKVInstance = {
  getString: (k: string) => string | undefined;
  set: (k: string, v: string) => void;
  delete: (k: string) => void;
};

let mmkv: MMKVInstance | null = null;

try {
  // MMKV requires a dev build; falls back to AsyncStorage in Expo Go.
  const { MMKV } = require('react-native-mmkv');
  const instance = new MMKV({ id: 'zimfarm-storage' });
  mmkv = {
    getString: (k) => instance.getString(k),
    set: (k, v) => instance.set(k, v),
    delete: (k) => instance.delete(k),
  };
} catch {
  mmkv = null;
}

async function getAsyncStorage() {
  try {
    const mod = await import('@react-native-async-storage/async-storage');
    return (mod as unknown as { default: typeof import('@react-native-async-storage/async-storage').default }).default;
  } catch {
    return null;
  }
}

export function fastGet(key: string): string | null {
  if (mmkv) {
    return mmkv.getString(key) ?? null;
  }
  return null;
}

export async function fastGetAsync(key: string): Promise<string | null> {
  const sync = fastGet(key);
  if (sync !== null) return sync;
  const AsyncStorage = await getAsyncStorage();
  if (!AsyncStorage) return null;
  return AsyncStorage.getItem(`${PREFIX}${key}`);
}

export function fastSet(key: string, value: string): void {
  if (mmkv) {
    mmkv.set(key, value);
    return;
  }
  void getAsyncStorage().then((AS) => AS?.setItem(`${PREFIX}${key}`, value));
}

export async function fastSetAsync(key: string, value: string): Promise<void> {
  if (mmkv) {
    mmkv.set(key, value);
    return;
  }
  const AsyncStorage = await getAsyncStorage();
  if (AsyncStorage) {
    await AsyncStorage.setItem(`${PREFIX}${key}`, value);
  }
}

export function fastRemove(key: string): void {
  if (mmkv) {
    mmkv.delete(key);
    return;
  }
  void getAsyncStorage().then((AS) => AS?.removeItem(`${PREFIX}${key}`));
}
