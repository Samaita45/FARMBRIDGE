/**
 * Secure key/value storage for credentials and session material.
 *
 * Native (iOS/Android): expo-secure-store — Keychain / EncryptedSharedPreferences.
 * Web: falls back to AsyncStorage, which is NOT encrypted. Nothing that must stay
 * secret should be relied upon on web; the fallback exists so the web target keeps
 * building, not so that it keeps its promises.
 *
 * Values are capped at ~2KB by the underlying platform, so store identifiers and
 * tokens here — never whole records.
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const WEB_FALLBACK_PREFIX = 'farmbridge:insecure-fallback:';

/**
 * When the operating system will hand a value back.
 *
 * `locked` is expo-secure-store's default (WHEN_UNLOCKED): the value is
 * unreadable while the screen is locked. That is the right default for almost
 * everything, and it is wrong for exactly one thing — the session a background
 * task needs to post a driver's position from a phone in a pocket. Reading it
 * there returns null on a locked device, so the upload silently never happens,
 * and it looks perfect on a desk with the screen on.
 *
 * `background` (AFTER_FIRST_UNLOCK) stays readable once the phone has been
 * unlocked at least once since it was powered on. Use it only where a task has
 * to run without the owner present.
 */
export type SecureReadability = 'locked' | 'background';

function accessibility(readability: SecureReadability | undefined) {
  return readability === 'background'
    ? SecureStore.AFTER_FIRST_UNLOCK
    : SecureStore.WHEN_UNLOCKED;
}

/** True when the platform can actually keep this data secret. */
export function isSecureStorageAvailable(): boolean {
  return Platform.OS !== 'web';
}

async function webStore() {
  const mod = await import('@react-native-async-storage/async-storage');
  return mod.default;
}

export async function setSecureItem(
  key: string,
  value: string,
  readability?: SecureReadability
): Promise<void> {
  if (!isSecureStorageAvailable()) {
    const store = await webStore();
    await store.setItem(`${WEB_FALLBACK_PREFIX}${key}`, value);
    return;
  }
  await SecureStore.setItemAsync(key, value, {
    keychainAccessible: accessibility(readability),
  });
}

export async function getSecureItem(key: string): Promise<string | null> {
  if (!isSecureStorageAvailable()) {
    const store = await webStore();
    return store.getItem(`${WEB_FALLBACK_PREFIX}${key}`);
  }
  return SecureStore.getItemAsync(key);
}

export async function deleteSecureItem(key: string): Promise<void> {
  if (!isSecureStorageAvailable()) {
    const store = await webStore();
    await store.removeItem(`${WEB_FALLBACK_PREFIX}${key}`);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function setSecureJSON<T>(
  key: string,
  value: T,
  readability?: SecureReadability
): Promise<void> {
  await setSecureItem(key, JSON.stringify(value), readability);
}

export async function getSecureJSON<T>(key: string): Promise<T | null> {
  const raw = await getSecureItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    // A corrupt entry is treated as absent, and cleared so it cannot linger.
    await deleteSecureItem(key);
    return null;
  }
}
