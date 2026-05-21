import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Colors from '@/constants/colors';
import { ScreenImages } from '@/constants/images';
import { useCropPlans } from '@/hooks/useCropPlans';
import { useFarmTasks } from '@/hooks/useFarmTasks';

const LINKS = [
  { href: '/crop-management/planner',  label: 'Crop Planner',      desc: 'Calendar, plans & rotation',    icon: 'calendar-outline' as const,    color: Colors.primary },
  { href: '/crop-management/tasks',    label: 'Tasks & Reminders', desc: 'Notifications & SMS alerts',   icon: 'checkmark-done-outline' as const, color: Colors.accent },
  { href: '/crop-management/health',   label: 'Crop Health',       desc: 'Diagnose diseases & pests',    icon: 'medkit-outline' as const,       color: '#f59e0b' },
  { href: '/crop-management/soil',     label: 'Soil & Fertilizer', desc: 'NPK recommendations',          icon: 'water-outline' as const,        color: '#0ea5e9' },
] as const;

export default function CropManagementHub() {
  const { plans } = useCropPlans();
  const { allTasks, completionRate } = useFarmTasks();
  const pendingTasks = allTasks.filter((t) => t.status !== 'completed').length;

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Hero banner ── */}
        <ImageBackground source={ScreenImages.crop} style={s.heroBg} resizeMode="cover">
          <View style={s.heroOverlay}>
            <Pressable onPress={() => router.back()} style={s.backBtn}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </Pressable>
            <View style={s.heroTitleRow}>
              <Ionicons name="leaf" size={22} color="#fff" />
              <Text style={s.heroTitle}>Crop Management</Text>
            </View>
            <Text style={s.heroSub}>Plan, track, and optimise your crops</Text>
          </View>
        </ImageBackground>

        <View style={s.body}>

          {/* ── Stats row ── */}
          <View style={s.statsRow}>
            <View style={s.statCard}>
              <Ionicons name="leaf" size={18} color={Colors.primary} style={s.statIcon} />
              <Text style={s.statValue}>{plans.length}</Text>
              <Text style={s.statLabel}>Active plans</Text>
            </View>
            <View style={s.statCard}>
              <Ionicons name="alert-circle-outline" size={18} color="#f59e0b" style={s.statIcon} />
              <Text style={[s.statValue, pendingTasks > 0 && { color: '#f59e0b' }]}>{pendingTasks}</Text>
              <Text style={s.statLabel}>Pending tasks</Text>
            </View>
            <View style={s.statCard}>
              <Ionicons name="checkmark-circle-outline" size={18} color={Colors.accent} style={s.statIcon} />
              <Text style={[s.statValue, { color: Colors.accent }]}>{completionRate}%</Text>
              <Text style={s.statLabel}>Done this week</Text>
            </View>
          </View>

          {/* ── Quick action tip ── */}
          {pendingTasks > 0 && (
            <Pressable
              onPress={() => router.push('/crop-management/tasks')}
              style={s.alertBanner}>
              <Ionicons name="alert-circle" size={18} color="#f59e0b" />
              <Text style={s.alertText}>
                You have {pendingTasks} pending task{pendingTasks > 1 ? 's' : ''} — tap to view
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#f59e0b" />
            </Pressable>
          )}

          {/* ── Module grid ── */}
          <Text style={s.sectionTitle}>Modules</Text>
          <View style={s.grid}>
            {LINKS.map((item) => (
              <Link key={item.href} href={item.href} asChild>
                <Pressable style={({ pressed }) => [s.moduleCard, pressed && { opacity: 0.85 }]}>
                  <View style={[s.moduleIcon, { backgroundColor: item.color + '18' }]}>
                    <Ionicons name={item.icon} size={24} color={item.color} />
                  </View>
                  <Text style={s.moduleLabel}>{item.label}</Text>
                  <Text style={s.moduleDesc} numberOfLines={2}>{item.desc}</Text>
                  <View style={[s.moduleArrow, { backgroundColor: item.color + '18' }]}>
                    <Ionicons name="arrow-forward" size={14} color={item.color} />
                  </View>
                </Pressable>
              </Link>
            ))}
          </View>

          {/* ── Season tip ── */}
          <View style={s.tipCard}>
            <View style={s.tipHeader}>
              <Ionicons name="bulb-outline" size={18} color={Colors.warning} />
              <Text style={s.tipTitle}>Seasonal Tip</Text>
            </View>
            <Text style={s.tipBody}>
              Check maize whorls weekly during rainy season for fall armyworm. Early detection saves your crop.
            </Text>
            <Pressable onPress={() => router.push('/tutorials')} style={s.tipBtn}>
              <Text style={s.tipBtnText}>More tutorials</Text>
              <Ionicons name="arrow-forward" size={13} color={Colors.primary} />
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primaryBg },

  heroBg: { width: '100%', height: 160 },
  heroOverlay: {
    flex: 1, backgroundColor: 'rgba(15,80,30,0.68)',
    paddingHorizontal: 16, paddingBottom: 16, paddingTop: 12, justifyContent: 'flex-end',
  },
  backBtn: {
    position: 'absolute', top: 12, left: 16,
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 3 },

  body: { padding: 16, paddingBottom: 40 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 12, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: Colors.gray[100],
  },
  statIcon: { marginBottom: 6 },
  statValue: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: 10, color: Colors.textSecondary, marginTop: 3, textAlign: 'center' },

  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fffbeb', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#fef3c7', marginBottom: 16,
  },
  alertText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#92400e' },

  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, marginBottom: 12 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  moduleCard: {
    width: '47%',
    backgroundColor: '#fff', borderRadius: 18, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    borderWidth: 1, borderColor: Colors.gray[100],
  },
  moduleIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  moduleLabel: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 3 },
  moduleDesc: { fontSize: 11, color: Colors.textSecondary, lineHeight: 15, marginBottom: 10 },
  moduleArrow: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' },

  tipCard: {
    backgroundColor: Colors.primaryBg, borderRadius: 16, padding: 16,
    borderWidth: 1.5, borderColor: Colors.primaryMid,
  },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  tipTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  tipBody: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19, marginBottom: 12 },
  tipBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  tipBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
});
