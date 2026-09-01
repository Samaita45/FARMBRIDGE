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

/** True when the platform can actually keep this data secret. */
export function isSecureStorageAvailable(): boolean {
  return Platform.OS !== 'web';
}

async function webStore() {
  const mod = await import('@react-native-async-storage/async-storage');
  return mod.default;
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  if (!isSecureStorageAvailable()) {
    const store = await webStore();
    await store.setItem(`${WEB_FALLBACK_PREFIX}${key}`, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
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

export async function setSecureJSON<T>(key: string, value: T): Promise<void> {
  await setSecureItem(key, JSON.stringify(value));
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
