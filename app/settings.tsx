import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { asHref } from '@/lib/href';
import { useAuthStore, type AuthState } from '@/stores/authStore';
import { useSettingsStore, type SettingsState } from '@/stores/settingsStore';
import { useEffect, type ReactNode } from 'react';
import { Linking, Pressable, ScrollView, Text, TextInput, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProvincePicker } from '@/components/forms/province-picker';
import { DS } from '@/constants/design-system';
import { MOCK_POSTS } from '@/constants/community-data';
import { PRIVACY_URL, SUPPORT_WHATSAPP_URL, TERMS_URL, whatsAppUrl } from '@/constants/support';
import { CROPS, MARKET_PRODUCTS } from '@/constants/zimbabwe-data';
import { cachePosts } from '@/services/communityDb';
import { upsertCachedCropData, upsertCachedProduct } from '@/services/database';
import { buildSmsReminderBody } from '@/services/smsService';
import type { AppCurrency, AppLanguage } from '@/types/profile';
import type { FarmTask } from '@/types/crop-management';
import { Toggle } from '@/components/design-system';
import { useTheme, type ThemePreference } from '@/contexts/theme';

/*
  System first and default: most people never open this, and following the OS
  is the right answer for them. Light and Dark are for the people the OS gets
  wrong — a bright phone in a dark packing shed, or the reverse.
*/
const APPEARANCES: { id: ThemePreference; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

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
  const { preference, setPreference } = useTheme();
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
    <SafeAreaView className="flex-1 bg-surface dark:bg-dSurface" edges={['bottom']}>
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
            <Text className="px-4 pb-2 font-sans text-xs text-gray-500 dark:text-dSoft">
              Daily reminder at {settings.reminderHour}:00
            </Text>
            <Text className="px-4 pb-1 font-sans text-sm text-gray-600 dark:text-dMuted">SMS reminder number</Text>
            <TextInput
              className="mx-4 mb-2 rounded-xl bg-white px-4 py-3 font-sans dark:bg-dCard"
              placeholder={user?.phone ? `Default: ${user.phone}` : '+263…'}
              placeholderTextColor={DS.colors.textSoft}
              keyboardType="phone-pad"
              value={settings.smsReminderPhone}
              onChangeText={(t) => void patch(userId, { smsReminderPhone: t })}
            />
            <Pressable
              onPress={() =>
                Alert.alert('SMS preview', buildSmsReminderBody(demoTask), [{ text: 'OK' }])
              }
              className="mx-4 mb-3 rounded-xl bg-white px-4 py-3 dark:bg-dCard">
              <Text className="font-sans text-primary dark:text-dPrimary">Preview SMS template</Text>
            </Pressable>
          </Section>

          <Section title="Appearance">
            <View className="flex-row flex-wrap gap-2 px-4 pb-3">
              {APPEARANCES.map((a) => (
                <Pressable
                  key={a.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: preference === a.id }}
                  accessibilityLabel={`${a.label} appearance`}
                  onPress={() => setPreference(a.id)}
                  className={`rounded-full px-4 py-2 ${preference === a.id ? 'bg-primary dark:bg-dPrimary' : 'bg-white dark:bg-dCard'}`}>
                  <Text
                    className={`font-sans text-sm ${preference === a.id ? 'text-white dark:text-dOnPrimary' : 'text-gray-600 dark:text-dMuted'}`}>
                    {a.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Section>

          <Section title="Language">
            <View className="flex-row flex-wrap gap-2 px-4 pb-3">
              {LANGUAGES.map((l) => (
                <Pressable
                  key={l.id}
                  onPress={() => void patch(userId, { language: l.id })}
                  className={`rounded-full px-4 py-2 ${settings.language === l.id ? 'bg-primary dark:bg-dPrimary' : 'bg-white dark:bg-dCard'}`}>
                  <Text
                    className={`font-sans text-sm ${settings.language === l.id ? 'text-white dark:text-dOnPrimary' : 'text-gray-600 dark:text-dMuted'}`}>
                    {l.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Section>

          <Section title="Preferences">
            <Text className="px-4 pb-1 font-sans text-sm text-gray-600 dark:text-dMuted">Default currency</Text>
            <View className="flex-row gap-2 px-4 pb-3">
              {CURRENCIES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => void patch(userId, { currency: c })}
                  className={`rounded-full px-4 py-2 ${settings.currency === c ? 'bg-primary dark:bg-dPrimary' : 'bg-white dark:bg-dCard'}`}>
                  <Text
                    className={`font-sans text-sm ${settings.currency === c ? 'text-white dark:text-dOnPrimary' : 'text-gray-600 dark:text-dMuted'}`}>
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
              className="mx-4 mb-3 flex-row items-center justify-between rounded-xl bg-white px-4 py-3 dark:bg-dCard">
              <Text className="font-sans text-dark dark:text-dText">Download for offline</Text>
              <Text className="font-sans text-sm text-primary dark:text-dPrimary">
                {settings.offlineSyncEnabled ? 'Synced' : 'Sync now'}
              </Text>
            </Pressable>
          </Section>

          <Section title="Support">
            <Pressable
              onPress={() =>
                Linking.openURL(SUPPORT_WHATSAPP_URL)
              }
              className="mx-4 mb-2 flex-row items-center gap-3 rounded-xl bg-white px-4 py-3 dark:bg-dCard">
              <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
              <Text className="font-sans text-dark dark:text-dText">WhatsApp Support</Text>
            </Pressable>
            {/*
              These three had no onPress at all — rows that looked tappable and
              were not. FAQ now goes to the one support channel that exists;
              the policies open their published URLs, and say plainly when
              nothing is published yet rather than absorbing a tap.
            */}
            <Pressable
              onPress={() => Linking.openURL(whatsAppUrl('Hi FarmBridge, I have a question.'))}
              accessibilityRole="button"
              accessibilityLabel="Ask a question on WhatsApp"
              className="mx-4 mb-2 flex-row items-center gap-3 rounded-xl bg-white px-4 py-3 dark:bg-dCard">
              <Ionicons name="help-circle-outline" size={22} color={DS.colors.primary} />
              <Text className="font-sans text-dark dark:text-dText">FAQ & help</Text>
            </Pressable>
          </Section>

          <Section title="About">
            <Text className="px-4 font-sans text-sm text-gray-500 dark:text-dSoft">
              FarmBridge v{Constants.expoConfig?.version ?? '1.0.0'}
            </Text>
            <LegalRow label="Terms of service" url={TERMS_URL} />
            <LegalRow label="Privacy policy" url={PRIVACY_URL} />
          </Section>

          <Pressable
            className="mx-4 mt-4 rounded-2xl bg-error/10 py-4 dark:bg-dDanger/20"
            onPress={async () => {
              await logout();
              router.replace(asHref('/(auth)'));
            }}>
            <Text className="text-center font-sans-semibold text-error dark:text-dDanger">Logout</Text>
          </Pressable>
        </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="mt-4">
      <Text className="mb-2 px-4 font-sans-semibold text-dark dark:text-dText">{title}</Text>
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
    <View className="mx-4 mb-2 flex-row items-center justify-between rounded-xl bg-white px-4 py-3 dark:bg-dCard">
      <View className="flex-1 pr-2">
        <Text className="font-sans text-dark dark:text-dText">{label}</Text>
        {subtitle ? <Text className="font-sans text-xs text-gray-500 dark:text-dSoft">{subtitle}</Text> : null}
      </View>
      <Toggle value={value} onValueChange={onChange} accessibilityLabel={label} />
    </View>
  );
}

/**
 * A policy link that tells the truth about itself. When no URL is configured
 * the row is plainly unavailable rather than a tappable no-op.
 */
function LegalRow({ label, url }: { label: string; url: string }) {
  if (!url) {
    return (
      <View className="mx-4 mt-2 flex-row items-center gap-3 rounded-xl bg-white px-4 py-3 opacity-60 dark:bg-dCard">
        <Ionicons name="document-text-outline" size={20} color={DS.colors.textSoft} />
        <View className="flex-1">
          <Text className="font-sans text-dark dark:text-dText">{label}</Text>
          <Text className="font-sans text-xs text-muted dark:text-dMuted">Not published yet</Text>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      onPress={() => Linking.openURL(url)}
      accessibilityRole="link"
      accessibilityLabel={`Open the ${label.toLowerCase()}`}
      className="mx-4 mt-2 flex-row items-center gap-3 rounded-xl bg-white px-4 py-3 dark:bg-dCard">
      <Ionicons name="document-text-outline" size={20} color={DS.colors.primary} />
      <Text className="flex-1 font-sans text-dark dark:text-dText">{label}</Text>
      <Ionicons name="open-outline" size={16} color={DS.colors.textFaint} />
    </Pressable>
  );
}
