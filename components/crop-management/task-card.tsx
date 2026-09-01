import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Button, ButtonRow, Card } from '@/components/design-system';
import { DS } from '@/constants/design-system';
import type { FarmTask, TaskPriority } from '@/types/crop-management';
import { TASK_TYPE_META } from '@/types/crop-management';

interface TaskCardProps {
  task: FarmTask;
  onComplete: () => void;
  onReschedule: () => void;
}

const PRIORITY_TONE: Record<TaskPriority, 'neutral' | 'warning' | 'danger'> = {
  low: 'neutral',
  medium: 'warning',
  high: 'danger',
};

export function TaskCard({ task, onComplete, onReschedule }: TaskCardProps) {
  const meta = TASK_TYPE_META[task.taskType];
  const overdue = task.status === 'overdue';
  const done = task.status === 'completed';
  const priority = DS.semantic[PRIORITY_TONE[task.priority]];
  const tone = DS.semantic[meta.tone];

  return (
    <Card
      style={[styles.card, overdue && styles.cardOverdue]}
      accessibilityRole="summary"
      accessibilityLabel={`${meta.label} task: ${task.title} for ${task.cropName}. Due ${task.dueDate}. ${task.priority} priority.${overdue ? ' Overdue.' : ''}`}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: tone.bg }]}>
          <Ionicons name={meta.icon} size={18} color={tone.fg} />
        </View>

        <View style={styles.body}>
          <Text style={styles.title} maxFontSizeMultiplier={DS.layout.maxFontScale}>
            {task.title}
          </Text>
          <Text style={styles.crop} maxFontSizeMultiplier={DS.layout.maxFontScale}>
            {task.cropName}
          </Text>
          <View style={styles.dueRow}>
            <Text style={styles.due} maxFontSizeMultiplier={DS.layout.maxFontScale}>
              Due {task.dueDate}
            </Text>
            {overdue ? (
              <View style={styles.overdueChip}>
                <Ionicons name="alert-circle" size={11} color={DS.semantic.danger.fg} />
                <Text style={styles.overdueText}>Overdue</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={[styles.priorityChip, { backgroundColor: priority.bg, borderColor: priority.border }]}>
          <Text style={[styles.priorityText, { color: priority.fg }]}>{task.priority}</Text>
        </View>
      </View>

      {done ? (
        <View style={styles.doneRow}>
          <Ionicons name="checkmark-circle" size={16} color={DS.semantic.success.solid} />
          <Text style={styles.doneText}>Completed</Text>
        </View>
      ) : (
        <ButtonRow style={styles.actions}>
          <Button
            title="Complete"
            size="sm"
            icon="checkmark"
            onPress={onComplete}
            style={styles.action}
            accessibilityLabel={`Mark ${task.title} complete`}
          />
          <Button
            title="+3 days"
            variant="outline"
            size="sm"
            onPress={onReschedule}
            style={styles.action}
            accessibilityLabel={`Reschedule ${task.title} by three days`}
          />
        </ButtonRow>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: DS.spacing.sm + 4,
  },
  cardOverdue: {
    borderColor: DS.semantic.danger.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: DS.spacing.sm + 4,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: DS.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  crop: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm,
    marginTop: 2,
  },
  due: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textSoft,
  },
  overdueChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: DS.semantic.danger.bg,
    borderRadius: DS.radius.xs,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  overdueText: {
    fontSize: 10,
    fontFamily: DS.fontFamily.semibold,
    color: DS.semantic.danger.fg,
  },
  priorityChip: {
    borderRadius: DS.radius.xs,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  priorityText: {
    fontSize: 10,
    fontFamily: DS.fontFamily.semibold,
    textTransform: 'capitalize',
  },
  actions: {
    marginTop: DS.spacing.sm + 4,
  },
  action: {
    flex: 1,
  },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: DS.spacing.sm,
  },
  doneText: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.semantic.success.fg,
  },
});
