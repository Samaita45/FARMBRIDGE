import { create } from 'zustand';

import { getAppSettings, saveAppSettings } from '@/services/profileService';
import type { AppSettings, AppCurrency, AppLanguage } from '@/types/profile';
import { DEFAULT_APP_SETTINGS } from '@/types/profile';

export interface SettingsState extends AppSettings {
  isHydrated: boolean;
  hydrate: (userId: string) => Promise<void>;
  patch: (userId: string, partial: Partial<AppSettings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_APP_SETTINGS,
  isHydrated: false,

  hydrate: async (userId) => {
    const settings = await getAppSettings(userId);
    set({ ...settings, isHydrated: true });
  },

  patch: async (userId, partial) => {
    const next = { ...get(), ...partial };
    const toSave: AppSettings = {
      pushNotifications: next.pushNotifications,
      smsNotifications: next.smsNotifications,
      reminderHour: next.reminderHour,
      language: next.language,
      currency: next.currency,
      hidePhoneInCommunity: next.hidePhoneInCommunity,
      offlineSyncEnabled: next.offlineSyncEnabled,
      lowDataMode: next.lowDataMode,
      smsReminderPhone: next.smsReminderPhone,
    };
    await saveAppSettings(userId, toSave);
    set(toSave);
  },
}));

export const selectLanguage = (s: SettingsState): AppLanguage => s.language;
export const selectCurrency = (s: SettingsState): AppCurrency => s.currency;
