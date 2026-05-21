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

import { ProfileMenuRow } from '@/components/profile/profile-menu-row';
import { SubscriptionModal } from '@/components/profile/subscription-modal';
import Colors from '@/constants/colors';
import { t } from '@/constants/profile-i18n';
import { TUTORIALS } from '@/constants/tutorials-data';
import { getCropPlans } from '@/services/database';
import { getOrders } from '@/services/orderService';
import { getFarmProfile, saveFarmProfile } from '@/services/profileService';
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

  const [farm, setFarm] = useState<FarmProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats>({ cropsPlanted: 0, orders: 0, forumPosts: 0 });
  const [plansOpen, setPlansOpen] = useState(false);

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
    if (!user?.id) return;
    const ImagePicker = await import('expo-image-picker').catch(() => null);
    if (!ImagePicker) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      const next = { ...(farm ?? { farmName: '', farmSizeHa: 0, farmType: 'smallholder' as const }), avatarUri: result.assets[0].uri };
      await saveFarmProfile(user.id, next);
      setFarm(next);
    }
  };

  const isFarmer = user?.role === 'farmer' || user?.role === 'both';
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? 'U';
  const tutorialPct = Math.round((completedTutorialIds.length / Math.max(TUTORIALS.length, 1)) * 100);

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Blue header ── */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Profile</Text>

          {/* Avatar */}
          <Pressable onPress={pickAvatar} style={s.avatarWrap}>
            <View style={s.avatar}>
              <Text style={s.avatarInitials}>{initials}</Text>
            </View>
            <View style={s.cameraBtn}>
              <Ionicons name="camera" size={14} color={Colors.primary} />
            </View>
          </Pressable>

          <Text style={s.userName}>{user?.name ?? 'Guest'}</Text>
          <Text style={s.userSub}>{user?.province ?? 'Zimbabwe'} · Member since {memberSince}</Text>

          <View style={s.rolePill}>
            <Text style={s.rolePillText}>{ROLE_LABELS[user?.role ?? 'farmer']}</Text>
          </View>

          {/* Stats row */}
          <View style={s.statsRow}>
            <StatCell value={stats.cropsPlanted} label="Crops" icon="leaf-outline" />
            <View style={s.statDivider} />
            <StatCell value={stats.orders} label="Orders" icon="receipt-outline" />
            <View style={s.statDivider} />
            <StatCell value={stats.forumPosts} label="Posts" icon="chatbubble-outline" />
          </View>
        </View>

        {/* ── Subscription card ── */}
        <View style={s.card}>
          <View style={s.subRow}>
            <View style={s.subLeft}>
              <View style={[s.subIcon, isSubscribed && { backgroundColor: Colors.accentLight }]}>
                <Ionicons name="ribbon" size={18} color={isSubscribed ? Colors.accent : Colors.primary} />
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
                <Ionicons name="checkmark-circle" size={14} color={Colors.accent} />
                <Text style={s.activeChipText}>Active</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Farm profile (farmers only) ── */}
        {isFarmer && (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <View style={s.cardHeaderLeft}>
                <Ionicons name="home" size={16} color={Colors.primary} />
                <Text style={s.cardTitle}>{t('myFarm', lang)}</Text>
              </View>
              <Pressable onPress={() => router.push(asHref('/(tabs)/profile/edit-farm'))} style={s.editBtn}>
                <Ionicons name="create-outline" size={14} color={Colors.primary} />
                <Text style={s.editBtnText}>{t('editFarm', lang)}</Text>
              </Pressable>
            </View>
            <Text style={s.farmName}>{farm?.farmName || 'Add your farm name'}</Text>
            <Text style={s.farmMeta}>
              {farm?.farmType ? farm.farmType.charAt(0).toUpperCase() + farm.farmType.slice(1) : 'Smallholder'}
              {farm?.farmSizeHa ? ` · ${farm.farmSizeHa} ha` : ''}
            </Text>
            <Pressable onPress={() => router.push(asHref('/crop-management'))} style={s.linkBtn}>
              <Ionicons name="leaf-outline" size={14} color={Colors.primary} />
              <Text style={s.linkBtnText}>View crop planner</Text>
              <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
            </Pressable>
          </View>
        )}

        {/* ── Learning progress ── */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <View style={s.cardHeaderLeft}>
              <Text style={s.cardTitleEmoji}>📖</Text>
              <Text style={s.cardTitle}>Your Learning</Text>
            </View>
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
            <Ionicons name="help-circle-outline" size={14} color={Colors.primary} />
            <Text style={s.linkBtnText}>Ask an Expert</Text>
            <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
          </Pressable>
        </View>

        {/* ── Menu list ── */}
        <View style={s.menuCard}>
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
        </View>

        {/* ── Logout ── */}
        <Pressable
          style={({ pressed }) => [s.logoutBtn, pressed && { opacity: 0.8 }]}
          onPress={async () => { await logout(); router.replace(asHref('/(auth)')); }}>
          <Ionicons name="log-out-outline" size={18} color={Colors.error} />
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
  root: { flex: 1, backgroundColor: Colors.primaryBg },
  scroll: { paddingBottom: 40 },

  // Header
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    alignItems: 'center',
  },
  headerTitle: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: 1, alignSelf: 'flex-start', marginBottom: 16 },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 3, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { fontSize: 28, fontWeight: '800', color: '#fff' },
  cameraBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.primaryBg,
  },
  userName: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  userSub: { fontSize: 12, color: 'rgba(255,255,255,0.70)', marginBottom: 10 },
  rolePill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
    marginBottom: 18,
  },
  rolePillText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16, paddingVertical: 14, paddingHorizontal: 10,
    width: '100%',
    alignItems: 'center',
  },
  statCell: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.2)' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 1 },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 14,
    padding: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
    borderWidth: 1, borderColor: Colors.gray[100],
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  cardTitleEmoji: { fontSize: 16 },

  // Subscription
  subRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  subIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
  subName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  subHint: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  upgradeBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
  upgradeBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  activeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.accentLight, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  activeChipText: { fontSize: 12, fontWeight: '700', color: Colors.accent },

  // Farm
  farmName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  farmMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 3 },

  // Learning
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, color: Colors.textSecondary },
  progressPct: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  progressTrack: { height: 6, backgroundColor: Colors.gray[100], borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
  badgeEarned: { marginTop: 10, backgroundColor: Colors.accentLight, borderRadius: 10, padding: 8 },
  badgeEarnedText: { fontSize: 12, fontWeight: '700', color: Colors.accent, textAlign: 'center' },
  tutorialHint: { fontSize: 11, color: Colors.textSecondary, marginTop: 8 },

  // Link button
  linkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 12, backgroundColor: Colors.primaryBg,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9,
    borderWidth: 1, borderColor: Colors.primaryMid,
  },
  linkBtnText: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.primary },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  viewAllBtn: {},
  viewAllText: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  // Menu
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 14,
    overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.gray[100],
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 16, marginTop: 14,
    backgroundColor: '#fee2e2', borderRadius: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: '#fca5a5',
  },
  logoutText: { fontSize: 14, fontWeight: '700', color: Colors.error },
});
