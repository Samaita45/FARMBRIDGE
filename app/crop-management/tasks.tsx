import { useEffect } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TaskCard } from '@/components/crop-management/task-card';
import { useToast } from '@/components/ui/toast-provider';
import { type TaskFilter, useFarmTasks } from '@/hooks/useFarmTasks';
import { openSmsReminder } from '@/services/notificationService';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';

const FILTERS: { key: TaskFilter; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
];

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

  const addDays = (dateStr: string, days: number) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };

  const handleSms = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    const phone = settings.smsReminderPhone?.trim() || user?.phone;
    if (!task || !phone) {
      showToast('Add phone in Settings or your profile for SMS reminders', 'warning');
      return;
    }
    await openSmsReminder(task, phone);
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
      <View className="border-b border-gray-100 bg-white px-4 py-3">
        <Text className="font-sans text-sm text-gray-500">Weekly completion</Text>
        <View className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
          <View
            className="h-full rounded-full bg-primary"
            style={{ width: `${completionRate}%` }}
          />
        </View>
        <Text className="mt-1 font-sans-bold text-primary">{completionRate}% complete</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="max-h-12 border-b border-gray-100 bg-white px-2">
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => setFilter(f.key)}
            className={`mx-1 rounded-full px-4 py-2 ${filter === f.key ? 'bg-primary' : 'bg-gray-100'}`}>
            <Text
              className={`font-sans-semibold text-sm ${filter === f.key ? 'text-white' : 'text-gray-600'}`}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}>
        {loading ? (
          <Text className="font-sans text-gray-500">Loading tasks...</Text>
        ) : tasks.length === 0 ? (
          <View className="items-center py-12">
            <Text className="text-4xl">📋</Text>
            <Text className="mt-2 font-sans text-gray-500">No tasks in this view</Text>
            <Text className="font-sans text-sm text-gray-400">
              Add a crop plan to generate tasks
            </Text>
          </View>
        ) : (
          tasks.map((task) => (
            <View key={task.id}>
              <TaskCard
                task={task}
                onComplete={() => {
                  void completeTask(task.id);
                  showToast('Task completed!', 'success');
                }}
                onReschedule={() => {
                  void rescheduleTask(task.id, addDays(task.dueDate, 3));
                  showToast('Rescheduled +3 days', 'info');
                }}
              />
              {task.status !== 'completed' ? (
                <Pressable
                  onPress={() => void handleSms(task.id)}
                  className="-mt-1 mb-3 ml-12">
                  <Text className="font-sans text-xs text-primary">📱 Send SMS reminder</Text>
                </Pressable>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>

      <View className="border-t border-gray-100 bg-white px-4 py-3">
        <Text className="font-sans text-xs text-gray-400">
          Push notifications scheduled for 7 AM on due dates. SMS opens your phone&apos;s message app.
        </Text>
      </View>
    </SafeAreaView>
  );
}
