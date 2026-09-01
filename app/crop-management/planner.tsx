import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddPlanModal } from '@/components/crop-management/add-plan-modal';
import { MonthCalendar } from '@/components/crop-management/month-calendar';
import { Button, Card, EmptyState, IconButton } from '@/components/design-system';
import { useToast } from '@/components/ui/toast-provider';
import { DS } from '@/constants/design-system';
import { CROPS, getCropsForMonth, getCurrentSeason } from '@/constants/zimbabwe-data';
import { useCropPlans } from '@/hooks/useCropPlans';
import { useFarmTasks } from '@/hooks/useFarmTasks';
import { getRotationSuggestion } from '@/services/taskGenerator';
import type { CropPlan, FarmTask } from '@/types/crop-management';
import type { IconName } from '@/types/icons';
import { getCropIcon } from '@/utils/crop-emoji';

const MONTH = new Date().getMonth() + 1;

export default function CropPlannerScreen() {
  const { showToast } = useToast();
  const { plans, loading, refresh, addPlan, removePlan } = useCropPlans();
  const { allTasks } = useFarmTasks();
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const season = getCurrentSeason(MONTH);
  const recommended = useMemo(() => getCropsForMonth(MONTH).slice(0, 5), []);
  const notRecommended = useMemo(
    () =>
      CROPS.filter(
        (c) => !c.bestPlantingMonths.includes(MONTH) && c.demandLevel !== 'very_high'
      ).slice(0, 3),
    []
  );

  const lastCropId = plans.length > 0 ? plans[plans.length - 1].cropId : null;
  const rotationTip = getRotationSuggestion(lastCropId);

  const pendingCount = allTasks.filter((t) => t.status !== 'completed').length;
  const doneCount = allTasks.filter((t) => t.status === 'completed').length;

  const handleAddPlan = async (cropId: string, plantDate: string, hectares: number) => {
    setSaving(true);
    try {
      await addPlan({ cropId, plantDate, hectares });
      showToast('Crop plan saved and tasks scheduled', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not save the plan', 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeletePlan = useCallback(
    (plan: CropPlan) => {
      Alert.alert(
        `Delete the ${plan.cropName} plan?`,
        'Its scheduled tasks and reminders are removed too. This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => void removePlan(plan.id) },
        ]
      );
    },
    [removePlan]
  );

  const renderPlan = useCallback(
    ({ item }: { item: CropPlan }) => (
      <PlanCard
        plan={item}
        tasks={allTasks.filter((t) => t.cropPlanId === item.id)}
        onDelete={() => confirmDeletePlan(item)}
      />
    ),
    [allTasks, confirmDeletePlan]
  );

  const header = (
    <View style={styles.headerBlock}>
      <View style={styles.statsRow}>
        <StatPill icon="leaf-outline" label="Active plans" value={plans.length} tone="info" />
        <StatPill icon="time-outline" label="Pending" value={pendingCount} tone="warning" />
        <StatPill icon="checkmark-circle-outline" label="Done" value={doneCount} tone="success" />
      </View>

      <MonthCalendar plans={plans} tasks={allTasks} />

      <Card style={styles.seasonCard}>
        <View style={styles.seasonIcon}>
          <Ionicons name="partly-sunny-outline" size={20} color={DS.colors.primary} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.seasonName}>{season.name}</Text>
          <Text style={styles.seasonDesc}>Optimal planting window is open</Text>
        </View>
      </Card>

      <SectionHeading icon="checkmark-circle-outline" tone="success" title="Plant now" />
      <FlatList
        horizontal
        data={recommended}
        keyExtractor={(c) => c.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        renderItem={({ item: c }) => (
          <Pressable
            onPress={() => setModalOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={`Plan ${c.name}, currently $${c.currentPriceUSD.toFixed(2)} per kilogram`}
            style={({ pressed }) => [styles.cropChip, pressed && styles.pressed]}>
            <View style={styles.cropChipIcon}>
              <Ionicons name={getCropIcon(c.category)} size={18} color={DS.colors.primary} />
            </View>
            <Text style={styles.cropChipName}>{c.name}</Text>
            <Text style={styles.cropChipPrice}>${c.currentPriceUSD.toFixed(2)}/kg</Text>
          </Pressable>
        )}
      />

      {rotationTip ? (
        <Card style={styles.rotation}>
          <Ionicons name="refresh-circle-outline" size={20} color={DS.colors.accent} />
          <View style={styles.flex}>
            <Text style={styles.rotationTitle}>Crop rotation</Text>
            <Text style={styles.rotationDesc}>{rotationTip}</Text>
          </View>
        </Card>
      ) : null}

      {notRecommended.length > 0 ? (
        <>
          <SectionHeading icon="warning-outline" tone="warning" title="Hold off on these" />
          <Card style={styles.warnCard}>
            {notRecommended.map((c) => (
              <View key={c.id} style={styles.warnRow}>
                <Ionicons name={getCropIcon(c.category)} size={16} color={DS.semantic.warning.fg} />
                <Text style={styles.warnName}>{c.name}</Text>
                <Text style={styles.warnNote}>Wait for {season.name.toLowerCase()}</Text>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      <SectionHeading icon="list-outline" tone="info" title="My crop plans" count={plans.length} />
    </View>
  );

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <IconButton
              icon="add"
              accessibilityLabel="Add a new crop plan"
              variant="primary"
              size="sm"
              onPress={() => setModalOpen(true)}
            />
          ),
        }}
      />

      <FlatList
        data={plans}
        keyExtractor={(p) => p.id}
        renderItem={renderPlan}
        ListHeaderComponent={header}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={DS.colors.primary} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="leaf-outline"
            title="No crop plans yet"
            description="Add a crop and FarmBridge builds the watering, fertilising and harvest schedule for you."
            actionLabel="Add your first crop"
            onAction={() => setModalOpen(true)}
          />
        }
        initialNumToRender={4}
        windowSize={7}
      />

      <AddPlanModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAddPlan}
        loading={saving}
      />
    </SafeAreaView>
  );
}

function PlanCard({
  plan,
  tasks,
  onDelete,
}: {
  plan: CropPlan;
  tasks: FarmTask[];
  onDelete: () => void;
}) {
  const crop = CROPS.find((c) => c.id === plan.cropId);
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const donePct = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

  return (
    <Card style={styles.planCard}>
      <View style={styles.planTop}>
        <View style={styles.planIcon}>
          <Ionicons name={getCropIcon(crop?.category)} size={22} color={DS.colors.primary} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.planName}>{plan.cropName}</Text>
          <Text style={styles.planMeta}>
            {plan.hectares} ha · planted {plan.plantDate}
          </Text>
        </View>
        <IconButton
          icon="trash-outline"
          accessibilityLabel={`Delete the ${plan.cropName} plan`}
          variant="ghost"
          size="sm"
          onPress={onDelete}
        />
      </View>

      <View style={styles.planStats}>
        <PlanStat label="Harvest" value={plan.harvestDate} icon="calendar-outline" />
        <PlanStat
          label="Expected yield"
          value={`${plan.expectedYieldKg.toLocaleString()} kg`}
          icon="scale-outline"
        />
        <PlanStat
          label="Est. revenue"
          value={`$${plan.expectedRevenueUSD.toLocaleString()}`}
          icon="cash-outline"
          tone="success"
        />
      </View>

      {tasks.length > 0 ? (
        <View style={styles.progressWrap}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>
              {completed} of {tasks.length} tasks complete
            </Text>
            <Text style={styles.progressPct}>{donePct}%</Text>
          </View>
          <View
            style={styles.progressTrack}
            accessibilityRole="progressbar"
            accessibilityLabel={`${plan.cropName} task progress`}
            accessibilityValue={{ min: 0, max: 100, now: donePct }}>
            <View style={[styles.progressFill, { width: `${donePct}%` }]} />
          </View>
        </View>
      ) : null}
    </Card>
  );
}

function SectionHeading({
  icon,
  title,
  tone,
  count,
}: {
  icon: IconName;
  title: string;
  tone: keyof typeof DS.semantic;
  count?: number;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={16} color={DS.semantic[tone].solid} />
      <Text style={styles.sectionTitle}>{title}</Text>
      {count !== undefined ? (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      ) : null}
    </View>
  );
}

function StatPill({
  icon,
  label,
  value,
  tone,
}: {
  icon: IconName;
  label: string;
  value: number;
  tone: keyof typeof DS.semantic;
}) {
  const colour = DS.semantic[tone];
  return (
    <View
      style={[styles.pill, { borderColor: colour.border, backgroundColor: colour.bg }]}
      accessibilityRole="summary"
      accessibilityLabel={`${value} ${label}`}>
      <Ionicons name={icon} size={14} color={colour.fg} />
      <Text style={[styles.pillValue, { color: colour.fg }]}>{value}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

function PlanStat({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: IconName;
  tone?: keyof typeof DS.semantic;
}) {
  return (
    <View style={styles.planStat}>
      <Ionicons name={icon} size={13} color={DS.colors.textSoft} />
      <Text style={styles.planStatLabel}>{label}</Text>
      <Text
        style={[styles.planStatValue, tone ? { color: DS.semantic[tone].fg } : null]}
        numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.background },
  body: { padding: DS.spacing.md, paddingBottom: DS.spacing.xl },
  flex: { flex: 1 },
  pressed: { opacity: 0.85 },

  headerBlock: { gap: DS.spacing.md, marginBottom: DS.spacing.md },

  statsRow: { flexDirection: 'row', gap: DS.spacing.sm },
  pill: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: DS.radius.md,
    borderWidth: 1,
  },
  pillValue: { fontSize: DS.typography.h3.fontSize, fontFamily: DS.fontFamily.bold },
  pillLabel: {
    fontSize: 10,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
    textAlign: 'center',
  },

  seasonCard: { flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm + 4 },
  seasonIcon: {
    width: 40,
    height: 40,
    borderRadius: DS.radius.md,
    backgroundColor: DS.colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seasonName: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  seasonDesc: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
    marginTop: 1,
  },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm },
  sectionTitle: {
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  countBadge: {
    minWidth: 22,
    alignItems: 'center',
    backgroundColor: DS.colors.surfaceMuted,
    borderRadius: DS.radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  countText: {
    fontSize: 11,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textMuted,
  },

  chipRow: { gap: DS.spacing.sm, paddingRight: DS.spacing.xs },
  cropChip: {
    width: 104,
    alignItems: 'center',
    gap: 3,
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.lg,
    borderWidth: 1,
    borderColor: DS.colors.border,
    paddingVertical: DS.spacing.sm + 4,
    paddingHorizontal: DS.spacing.sm,
  },
  cropChipIcon: {
    width: 36,
    height: 36,
    borderRadius: DS.radius.md,
    backgroundColor: DS.colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  cropChipName: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  cropChipPrice: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },

  rotation: { flexDirection: 'row', alignItems: 'flex-start', gap: DS.spacing.sm + 4 },
  rotationTitle: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  rotationDesc: {
    fontSize: DS.typography.caption.fontSize,
    lineHeight: 18,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
    marginTop: 2,
  },

  warnCard: { gap: DS.spacing.sm },
  warnRow: { flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm },
  warnName: {
    flex: 1,
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  warnNote: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textSoft,
  },

  planCard: { marginBottom: DS.spacing.sm + 4, gap: DS.spacing.sm + 4 },
  planTop: { flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm + 4 },
  planIcon: {
    width: 44,
    height: 44,
    borderRadius: DS.radius.md,
    backgroundColor: DS.colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planName: {
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  planMeta: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
    marginTop: 1,
  },

  planStats: {
    flexDirection: 'row',
    gap: DS.spacing.sm,
    paddingTop: DS.spacing.sm + 4,
    borderTopWidth: 1,
    borderTopColor: DS.colors.borderLight,
  },
  planStat: { flex: 1, alignItems: 'flex-start', gap: 2 },
  planStatLabel: {
    fontSize: 10,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textSoft,
  },
  planStatValue: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },

  progressWrap: { gap: 5 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  progressPct: {
    fontSize: 11,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.primary,
  },
  progressTrack: {
    height: 5,
    borderRadius: DS.radius.full,
    backgroundColor: DS.colors.surfaceMuted,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: DS.radius.full,
    backgroundColor: DS.colors.primary,
  },
});
