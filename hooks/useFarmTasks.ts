import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  deleteTask,
  getTaskById,
  getTasks,
  updateTaskDueDate,
  updateTaskStatus,
} from '@/services/database';
import {
  cancelTaskNotification,
  rescheduleTaskNotification,
} from '@/services/notificationService';
import { enqueueSync, isOnline } from '@/services/syncService';
import { useAuthStore } from '@/stores/authStore';
import type { FarmTask, TaskStatus } from '@/types/crop-management';

function isToday(dateStr: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return dateStr === today;
}

function isThisWeek(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(now.getDate() + 7);
  return d >= now && d <= weekEnd;
}

function isOverdue(task: FarmTask): boolean {
  if (task.status === 'completed') return false;
  return task.dueDate < new Date().toISOString().slice(0, 10);
}

export type TaskFilter = 'today' | 'week' | 'upcoming' | 'completed';

export function useFarmTasks() {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? 'guest';
  const [tasks, setTasks] = useState<FarmTask[]>([]);
  const [filter, setFilter] = useState<TaskFilter>('today');
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await getTasks(userId);
    const withOverdue = data.map((t) =>
      isOverdue(t) && t.status === 'pending' ? { ...t, status: 'overdue' as TaskStatus } : t
    );
    setTasks(withOverdue);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    switch (filter) {
      case 'today':
        return tasks.filter((t) => isToday(t.dueDate) && t.status !== 'completed');
      case 'week':
        return tasks.filter((t) => isThisWeek(t.dueDate) && t.status !== 'completed');
      case 'upcoming':
        return tasks.filter((t) => t.dueDate > new Date().toISOString().slice(0, 10) && t.status !== 'completed');
      case 'completed':
        return tasks.filter((t) => t.status === 'completed');
      default:
        return tasks;
    }
  }, [tasks, filter]);

  const completeTask = useCallback(
    async (taskId: string) => {
      const task = await getTaskById(taskId);
      if (task?.notificationId) await cancelTaskNotification(task.notificationId);
      await updateTaskStatus(taskId, 'completed');
      if (!(await isOnline())) {
        enqueueSync({ kind: 'task_complete', payload: { taskId } });
      }
      await refresh();
    },
    [refresh]
  );

  const rescheduleTask = useCallback(
    async (taskId: string, newDate: string) => {
      await updateTaskDueDate(taskId, newDate);
      const updated = await getTaskById(taskId);
      if (updated) {
        await rescheduleTaskNotification(updated);
      }
      await refresh();
    },
    [refresh]
  );

  const removeTask = useCallback(
    async (taskId: string) => {
      const task = await getTaskById(taskId);
      if (task?.notificationId) await cancelTaskNotification(task.notificationId);
      await deleteTask(taskId);
      await refresh();
    },
    [refresh]
  );

  const completionRate = useMemo(() => {
    const total = tasks.filter((t) => t.status !== 'pending' || isThisWeek(t.dueDate)).length;
    const done = tasks.filter((t) => t.status === 'completed').length;
    return total === 0 ? 0 : Math.round((done / total) * 100);
  }, [tasks]);

  return {
    tasks: filtered,
    allTasks: tasks,
    filter,
    setFilter,
    loading,
    refresh,
    completeTask,
    rescheduleTask,
    removeTask,
    completionRate,
  };
}
