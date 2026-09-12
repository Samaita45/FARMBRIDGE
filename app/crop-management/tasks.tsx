import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TaskCard } from '@/components/crop-management/task-card';
import { EmptyState, LoadingState } from '@/components/design-system';
import { useToast } from '@/components/ui/toast-provider';
import { DS } from '@/constants/design-system';
import { type TaskFilter, useFarmTasks } from '@/hooks/useFarmTasks';
import { openSmsReminder } from '@/services/notificationService';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import type { FarmTask } from '@/types/crop-management';

const FILTERS: { key: TaskFilter; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
];

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function TasksScreen() {
  const { showToast } = useToast();
  const user = useAuthStore((s) => s.user);
  const settings = useSettingsStore();
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const {
    tasks,
    filter,
    setFilter,
    loading,
    refresh,
    completeTask,
    rescheduleTask,
    completionRate,
  } = useFarmTasks();

  useEffect(() => {
    if (user?.id) void hydrateSettings(user.id);
  }, [user?.id, hydrateSettings]);

  const handleSms = useCallback(
    async (task: FarmTask) => {
      const phone = settings.smsReminderPhone?.trim() || user?.phone;
      if (!phone) {
        showToast('Add a phone number in Settings to send SMS reminders', 'warning');
        return;
      }
      await openSmsReminder(task, phone);
    },
    [settings.smsReminderPhone, user?.phone, showToast]
  );

  const renderTask = useCallback(
    ({ item }: { item: FarmTask }) => (
      <View>
        <TaskCard
          task={item}
          onComplete={() => {
            void completeTask(item.id);
            showToast('Task completed', 'success');
          }}
          onReschedule={() => {
            void rescheduleTask(item.id, addDays(item.dueDate, 3));
            showToast('Rescheduled by 3 days', 'info');
          }}
        />
        {item.status !== 'completed' ? (
          <Pressable
            onPress={() => void handleSms(item)}
            accessibilityRole="button"
            accessibilityLabel={`Send an SMS reminder for ${item.title}`}
            hitSlop={8}
            style={styles.smsRow}>
            <Ionicons name="chatbox-ellipses-outline" size={14} color={DS.colors.primary} />
            <Text style={styles.smsText}>Send SMS reminder</Text>
          </Pressable>
        ) : null}
      </View>
    ),
    [completeTask, rescheduleTask, handleSms, showToast]
  );

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <View style={styles.progressBar}>
        <Text style={styles.progressLabel}>Weekly completion</Text>
        <View
          style={styles.track}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: completionRate }}>
          <View style={[styles.fill, { width: `${completionRate}%` }]} />
        </View>
        <Text style={styles.progressValue}>{completionRate}% complete</Text>
      </View>

      <View style={styles.filterBar}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Show ${f.label} tasks`}
              style={[styles.chip, active && styles.chipActive]}>
              <Text
                style={[styles.chipText, active && styles.chipTextActive]}
                maxFontSizeMultiplier={DS.layout.maxFontScale}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        contentContainerStyle={[styles.list, tasks.length === 0 && styles.listEmpty]}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={DS.colors.primary} />
        }
        ListEmptyComponent={
          loading ? (
            <LoadingState title="Loading tasks" />
          ) : (
            <EmptyState
              icon="checkmark-done-outline"
              title="No tasks in this view"
              description="Tasks are generated automatically when you add a crop plan."
            />
          )
        }
        removeClippedSubviews
        initialNumToRender={8}
        windowSize={9}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText} maxFontSizeMultiplier={DS.layout.maxFontScale}>
          Reminders arrive at 7 AM on the due date. SMS opens your phone’s message app.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.background },

  progressBar: {
    backgroundColor: DS.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: DS.colors.borderLight,
    paddingHorizontal: DS.spacing.md,
    paddingVertical: 12,
    gap: 6,
  },
  progressLabel: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  track: {
    height: 6,
    borderRadius: DS.radius.full,
    backgroundColor: DS.colors.surfaceMuted,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: DS.radius.full,
    backgroundColor: DS.colors.primary,
  },
  progressValue: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.primary,
  },

  filterBar: {
    flexDirection: 'row',
    gap: DS.spacing.sm,
    paddingHorizontal: DS.spacing.md,
    paddingVertical: DS.spacing.sm + 2,
    backgroundColor: DS.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: DS.colors.borderLight,
  },
  chip: {
    flex: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DS.spacing.sm,
    borderRadius: DS.radius.sm,
    backgroundColor: DS.colors.surfaceMuted,
  },
  chipActive: { backgroundColor: DS.colors.primary },
  chipText: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textMuted,
  },
  chipTextActive: { color: DS.colors.textInverse },

  list: {
    padding: DS.spacing.md,
    paddingBottom: DS.spacing.lg,
  },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },

  smsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    marginTop: -6,
    marginBottom: DS.spacing.sm + 4,
    marginLeft: DS.spacing.xs,
    paddingVertical: 4,
  },
  smsText: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.primary,
  },

  footer: {
    borderTopWidth: 1,
    borderTopColor: DS.colors.borderLight,
    backgroundColor: DS.colors.surface,
    paddingHorizontal: DS.spacing.md,
    paddingVertical: 12,
  },
  footerText: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textSoft,
  },
});
