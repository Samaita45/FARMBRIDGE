import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, IconButton } from '@/components/design-system';
import { DS } from '@/constants/design-system';
import type { CropPlan, FarmTask } from '@/types/crop-management';
import type { IconName } from '@/types/icons';

// ── Types ──────────────────────────────────────────────────────────────────
type EventType = 'plant' | 'water' | 'fertilize' | 'harvest' | 'treat' | 'mixed';

/**
 * Event colours come from DS.semantic, not a private Material palette. `color`
 * is the readable foreground and `bg` its matching tinted surface, so a dot and
 * its chip always pass contrast together.
 */
const EVENT_CONFIG: Record<EventType, { color: string; bg: string; icon: IconName; label: string }> = {
  plant:     { color: DS.semantic.success.fg, bg: DS.semantic.success.bg, icon: 'leaf-outline',     label: 'Planting' },
  water:     { color: DS.semantic.info.fg,    bg: DS.semantic.info.bg,    icon: 'water-outline',    label: 'Watering' },
  fertilize: { color: DS.semantic.warning.fg, bg: DS.semantic.warning.bg, icon: 'flask-outline',    label: 'Fertilize' },
  harvest:   { color: DS.semantic.danger.fg,  bg: DS.semantic.danger.bg,  icon: 'basket-outline',   label: 'Harvest' },
  treat:     { color: DS.colors.purple,       bg: DS.colors.surfaceMuted, icon: 'medkit-outline',   label: 'Treatment' },
  mixed:     { color: DS.semantic.neutral.fg, bg: DS.semantic.neutral.bg, icon: 'calendar-outline', label: 'Multiple' },
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];

interface MonthCalendarProps {
  plans: CropPlan[];
  tasks: FarmTask[];
  onDayPress?: (date: string) => void;
  onAddTask?: (task: Partial<FarmTask>) => void;
}

// ── Main component ──────────────────────────────────────────────────────────
export function MonthCalendar({ plans, tasks, onDayPress, onAddTask }: MonthCalendarProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const { year, month, cells } = useMemo(() => {
    const y = viewDate.getFullYear();
    const m = viewDate.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const c: (number | null)[] = [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    // pad to complete last row
    while (c.length % 7 !== 0) c.push(null);
    return { year: y, month: m, cells: c };
  }, [viewDate]);

  // Build event map: dateStr → EventType
  const eventMap = useMemo(() => {
    const map = new Map<string, Set<EventType>>();
    const add = (date: string, type: EventType) => {
      if (!map.has(date)) map.set(date, new Set());
      map.get(date)!.add(type);
    };
    for (const plan of plans) {
      add(plan.plantDate, 'plant');
      add(plan.harvestDate, 'harvest');
    }
    for (const task of tasks) {
      const t = task.taskType as EventType;
      if (t && EVENT_CONFIG[t]) add(task.dueDate, t);
    }
    const result = new Map<string, EventType>();
    map.forEach((types, date) => {
      result.set(date, types.size > 1 ? 'mixed' : [...types][0]);
    });
    return result;
  }, [plans, tasks]);

  // Tasks for selected date
  const dayTasks = useMemo(() =>
    tasks.filter((t) => t.dueDate === selectedDate),
    [tasks, selectedDate]
  );
  const dayPlans = useMemo(() =>
    plans.filter((p) => p.plantDate === selectedDate || p.harvestDate === selectedDate),
    [plans, selectedDate]
  );

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const goToday = () => {
    setViewDate(new Date());
    setSelectedDate(today);
  };

  const handleDayPress = (dateStr: string) => {
    setSelectedDate(dateStr);
    onDayPress?.(dateStr);
  };

  const isToday = (d: string) => d === today;
  const isSelected = (d: string) => d === selectedDate;

  return (
    <View style={s.root}>
      {/* ── Month navigation header ── */}
      <View style={s.header}>
        <IconButton
          icon="chevron-back"
          accessibilityLabel="Previous month"
          variant="outline"
          size="sm"
          onPress={prevMonth}
        />
        <Pressable
          onPress={goToday}
          accessibilityRole="button"
          accessibilityLabel={`${MONTHS[month]} ${year}. Jump to today.`}
          style={s.monthWrap}>
          <Text style={s.monthText}>{MONTHS[month]}</Text>
          <Text style={s.yearText}>{year}</Text>
        </Pressable>
        <IconButton
          icon="chevron-forward"
          accessibilityLabel="Next month"
          variant="outline"
          size="sm"
          onPress={nextMonth}
        />
      </View>

      {/* ── Weekday headers ── */}
      <View style={s.weekRow}>
        {WEEKDAYS.map((d) => (
          <Text key={d} style={[s.weekDay, d === 'Sun' && s.sundayText]}>{d}</Text>
        ))}
      </View>

      {/* ── Calendar grid ── */}
      <View style={s.grid}>
        {cells.map((day, idx) => {
          if (day === null) return <View key={`e-${idx}`} style={s.emptyCell} />;

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const event = eventMap.get(dateStr);
          const cfg = event ? EVENT_CONFIG[event] : null;
          const today_ = isToday(dateStr);
          const selected_ = isSelected(dateStr);
          const isSun = idx % 7 === 0;

          return (
            <Pressable
              key={dateStr}
              onPress={() => handleDayPress(dateStr)}
              accessibilityRole="button"
              accessibilityState={{ selected: selected_ }}
              accessibilityLabel={
                `${day} ${MONTHS[month]}` +
                (today_ ? ', today' : '') +
                (cfg ? `, ${cfg.label.toLowerCase()} scheduled` : '')
              }
              style={({ pressed }) => [s.cell, pressed && { opacity: 0.75 }]}>
              <View style={[
                s.dayCircle,
                today_ && s.todayCircle,
                selected_ && !today_ && s.selectedCircle,
                cfg && !today_ && !selected_ && { backgroundColor: cfg.bg },
              ]}>
                <Text style={[
                  s.dayText,
                  isSun && s.sundayText,
                  today_ && s.todayText,
                  selected_ && !today_ && s.selectedText,
                ]}>
                  {day}
                </Text>
              </View>
              {/* Event dot */}
              {cfg && (
                <View style={[s.dot, { backgroundColor: cfg.color }]} />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* ── Legend ── */}
      <View style={s.legend}>
        {(['plant', 'water', 'fertilize', 'harvest'] as EventType[]).map((type) => {
          const cfg = EVENT_CONFIG[type];
          return (
            <View key={type} style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: cfg.color }]} />
              <Text style={s.legendText}>{cfg.label}</Text>
            </View>
          );
        })}
      </View>

      {/* ── Day agenda ── */}
      <View style={s.agenda}>
        <View style={s.agendaHeader}>
          <View style={s.agendaDateBadge}>
            <Text style={s.agendaDateText}>{selectedDate}</Text>
          </View>
          {/*
            Only offered when a handler exists. Previously this button rendered
            unconditionally while the modal behind it was gated on `onAddTask`,
            so on the planner screen -- which passes no handler -- tapping it
            did nothing at all.
          */}
          {onAddTask ? (
            <Button
              title="Add task"
              size="sm"
              icon="add"
              fullWidth={false}
              onPress={() => setAddModalOpen(true)}
              accessibilityLabel={`Add a task on ${selectedDate}`}
            />
          ) : null}
        </View>

        {dayPlans.length === 0 && dayTasks.length === 0 ? (
          <View style={s.emptyDay}>
            <Ionicons name="calendar-outline" size={28} color={DS.colors.textFaint} />
            <Text style={s.emptyDayText}>No tasks scheduled</Text>
            <Text style={s.emptyDayHint}>
              {onAddTask
                ? 'Tap “Add task” to schedule an activity'
                : 'Tasks appear here when you add a crop plan'}
            </Text>
          </View>
        ) : (
          <View style={s.taskList}>
            {dayPlans.map((plan) => (
              <AgendaItem
                key={`plan-${plan.id}`}
                type={plan.plantDate === selectedDate ? 'plant' : 'harvest'}
                title={`${plan.plantDate === selectedDate ? 'Plant' : 'Harvest'} ${plan.cropName}`}
                subtitle={`${plan.hectares} ha · Est. yield ${plan.expectedYieldKg.toLocaleString()} kg`}
              />
            ))}
            {dayTasks.map((task) => (
              <AgendaItem
                key={task.id}
                type={task.taskType as EventType}
                title={task.title}
                subtitle={task.taskType}
                done={task.status === 'completed'}
              />
            ))}
          </View>
        )}
      </View>

      {/* ── Add task modal ── */}
      {onAddTask && (
        <AddTaskModal
          visible={addModalOpen}
          date={selectedDate}
          onClose={() => setAddModalOpen(false)}
          onSave={(task) => { onAddTask(task); setAddModalOpen(false); }}
        />
      )}
    </View>
  );
}

// ── AgendaItem sub-component ───────────────────────────────────────────────
function AgendaItem({ type, title, subtitle, done }: {
  type: EventType; title: string; subtitle: string; done?: boolean;
}) {
  const cfg = EVENT_CONFIG[type] ?? EVENT_CONFIG.mixed;
  return (
    <View style={[ai.item, done && ai.itemDone]}>
      <View style={[ai.stripe, { backgroundColor: cfg.color }]} />
      <View style={[ai.iconWrap, { backgroundColor: cfg.bg }]}>
        <Ionicons name={cfg.icon} size={16} color={cfg.color} />
      </View>
      <View style={ai.text}>
        <Text style={[ai.title, done && ai.titleDone]} numberOfLines={1}>{title}</Text>
        <Text style={ai.sub} numberOfLines={1}>{subtitle}</Text>
      </View>
      {done && (
        <View style={ai.doneBadge}>
          <Ionicons name="checkmark-circle" size={16} color={DS.semantic.success.solid} />
        </View>
      )}
    </View>
  );
}

const ai = StyleSheet.create({
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: DS.colors.surface, borderRadius: 12, marginBottom: 8,
    padding: 10, overflow: 'hidden',
    borderWidth: 1, borderColor: DS.colors.border,
  },
  itemDone: { opacity: 0.65 },
  stripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  iconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1 },
  title: { fontSize: 13, fontWeight: '700', color: DS.colors.text },
  titleDone: { textDecorationLine: 'line-through' },
  sub: { fontSize: 11, color: DS.colors.textMuted, marginTop: 2 },
  doneBadge: { padding: 2 },
});

// ── AddTaskModal sub-component ────────────────────────────────────────────
const TASK_TYPES: { type: EventType; label: string }[] = [
  { type: 'plant',     label: 'Planting' },
  { type: 'water',     label: 'Watering' },
  { type: 'fertilize', label: 'Fertilize' },
  { type: 'harvest',   label: 'Harvest' },
  { type: 'treat',     label: 'Treatment' },
];

function AddTaskModal({ visible, date, onClose, onSave }: {
  visible: boolean; date: string;
  onClose: () => void;
  onSave: (task: Partial<FarmTask>) => void;
}) {
  const [title, setTitle] = useState('');
  const [taskType, setTaskType] = useState<EventType>('water');
  const [notes, setNotes] = useState('');

  const save = () => {
    if (!title.trim()) return;
    onSave({ title, taskType, notes, dueDate: date, status: 'pending' } as Partial<FarmTask>);
    setTitle('');
    setNotes('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={m.backdrop}>
        <View style={m.sheet}>
          {/* Handle bar */}
          <View style={m.handle} />

          <Text style={m.sheetTitle}>Add Farm Task</Text>
          <Text style={m.sheetDate}>{date}</Text>

          {/* Task type chips */}
          <Text style={m.label}>Activity type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={m.typeRow}>
            {TASK_TYPES.map(({ type, label }) => {
              const cfg = EVENT_CONFIG[type];
              const active = taskType === type;
              return (
                <Pressable
                  key={type}
                  onPress={() => setTaskType(type)}
                  style={[m.typeChip, active && { backgroundColor: cfg.color, borderColor: cfg.color }]}>
                  <Ionicons name={cfg.icon} size={13} color={active ? DS.colors.textInverse : cfg.color} />
                  <Text style={[m.typeChipText, active && { color: DS.colors.textInverse }]}>{label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Title */}
          <Text style={m.label}>Task title *</Text>
          <View style={m.inputWrap}>
            <TextInput
              style={m.input}
              placeholder="e.g. Water tomatoes in field A"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor={DS.colors.textSoft}
            />
          </View>

          {/* Notes */}
          <Text style={m.label}>Notes (optional)</Text>
          <View style={[m.inputWrap, { height: 80 }]}>
            <TextInput
              style={[m.input, { height: 70 }]}
              placeholder="Additional details..."
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholderTextColor={DS.colors.textSoft}
            />
          </View>

          {/* Actions */}
          <View style={m.actions}>
            <Pressable onPress={onClose} style={m.cancelBtn}>
              <Text style={m.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={save}
              style={({ pressed }) => [m.saveBtn, !title.trim() && m.saveBtnDisabled, pressed && { opacity: 0.85 }]}>
              <Ionicons name="checkmark" size={16} color={DS.colors.textInverse} />
              <Text style={m.saveText}>Save Task</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Stylesheet ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { backgroundColor: DS.colors.surface, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: DS.colors.border },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 12,
    backgroundColor: DS.colors.surfaceMuted,
    borderBottomWidth: 1, borderBottomColor: DS.colors.border,
  },
  navBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: DS.colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: DS.colors.border },
  monthWrap: { alignItems: 'center' },
  monthText: { fontSize: 16, fontWeight: '800', color: DS.colors.text },
  yearText: { fontSize: 11, color: DS.colors.textMuted, marginTop: 1 },

  // Weekdays
  weekRow: { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 8, backgroundColor: DS.colors.surfaceMuted },
  weekDay: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: DS.colors.textMuted },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 4, paddingBottom: 8 },
  emptyCell: { width: '14.28%', aspectRatio: 1 },
  cell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 2 },
  dayCircle: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  todayCircle: { backgroundColor: DS.colors.primary },
  selectedCircle: { backgroundColor: DS.colors.border, borderWidth: 1.5, borderColor: DS.colors.primary },
  dayText: { fontSize: 13, fontWeight: '600', color: DS.colors.text },
  sundayText: { color: DS.semantic.danger.solid },
  todayText: { color: DS.colors.textInverse, fontWeight: '800' },
  selectedText: { color: DS.colors.primary, fontWeight: '800' },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 1 },

  // Legend
  legend: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    paddingHorizontal: 12, paddingBottom: 12, paddingTop: 4,
    borderTopWidth: 1, borderTopColor: DS.colors.borderLight,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: DS.colors.textMuted, fontWeight: '600' },

  // Agenda
  agenda: { borderTopWidth: 1, borderTopColor: DS.colors.borderLight, padding: 14 },
  agendaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  agendaDateBadge: { backgroundColor: DS.colors.surfaceMuted, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: DS.colors.border },
  agendaDateText: { fontSize: 12, fontWeight: '700', color: DS.colors.primary },
  emptyDay: { alignItems: 'center', paddingVertical: 20, gap: 6 },
  emptyDayText: { fontSize: 14, fontWeight: '700', color: DS.colors.text },
  emptyDayHint: { fontSize: 12, color: DS.colors.textMuted },
  taskList: {},
});

const m = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: DS.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: DS.colors.textFaint, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: DS.colors.text, marginBottom: 2 },
  sheetDate: { fontSize: 12, color: DS.colors.textMuted, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: DS.colors.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  typeRow: { gap: 8, paddingBottom: 4, marginBottom: 16 },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: DS.colors.borderLight, borderWidth: 1, borderColor: DS.colors.border,
  },
  typeChipText: { fontSize: 12, fontWeight: '600', color: DS.colors.text },
  inputWrap: {
    backgroundColor: DS.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: DS.colors.border,
    paddingHorizontal: 14, paddingVertical: 2, marginBottom: 14,
  },
  input: { fontSize: 14, color: DS.colors.text, paddingVertical: 10 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, borderColor: DS.colors.border, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '700', color: DS.colors.textMuted },
  saveBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: DS.colors.primary, borderRadius: 12, paddingVertical: 13,
  },
  saveBtnDisabled: { backgroundColor: DS.colors.textFaint },
  saveText: { fontSize: 14, fontWeight: '700', color: DS.colors.textInverse },
});

