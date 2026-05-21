import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddPlanModal } from '@/components/crop-management/add-plan-modal';
import { MonthCalendar } from '@/components/crop-management/month-calendar';
import { useToast } from '@/components/ui/toast-provider';
import Colors from '@/constants/colors';
import { CROPS, getCropsForMonth, getCurrentSeason } from '@/constants/zimbabwe-data';
import { useCropPlans } from '@/hooks/useCropPlans';
import { useFarmTasks } from '@/hooks/useFarmTasks';
import { getRotationSuggestion } from '@/services/taskGenerator';
import { getCropEmoji } from '@/utils/crop-emoji';

const MONTH = new Date().getMonth() + 1;

export default function CropPlannerScreen() {
  const { showToast } = useToast();
  const { plans, loading, refresh, addPlan, removePlan } = useCropPlans();
  const { allTasks } = useFarmTasks();
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const season = getCurrentSeason(MONTH);
  const recommended = getCropsForMonth(MONTH).slice(0, 5);
  const notRecommended = CROPS.filter(
    (c) => !c.bestPlantingMonths.includes(MONTH) && c.demandLevel !== 'very_high'
  ).slice(0, 3);

  const lastCropId = plans.length > 0 ? plans[plans.length - 1].cropId : null;
  const rotationTip = getRotationSuggestion(lastCropId);

  const handleAddPlan = async (cropId: string, plantDate: string, hectares: number) => {
    setSaving(true);
    try {
      await addPlan({ cropId, plantDate, hectares });
      showToast('Crop plan saved with tasks scheduled!', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to save plan', 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeletePlan = (id: string) => {
    Alert.alert('Delete Plan?', 'This will also remove all related tasks.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void removePlan(id) },
    ]);
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>

      {/* ── Header ── */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </Pressable>
        <View style={s.headerText}>
          <Text style={s.headerTitle}>Farm Calendar</Text>
          <Text style={s.headerSub}>Plan crops, tasks & harvests</Text>
        </View>
        <Pressable
          onPress={() => setModalOpen(true)}
          style={({ pressed }) => [s.addPlanBtn, pressed && { opacity: 0.85 }]}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={s.addPlanText}>New Plan</Text>
        </Pressable>
      </View>

      {/* ── Stats bar ── */}
      <View style={s.statsBar}>
        <StatPill icon="leaf-outline" label="Active plans" value={plans.length} color={Colors.primary} />
        <StatPill
          icon="time-outline"
          label="Pending tasks"
          value={allTasks.filter((t) => t.status !== 'completed').length}
          color={Colors.warning}
        />
        <StatPill
          icon="checkmark-circle-outline"
          label="Done"
          value={allTasks.filter((t) => t.status === 'completed').length}
          color={Colors.success}
        />
      </View>

      <ScrollView
        contentContainerStyle={s.body}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}>

        {/* ── Calendar ── */}
        <MonthCalendar plans={plans} tasks={allTasks} />

        {/* ── Season info ── */}
        <View style={s.seasonCard}>
          <View style={s.seasonIcon}><Text style={{ fontSize: 22 }}>{season.icon}</Text></View>
          <View style={s.seasonText}>
            <Text style={s.seasonName}>{season.name} Season</Text>
            <Text style={s.seasonDesc}>Optimal planting window active</Text>
          </View>
        </View>

        {/* ── Recommended crops ── */}
        <View style={s.sectionHeader}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          <Text style={s.sectionTitle}>Plant Now</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
          {recommended.map((c) => (
            <Pressable key={c.id} style={s.cropChip} onPress={() => setModalOpen(true)}>
              <Text style={s.cropChipEmoji}>{getCropEmoji(c.id)}</Text>
              <Text style={s.cropChipName}>{c.name}</Text>
              <Text style={s.cropChipPrice}>${c.currentPriceUSD.toFixed(2)}/kg</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* ── Rotation tip ── */}
        {rotationTip && (
          <View style={s.rotationCard}>
            <View style={s.rotationIcon}>
              <Ionicons name="refresh-circle" size={20} color={Colors.accent} />
            </View>
            <View style={s.rotationText}>
              <Text style={s.rotationTitle}>Crop Rotation Tip</Text>
              <Text style={s.rotationDesc}>{rotationTip}</Text>
            </View>
          </View>
        )}

        {/* ── Warning crops ── */}
        {notRecommended.length > 0 && (
          <>
            <View style={s.sectionHeader}>
              <Ionicons name="warning" size={16} color={Colors.warning} />
              <Text style={[s.sectionTitle, { color: Colors.warning }]}>Not Recommended</Text>
            </View>
            <View style={s.warnCard}>
              {notRecommended.map((c) => (
                <View key={c.id} style={s.warnRow}>
                  <Text style={s.warnEmoji}>{getCropEmoji(c.id)}</Text>
                  <Text style={s.warnName}>{c.name}</Text>
                  <Text style={s.warnNote}>Wait for {season.name.toLowerCase()}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── My crop plans ── */}
        <View style={s.sectionHeader}>
          <Ionicons name="list" size={16} color={Colors.primary} />
          <Text style={s.sectionTitle}>My Crop Plans</Text>
          <View style={s.countBadge}><Text style={s.countText}>{plans.length}</Text></View>
        </View>

        {plans.length === 0 ? (
          <View style={s.emptyPlans}>
            <Ionicons name="leaf-outline" size={40} color={Colors.gray[300]} />
            <Text style={s.emptyPlansTitle}>No plans yet</Text>
            <Text style={s.emptyPlansHint}>Tap "New Plan" above to add your first crop</Text>
            <Pressable onPress={() => setModalOpen(true)} style={s.emptyBtn}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={s.emptyBtnText}>Add First Crop</Text>
            </Pressable>
          </View>
        ) : (
          plans.map((plan) => {
            const crop = CROPS.find((c) => c.id === plan.cropId);
            const tasksForPlan = allTasks.filter((t) => t.cropPlanId === plan.id);
            const donePct = tasksForPlan.length > 0
              ? Math.round((tasksForPlan.filter((t) => t.status === 'completed').length / tasksForPlan.length) * 100)
              : 0;
            return (
              <View key={plan.id} style={s.planCard}>
                {/* Plan header */}
                <View style={s.planTop}>
                  <View style={s.planEmoji}>
                    <Text style={{ fontSize: 24 }}>{getCropEmoji(plan.cropId, crop?.category)}</Text>
                  </View>
                  <View style={s.planInfo}>
                    <Text style={s.planName}>{plan.cropName}</Text>
                    <Text style={s.planMeta}>{plan.hectares} ha · Planted {plan.plantDate}</Text>
                  </View>
                  <Pressable
                    onPress={() => confirmDeletePlan(plan.id)}
                    style={s.deleteBtn}>
                    <Ionicons name="trash-outline" size={16} color={Colors.error} />
                  </Pressable>
                </View>

                {/* Stats row */}
                <View style={s.planStats}>
                  <PlanStat label="Harvest" value={plan.harvestDate} icon="calendar-outline" />
                  <View style={s.planStatDiv} />
                  <PlanStat label="Expected yield" value={`${plan.expectedYieldKg.toLocaleString()} kg`} icon="scale-outline" />
                  <View style={s.planStatDiv} />
                  <PlanStat label="Est. revenue" value={`$${plan.expectedRevenueUSD.toLocaleString()}`} icon="cash-outline" color={Colors.success} />
                </View>

                {/* Progress bar */}
                {tasksForPlan.length > 0 && (
                  <View style={s.progressWrap}>
                    <View style={s.progressRow}>
                      <Text style={s.progressLabel}>{tasksForPlan.filter((t) => t.status === 'completed').length}/{tasksForPlan.length} tasks complete</Text>
                      <Text style={s.progressPct}>{donePct}%</Text>
                    </View>
                    <View style={s.progressTrack}>
                      <View style={[s.progressFill, { width: `${donePct}%` }]} />
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      <AddPlanModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAddPlan}
        loading={saving}
      />
    </SafeAreaView>
  );
}

function StatPill({ icon, label, value, color }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; value: number; color: string;
}) {
  return (
    <View style={[sp.pill, { borderColor: color + '30' }]}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[sp.value, { color }]}>{value}</Text>
      <Text style={sp.label}>{label}</Text>
    </View>
  );
}

function PlanStat({ label, value, icon, color }: {
  label: string; value: string; icon: keyof typeof Ionicons.glyphMap; color?: string;
}) {
  return (
    <View style={ps.wrap}>
      <Ionicons name={icon} size={12} color={Colors.textSecondary} />
      <Text style={ps.label}>{label}</Text>
      <Text style={[ps.value, color ? { color } : {}]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primaryBg },

  header: {
    backgroundColor: Colors.primary,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16,
    shadowColor: Colors.primaryDark, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  addPlanBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  addPlanText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  statsBar: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: Colors.primaryBg, borderBottomWidth: 1, borderBottomColor: Colors.primaryMid,
  },

  body: { padding: 14, paddingBottom: 60, gap: 14 },

  // Season card
  seasonCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: Colors.primaryMid,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  seasonIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
  seasonText: { flex: 1 },
  seasonName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  seasonDesc: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },

  // Section
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary, flex: 1 },
  countBadge: { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  countText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  // Crop chips
  chipRow: { gap: 10, paddingBottom: 4 },
  cropChip: {
    backgroundColor: '#fff', borderRadius: 14, padding: 12, alignItems: 'center', width: 90,
    borderWidth: 1, borderColor: Colors.primaryMid,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  cropChipEmoji: { fontSize: 22, marginBottom: 4 },
  cropChipName: { fontSize: 11, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  cropChipPrice: { fontSize: 10, color: Colors.success, fontWeight: '600', marginTop: 2 },

  // Rotation
  rotationCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: Colors.accentLight, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: '#BBDEFB',
  },
  rotationIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  rotationText: { flex: 1 },
  rotationTitle: { fontSize: 13, fontWeight: '700', color: Colors.accent },
  rotationDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 3, lineHeight: 17 },

  // Warning
  warnCard: { backgroundColor: '#FFF8E1', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#FFE082' },
  warnRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  warnEmoji: { fontSize: 16 },
  warnName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, flex: 1 },
  warnNote: { fontSize: 11, color: Colors.warning, fontWeight: '600' },

  // Plan card
  planCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: Colors.gray[200],
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  planTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  planEmoji: { width: 46, height: 46, borderRadius: 14, backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
  planInfo: { flex: 1 },
  planName: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  planMeta: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  deleteBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#FFEBEE', alignItems: 'center', justifyContent: 'center' },

  planStats: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryBg, borderRadius: 12, padding: 10, marginBottom: 10 },
  planStatDiv: { width: 1, height: 30, backgroundColor: Colors.primaryMid, marginHorizontal: 10 },

  progressWrap: {},
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  progressLabel: { fontSize: 11, color: Colors.textSecondary },
  progressPct: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  progressTrack: { height: 5, backgroundColor: Colors.primaryMid, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },

  // Empty state
  emptyPlans: { alignItems: 'center', paddingVertical: 32, gap: 8, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: Colors.gray[200] },
  emptyPlansTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  emptyPlansHint: { fontSize: 12, color: Colors.textSecondary },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10, marginTop: 4 },
  emptyBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
});

const sp = StyleSheet.create({
  pill: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 8,
    alignItems: 'center', gap: 3,
    borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  value: { fontSize: 17, fontWeight: '800' },
  label: { fontSize: 9, color: Colors.textSecondary, textAlign: 'center' },
});

const ps = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', gap: 3 },
  label: { fontSize: 10, color: Colors.textSecondary },
  value: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
});
