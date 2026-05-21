import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  FadeInView,
  GlassCard,
  ProfileScreenHeader,
  SectionHeader,
} from '@/components/design-system';
import { ProfileAvatar } from '@/components/profile/profile-avatar';
import { ProfileMenuRow } from '@/components/profile/profile-menu-row';
import { SubscriptionModal } from '@/components/profile/subscription-modal';
import { useToast } from '@/components/ui/toast-provider';
import { DS } from '@/constants/design-system';
import { t } from '@/constants/profile-i18n';
import { TUTORIALS } from '@/constants/tutorials-data';
import { getCropPlans } from '@/services/database';
import { getOrders } from '@/services/orderService';
import { pickProfilePhoto, persistProfilePhoto } from '@/lib/profile-photo';
import { getFarmProfile, saveFarmProfile } from '@/services/profileService';
import { DEFAULT_FARM_PROFILE } from '@/types/profile';
import { getUserPosts } from '@/services/communityDb';
import { asHref } from '@/lib/href';
import { useAuthStore, selectIsSubscribed, type AuthState } from '@/stores/authStore';
import { useSettingsStore, selectLanguage, type SettingsState } from '@/stores/settingsStore';
import { useTutorialsStore, type TutorialsState } from '@/stores/tutorialsStore';
import { SUBSCRIPTION_PLANS } from '@/constants/zimbabwe-data';
import type { FarmProfile, ProfileStats } from '@/types/profile';

const ROLE_LABELS: Record<string, string> = {
  farmer: 'Farmer',
  buyer: 'Buyer',
  both: 'Farmer & Buyer',
};

export default function ProfileScreen() {
  const user = useAuthStore((s: AuthState) => s.user);
  const logout = useAuthStore((s: AuthState) => s.logout);
  const isSubscribed = useAuthStore(selectIsSubscribed);
  const lang = useSettingsStore(selectLanguage);
  const hydrateSettings = useSettingsStore((s: SettingsState) => s.hydrate);
  const hydrateTutorials = useTutorialsStore((s: TutorialsState) => s.hydrate);
  const completedTutorialIds = useTutorialsStore((s: TutorialsState) => s.completedIds);

  const { showToast } = useToast();
  const [farm, setFarm] = useState<FarmProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats>({ cropsPlanted: 0, orders: 0, forumPosts: 0 });
  const [plansOpen, setPlansOpen] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    await Promise.all([hydrateSettings(user.id), hydrateTutorials(user.id)]);
    const [farmProfile, crops, orders, userPosts] = await Promise.all([
      getFarmProfile(user.id),
      getCropPlans(user.id, 'active'),
      getOrders(user.id),
      getUserPosts(),
    ]);
    setFarm(farmProfile);
    setStats({
      cropsPlanted: crops.length,
      orders: orders.length,
      forumPosts: userPosts.filter((p) => p.authorId === user.id).length,
    });
  }, [user?.id, hydrateSettings, hydrateTutorials]);

  useEffect(() => { void load(); }, [load]);

  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === (user?.subscription?.planId ?? 'basic'));
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-ZW', { month: 'short', year: 'numeric' })
    : '—';

  const pickAvatar = async () => {
    if (!user?.id) {
      showToast('Sign in to add a profile photo', 'info');
      return;
    }
    if (avatarSaving) return;

    const picked = await pickProfilePhoto();
    if (!picked.ok) {
      if (picked.reason === 'permission') {
        showToast('Allow photo access in Settings to continue', 'error');
      } else if (picked.reason === 'unavailable') {
        showToast('Photo picker is not available on this device', 'error');
      }
      return;
    }

    setAvatarSaving(true);
    try {
      const persisted = await persistProfilePhoto(user.id, picked.uri);
      if (!persisted) {
        showToast('Could not save profile photo', 'error');
        return;
      }
      const next: FarmProfile = {
        ...(farm ?? DEFAULT_FARM_PROFILE),
        avatarUri: persisted,
      };
      await saveFarmProfile(user.id, next);
      setFarm(next);
      showToast('Profile photo updated', 'success');
    } catch {
      showToast('Could not save profile photo', 'error');
    } finally {
      setAvatarSaving(false);
    }
  };

  const isFarmer = user?.role === 'farmer' || user?.role === 'both';
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? 'U';
  const tutorialPct = Math.round((completedTutorialIds.length / Math.max(TUTORIALS.length, 1)) * 100);

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <ProfileScreenHeader
          name={user?.name ?? 'Guest'}
          subtitle={`${user?.province ?? 'Zimbabwe'} · Member since ${memberSince}`}
          roleLabel={ROLE_LABELS[user?.role ?? 'farmer']}
          avatar={
            <ProfileAvatar
              uri={farm?.avatarUri}
              initials={initials}
              size={88}
              onPress={pickAvatar}
              style={s.avatarWrap}
            />
          }
          stats={
            <View style={s.statsRow}>
              <StatCell value={stats.cropsPlanted} label="Crops" icon="leaf-outline" />
              <View style={s.statDivider} />
              <StatCell value={stats.orders} label="Orders" icon="receipt-outline" />
              <View style={s.statDivider} />
              <StatCell value={stats.forumPosts} label="Posts" icon="chatbubble-outline" />
            </View>
          }
        />

        <FadeInView delay={0}>
        <GlassCard elevated style={s.card}>
          <View style={s.subRow}>
            <View style={s.subLeft}>
              <View style={[s.subIcon, isSubscribed && { backgroundColor: DS.colors.accentLight }]}>
                <Ionicons name="ribbon" size={18} color={isSubscribed ? DS.colors.accent : DS.colors.primary} />
              </View>
              <View>
                <Text style={s.subName}>{plan?.name ?? 'Basic'} Plan</Text>
                <Text style={s.subHint}>
                  {isSubscribed ? `Active · expires ${new Date(user!.subscription!.expiresAt!).toLocaleDateString()}` : 'Unlock market & transport'}
                </Text>
              </View>
            </View>
            {!isSubscribed || user?.subscription?.planId === 'basic' ? (
              <Pressable onPress={() => setPlansOpen(true)} style={s.upgradeBtn}>
                <Text style={s.upgradeBtnText}>Upgrade</Text>
              </Pressable>
            ) : (
              <View style={s.activeChip}>
                <Ionicons name="checkmark-circle" size={14} color={DS.colors.accent} />
                <Text style={s.activeChipText}>Active</Text>
              </View>
            )}
          </View>
        </GlassCard>
        </FadeInView>

        {isFarmer && (
          <FadeInView delay={1}>
          <GlassCard style={s.card}>
            <View style={s.cardHeader}>
              <SectionHeader title={t('myFarm', lang)} icon="home" />
              <Pressable onPress={() => router.push(asHref('/(tabs)/profile/edit-farm'))} style={s.editBtn}>
                <Ionicons name="create-outline" size={14} color={DS.colors.primary} />
                <Text style={s.editBtnText}>{t('editFarm', lang)}</Text>
              </Pressable>
            </View>
            <Text style={s.farmName}>{farm?.farmName || 'Add your farm name'}</Text>
            <Text style={s.farmMeta}>
              {farm?.farmType ? farm.farmType.charAt(0).toUpperCase() + farm.farmType.slice(1) : 'Smallholder'}
              {farm?.farmSizeHa ? ` · ${farm.farmSizeHa} ha` : ''}
            </Text>
            <Pressable onPress={() => router.push(asHref('/crop-management'))} style={s.linkBtn}>
              <Ionicons name="leaf-outline" size={14} color={DS.colors.primary} />
              <Text style={s.linkBtnText}>View crop planner</Text>
              <Ionicons name="arrow-forward" size={14} color={DS.colors.primary} />
            </Pressable>
          </GlassCard>
          </FadeInView>
        )}

        <FadeInView delay={2}>
        <GlassCard style={s.card}>
          <View style={s.cardHeader}>
            <SectionHeader title="Your learning" icon="book-outline" />
            <Pressable onPress={() => router.push(asHref('/tutorials'))} style={s.viewAllBtn}>
              <Text style={s.viewAllText}>View all</Text>
            </Pressable>
          </View>

          <View style={s.progressRow}>
            <Text style={s.progressLabel}>{completedTutorialIds.length}/{TUTORIALS.length} tutorials</Text>
            <Text style={s.progressPct}>{tutorialPct}%</Text>
          </View>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${tutorialPct}%` }]} />
          </View>

          {completedTutorialIds.length >= 5 ? (
            <View style={s.badgeEarned}>
              <Text style={s.badgeEarnedText}>🏆 Farm Scholar badge earned!</Text>
            </View>
          ) : (
            <Text style={s.tutorialHint}>Complete 5 tutorials to earn your certificate</Text>
          )}

          <Pressable onPress={() => router.push(asHref('/(tabs)/community/experts'))} style={s.linkBtn}>
            <Ionicons name="help-circle-outline" size={14} color={DS.colors.primary} />
            <Text style={s.linkBtnText}>Ask an Expert</Text>
            <Ionicons name="arrow-forward" size={14} color={DS.colors.primary} />
          </Pressable>
        </GlassCard>
        </FadeInView>

        <FadeInView delay={3}>
        <GlassCard style={s.menuCard}>
          {(user?.role === 'buyer' || user?.role === 'both') && (
            <ProfileMenuRow
              icon="receipt-outline"
              label={t('orders', lang)}
              subtitle="Track marketplace orders"
              onPress={() => router.push(asHref('/(tabs)/profile/orders'))}
            />
          )}
          {isFarmer && (
            <ProfileMenuRow
              icon="wallet-outline"
              label={t('earnings', lang)}
              subtitle="Sales & EcoCash withdrawals"
              onPress={() => router.push(asHref('/(tabs)/profile/earnings'))}
            />
          )}
          <ProfileMenuRow
            icon="card-outline"
            label={t('subscription', lang)}
            subtitle={plan?.name}
            onPress={() => setPlansOpen(true)}
            badge={isSubscribed ? undefined : 'Upgrade'}
          />
          <ProfileMenuRow
            icon="settings-outline"
            label={t('settings', lang)}
            subtitle="Notifications, language, privacy"
            onPress={() => router.push(asHref('/settings'))}
          />
          <ProfileMenuRow
            icon="help-circle-outline"
            label="Help & Support"
            subtitle="FAQ · WhatsApp support"
            onPress={() => router.push(asHref('/settings'))}
          />
        </GlassCard>
        </FadeInView>

        <Pressable
          style={({ pressed }) => [s.logoutBtn, pressed && { opacity: 0.8 }]}
          onPress={async () => { await logout(); router.replace(asHref('/(auth)')); }}>
          <Ionicons name="log-out-outline" size={18} color={DS.colors.red} />
          <Text style={s.logoutText}>{t('logout', lang)}</Text>
        </Pressable>

      </ScrollView>

      <SubscriptionModal visible={plansOpen} onClose={() => setPlansOpen(false)} />
    </SafeAreaView>
  );
}

function StatCell({ value, label, icon }: { value: number; label: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={s.statCell}>
      <Ionicons name={icon} size={16} color="rgba(255,255,255,0.7)" style={{ marginBottom: 4 }} />
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.background },
  scroll: { paddingBottom: 48 },
  avatarWrap: { marginBottom: 4 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  statCell: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.2)' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 1 },

  card: { marginHorizontal: DS.spacing.md, marginTop: DS.spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  subRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  subIcon: { width: 40, height: 40, borderRadius: DS.radius.md, backgroundColor: DS.colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
  subName: { fontSize: 15, fontWeight: '700', color: DS.colors.text },
  subHint: { fontSize: 12, color: DS.colors.textMuted, marginTop: 2 },
  upgradeBtn: { backgroundColor: DS.colors.primary, borderRadius: DS.radius.md, paddingHorizontal: 16, paddingVertical: 8 },
  upgradeBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  activeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: DS.colors.accentLight, borderRadius: DS.radius.md, paddingHorizontal: 10, paddingVertical: 6 },
  activeChipText: { fontSize: 12, fontWeight: '700', color: DS.colors.accent },
  farmName: { fontSize: 16, fontWeight: '700', color: DS.colors.text },
  farmMeta: { fontSize: 13, color: DS.colors.textMuted, marginTop: 4 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, marginTop: 8 },
  progressLabel: { fontSize: 13, color: DS.colors.textMuted },
  progressPct: { fontSize: 13, fontWeight: '700', color: DS.colors.primary },
  progressTrack: { height: 8, backgroundColor: DS.colors.borderLight, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: DS.colors.primary, borderRadius: 4 },
  badgeEarned: { marginTop: 12, backgroundColor: DS.colors.accentLight, borderRadius: DS.radius.md, padding: 10 },
  badgeEarnedText: { fontSize: 13, fontWeight: '700', color: DS.colors.accent, textAlign: 'center' },
  tutorialHint: { fontSize: 12, color: DS.colors.textMuted, marginTop: 10 },
  linkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 12, backgroundColor: DS.colors.primaryBg,
    borderRadius: DS.radius.md, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: DS.colors.primaryMid,
  },
  linkBtnText: { flex: 1, fontSize: 14, fontWeight: '600', color: DS.colors.primary },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editBtnText: { fontSize: 13, fontWeight: '600', color: DS.colors.primary },
  viewAllBtn: { marginTop: -40 },
  viewAllText: { fontSize: 13, fontWeight: '600', color: DS.colors.primary },
  menuCard: { marginHorizontal: DS.spacing.md, marginTop: DS.spacing.md, paddingVertical: 4 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: DS.spacing.md, marginTop: DS.spacing.md,
    backgroundColor: '#FEE2E2', borderRadius: DS.radius.lg, paddingVertical: 16,
    borderWidth: 1, borderColor: '#FCA5A5',
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: DS.colors.red },
});
