import type { AppSettings, FarmProfile } from '@/types/profile';
import { DEFAULT_APP_SETTINGS, DEFAULT_FARM_PROFILE } from '@/types/profile';

import { getJSON, setJSON } from './storage';

const farmKey = (userId: string) => `farm_profile:${userId}`;
const settingsKey = (userId: string) => `app_settings:${userId}`;

export async function getFarmProfile(userId: string): Promise<FarmProfile> {
  return (await getJSON<FarmProfile>(farmKey(userId))) ?? { ...DEFAULT_FARM_PROFILE };
}

export async function saveFarmProfile(userId: string, profile: FarmProfile): Promise<void> {
  await setJSON(farmKey(userId), profile);
}

export async function getAppSettings(userId: string): Promise<AppSettings> {
  const loaded = await getJSON<AppSettings>(settingsKey(userId));
  return { ...DEFAULT_APP_SETTINGS, ...(loaded ?? {}) };
}

export async function saveAppSettings(userId: string, settings: AppSettings): Promise<void> {
  await setJSON(settingsKey(userId), settings);
}
