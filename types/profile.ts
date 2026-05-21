export type FarmType = 'smallholder' | 'commercial' | 'subsistence';

export type AppLanguage = 'en' | 'sn' | 'nd';

export type AppCurrency = 'USD' | 'ZWG';

export interface FarmProfile {
  farmName: string;
  farmSizeHa: number;
  farmType: FarmType;
  coordinates?: { lat: number; lng: number };
  avatarUri?: string;
}

export interface AppSettings {
  pushNotifications: boolean;
  smsNotifications: boolean;
  reminderHour: number;
  language: AppLanguage;
  currency: AppCurrency;
  hidePhoneInCommunity: boolean;
  offlineSyncEnabled: boolean;
  lowDataMode: boolean;
  /** SMS reminders target (defaults to account phone if empty) */
  smsReminderPhone: string;
}

export interface ProfileStats {
  cropsPlanted: number;
  orders: number;
  forumPosts: number;
}

export interface EarningsTransaction {
  id: string;
  description: string;
  amountUSD: number;
  amountZWG: number;
  date: string;
  type: 'sale' | 'withdrawal';
}

export const DEFAULT_FARM_PROFILE: FarmProfile = {
  farmName: '',
  farmSizeHa: 0,
  farmType: 'smallholder',
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  pushNotifications: true,
  smsNotifications: true,
  reminderHour: 7,
  language: 'en',
  currency: 'USD',
  hidePhoneInCommunity: false,
  offlineSyncEnabled: false,
  lowDataMode: false,
  smsReminderPhone: '',
};
