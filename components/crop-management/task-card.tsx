import { Pressable, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import type { FarmTask } from '@/types/crop-management';
import { TASK_TYPE_META } from '@/types/crop-management';

interface TaskCardProps {
  task: FarmTask;
  onComplete: () => void;
  onReschedule: () => void;
}

const PRIORITY_COLORS = {
  low: Colors.gray[400],
  medium: Colors.warning,
  high: Colors.error,
};

export function TaskCard({ task, onComplete, onReschedule }: TaskCardProps) {
  const meta = TASK_TYPE_META[task.taskType];
  const overdue = task.status === 'overdue';

  return (
    <View
      className={`mb-3 rounded-2xl bg-white p-4 ${overdue ? 'border border-error/30' : ''}`}
      style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}>
      <View className="flex-row items-start justify-between">
        <View className="flex-row gap-3">
          <Text className="text-2xl">{meta.icon}</Text>
          <View className="flex-1">
            <Text className="font-sans-semibold text-dark">{task.title}</Text>
            <Text className="font-sans text-sm text-gray-500">{task.cropName}</Text>
            <Text className="mt-1 font-sans text-xs text-gray-400">
              Due: {task.dueDate}
              {overdue ? ' · ⚠️ Overdue' : ''}
            </Text>
          </View>
        </View>
        <View
          className="rounded-full px-2 py-0.5"
          style={{ backgroundColor: `${PRIORITY_COLORS[task.priority]}22` }}>
          <Text className="font-sans text-[10px]" style={{ color: PRIORITY_COLORS[task.priority] }}>
            {task.priority}
          </Text>
        </View>
      </View>

      {task.status !== 'completed' ? (
        <View className="mt-3 flex-row gap-2">
          <Pressable
            onPress={onComplete}
            className="flex-1 rounded-xl bg-primary py-2 active:opacity-90">
            <Text className="text-center font-sans-semibold text-sm text-white">Complete</Text>
          </Pressable>
          <Pressable
            onPress={onReschedule}
            className="flex-1 rounded-xl border border-gray-200 py-2">
            <Text className="text-center font-sans-semibold text-sm text-gray-600">+3 days</Text>
          </Pressable>
        </View>
      ) : (
        <Text className="mt-2 font-sans text-sm text-primary">✓ Completed</Text>
      )}
    </View>
  );
}
