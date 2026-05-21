import {
  copyAsync,
  deleteAsync,
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
} from 'expo-file-system/legacy';
import { Alert, Platform } from 'react-native';

export type ProfilePhotoPickResult =
  | { ok: true; uri: string }
  | { ok: false; reason: 'cancelled' | 'permission' | 'unavailable' };

async function getImagePicker() {
  return import('expo-image-picker').catch(() => null);
}

/** Copy picker/camera output into app documents so the URI survives restarts. */
export async function persistProfilePhoto(
  userId: string,
  tempUri: string,
): Promise<string | null> {
  if (!documentDirectory) return tempUri;

  try {
    const dir = `${documentDirectory}avatars/`;
    await makeDirectoryAsync(dir, { intermediates: true });

    const ext = tempUri.toLowerCase().includes('.png') ? 'png' : 'jpg';
    const dest = `${dir}${userId}.${ext}`;

    const existing = await getInfoAsync(dest);
    if (existing.exists) {
      await deleteAsync(dest, { idempotent: true });
    }

    await copyAsync({ from: tempUri, to: dest });
    return dest;
  } catch {
    // Fallback: keep picker URI if legacy filesystem is unavailable (e.g. web)
    return tempUri;
  }
}

/** Returns stored URI only if the file still exists on disk. */
export async function resolveAvatarUri(stored?: string | null): Promise<string | null> {
  if (!stored) return null;
  if (stored.startsWith('http://') || stored.startsWith('https://')) return stored;

  try {
    const info = await getInfoAsync(stored);
    return info.exists ? stored : null;
  } catch {
    return stored;
  }
}

async function pickFromLibrary(): Promise<ProfilePhotoPickResult> {
  const ImagePicker = await getImagePicker();
  if (!ImagePicker?.launchImageLibraryAsync) {
    return { ok: false, reason: 'unavailable' };
  }

  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (perm.status !== 'granted') {
    return { ok: false, reason: 'permission' };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });

  if (result.canceled || !result.assets?.[0]?.uri) {
    return { ok: false, reason: 'cancelled' };
  }
  return { ok: true, uri: result.assets[0].uri };
}

async function pickFromCamera(): Promise<ProfilePhotoPickResult> {
  const ImagePicker = await getImagePicker();
  if (!ImagePicker?.launchCameraAsync) {
    return { ok: false, reason: 'unavailable' };
  }

  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (perm.status !== 'granted') {
    return { ok: false, reason: 'permission' };
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });

  if (result.canceled || !result.assets?.[0]?.uri) {
    return { ok: false, reason: 'cancelled' };
  }
  return { ok: true, uri: result.assets[0].uri };
}

/** Prompt to choose library or camera, then return a temp URI from the picker. */
export function pickProfilePhoto(): Promise<ProfilePhotoPickResult> {
  return new Promise((resolve) => {
    const choose = (source: 'library' | 'camera') => {
      void (source === 'library' ? pickFromLibrary() : pickFromCamera()).then(resolve);
    };

    if (Platform.OS === 'web') {
      void pickFromLibrary().then(resolve);
      return;
    }

    Alert.alert('Profile photo', 'Choose a source', [
      { text: 'Photo library', onPress: () => choose('library') },
      { text: 'Camera', onPress: () => choose('camera') },
      { text: 'Cancel', style: 'cancel', onPress: () => resolve({ ok: false, reason: 'cancelled' }) },
    ]);
  });
}
