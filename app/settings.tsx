import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { asHref } from '@/lib/href';
import { useAuthStore, type AuthState } from '@/stores/authStore';
import { useSettingsStore, type SettingsState } from '@/stores/settingsStore';
import { useEffect, type ReactNode } from 'react';
import { Linking, Pressable, ScrollView, Switch, Text, TextInput, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProvincePicker } from '@/components/forms/province-picker';
import { Colors } from '@/constants/colors';
import { MOCK_POSTS } from '@/constants/community-data';
import { CROPS, MARKET_PRODUCTS } from '@/constants/zimbabwe-data';
import { cachePosts } from '@/services/communityDb';
import { upsertCachedCropData, upsertCachedProduct } from '@/services/database';
import { buildSmsReminderBody } from '@/services/smsService';
import type { AppCurrency, AppLanguage } from '@/types/profile';
import type { FarmTask } from '@/types/crop-management';

const LANGUAGES: { id: AppLanguage; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'sn', label: 'Shona' },
  { id: 'nd', label: 'Ndebele' },
];

const CURRENCIES: AppCurrency[] = ['USD', 'ZWG'];

export default function SettingsScreen() {
  const user = useAuthStore((s: AuthState) => s.user);
  const logout = useAuthStore((s: AuthState) => s.logout);
  const updateUser = useAuthStore((s: AuthState) => s.updateUser);
  const settings = useSettingsStore();
  const patch = useSettingsStore((s: SettingsState) => s.patch);

  const userId = user?.id ?? 'guest';
  const hydrate = useSettingsStore((s: SettingsState) => s.hydrate);

  useEffect(() => {
    if (user?.id) void hydrate(user.id);
  }, [user?.id, hydrate]);

  const syncOffline = async () => {
    await cachePosts(MOCK_POSTS);
    try {
      await upsertCachedCropData('all_crops', JSON.stringify(CROPS));
      for (const p of MARKET_PRODUCTS.slice(0, 30)) {
        await upsertCachedProduct(p.id, JSON.stringify(p));
      }
    } catch {
      // best-effort
    }
    await patch(userId, { offlineSyncEnabled: true });
  };

  const demoTask: FarmTask = {
    id: 'demo',
    cropPlanId: 'demo',
    cropName: 'Maize',
    taskType: 'water',
    title: 'Water Maize',
    dueDate: new Date().toISOString().slice(0, 10),
    status: 'pending',
    priority: 'medium',
    notificationId: null,
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <Section title="Notifications">
            <SettingSwitch
              label="Push notifications"
              value={settings.pushNotifications}
              onChange={(v) => void patch(userId, { pushNotifications: v })}
            />
            <SettingSwitch
              label="SMS reminders"
              value={settings.smsNotifications}
              onChange={(v) => void patch(userId, { smsNotifications: v })}
            />
            <Text className="px-4 pb-2 font-sans text-xs text-gray-500">
              Daily reminder at {settings.reminderHour}:00
            </Text>
            <Text className="px-4 pb-1 font-sans text-sm text-gray-600">SMS reminder number</Text>
            <TextInput
              className="mx-4 mb-2 rounded-xl bg-white px-4 py-3 font-sans"
              placeholder={user?.phone ? `Default: ${user.phone}` : '+263…'}
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
              value={settings.smsReminderPhone}
              onChangeText={(t) => void patch(userId, { smsReminderPhone: t })}
            />
            <Pressable
              onPress={() =>
                Alert.alert('SMS preview', buildSmsReminderBody(demoTask), [{ text: 'OK' }])
              }
              className="mx-4 mb-3 rounded-xl bg-white px-4 py-3">
              <Text className="font-sans text-primary">Preview SMS template</Text>
            </Pressable>
          </Section>

          <Section title="Language">
            <View className="flex-row flex-wrap gap-2 px-4 pb-3">
              {LANGUAGES.map((l) => (
                <Pressable
                  key={l.id}
                  onPress={() => void patch(userId, { language: l.id })}
                  className={`rounded-full px-4 py-2 ${settings.language === l.id ? 'bg-primary' : 'bg-white'}`}>
                  <Text
                    className={`font-sans text-sm ${settings.language === l.id ? 'text-white' : 'text-gray-600'}`}>
                    {l.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Section>

          <Section title="Preferences">
            <Text className="px-4 pb-1 font-sans text-sm text-gray-600">Default currency</Text>
            <View className="flex-row gap-2 px-4 pb-3">
              {CURRENCIES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => void patch(userId, { currency: c })}
                  className={`rounded-full px-4 py-2 ${settings.currency === c ? 'bg-primary' : 'bg-white'}`}>
                  <Text
                    className={`font-sans text-sm ${settings.currency === c ? 'text-white' : 'text-gray-600'}`}>
                    {c}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View className="px-4 pb-2">
              <ProvincePicker
                value={user?.province ?? ''}
                onChange={(province) => void updateUser({ province })}
              />
            </View>
          </Section>

          <Section title="Privacy">
            <SettingSwitch
              label="Hide phone in community"
              value={settings.hidePhoneInCommunity}
              onChange={(v) => void patch(userId, { hidePhoneInCommunity: v })}
            />
          </Section>

          <Section title="Data & offline">
            <SettingSwitch
              label="Low data mode"
              subtitle="Reduce image quality"
              value={settings.lowDataMode}
              onChange={(v) => void patch(userId, { lowDataMode: v })}
            />
            <Pressable
              onPress={() => void syncOffline()}
              className="mx-4 mb-3 flex-row items-center justify-between rounded-xl bg-white px-4 py-3">
              <Text className="font-sans text-dark">Download for offline</Text>
              <Text className="font-sans text-sm text-primary">
                {settings.offlineSyncEnabled ? 'Synced' : 'Sync now'}
              </Text>
            </Pressable>
          </Section>

          <Section title="Support">
            <Pressable
              onPress={() =>
                Linking.openURL('https://wa.me/263771234567?text=Hi%20ZimFarm%20support')
              }
              className="mx-4 mb-2 flex-row items-center gap-3 rounded-xl bg-white px-4 py-3">
              <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
              <Text className="font-sans text-dark">WhatsApp Support</Text>
            </Pressable>
            <Pressable className="mx-4 mb-2 rounded-xl bg-white px-4 py-3">
              <Text className="font-sans text-dark">FAQ & Help Centre</Text>
            </Pressable>
          </Section>

          <Section title="About">
            <Text className="px-4 font-sans text-sm text-gray-500">
              ZimFarm v{Constants.expoConfig?.version ?? '1.0.0'}
            </Text>
            <Pressable className="mx-4 mt-2 rounded-xl bg-white px-4 py-3">
              <Text className="font-sans text-dark">Terms of Service</Text>
            </Pressable>
            <Pressable className="mx-4 mt-2 mb-2 rounded-xl bg-white px-4 py-3">
              <Text className="font-sans text-dark">Privacy Policy</Text>
            </Pressable>
          </Section>

          <Pressable
            className="mx-4 mt-4 rounded-2xl bg-error/10 py-4"
            onPress={async () => {
              await logout();
              router.replace(asHref('/(auth)'));
            }}>
            <Text className="text-center font-sans-semibold text-error">Logout</Text>
          </Pressable>
        </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="mt-4">
      <Text className="mb-2 px-4 font-sans-semibold text-dark">{title}</Text>
      {children}
    </View>
  );
}

function SettingSwitch({
  label,
  subtitle,
  value,
  onChange,
}: {
  label: string;
  subtitle?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View className="mx-4 mb-2 flex-row items-center justify-between rounded-xl bg-white px-4 py-3">
      <View className="flex-1 pr-2">
        <Text className="font-sans text-dark">{label}</Text>
        {subtitle ? <Text className="font-sans text-xs text-gray-500">{subtitle}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: Colors.primary }} />
    </View>
  );
}
