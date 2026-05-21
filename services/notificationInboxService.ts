import { getTopDemandCrops } from '@/constants/zimbabwe-data';
import { getTasks } from '@/services/database';
import { useNotificationStore } from '@/stores/notificationStore';
import type { AppNotification } from '@/types/notifications';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Build inbox alerts from farm tasks, market data, and system messages. */
export async function syncNotificationInbox(userId: string): Promise<AppNotification[]> {
  const tasks = await getTasks(userId);
  const today = todayISO();
  const tomorrow = addDaysISO(1);
  const items: AppNotification[] = [];

  const dueToday = tasks.filter((t) => t.dueDate === today && t.status !== 'completed');
  const dueTomorrow = tasks.filter((t) => t.dueDate === tomorrow && t.status !== 'completed');

  for (const task of dueToday) {
    items.push({
      id: `task-today-${task.id}`,
      title: 'Task due today',
      body: `${task.title} · ${task.cropName}`,
      type: 'task',
      createdAt: new Date().toISOString(),
      read: false,
      href: '/crop-management/tasks',
    });
  }

  for (const task of dueTomorrow.slice(0, 5)) {
    items.push({
      id: `task-tmr-${task.id}`,
      title: 'Task tomorrow',
      body: `${task.title} · ${task.cropName}`,
      type: 'task',
      createdAt: new Date().toISOString(),
      read: false,
      href: '/crop-management/tasks',
    });
  }

  const top = getTopDemandCrops(1)[0];
  if (top) {
    items.push({
      id: `market-${top.id}-${today}`,
      title: 'Market insight',
      body: `${top.name} shows ${top.demandLevel.replace('_', ' ')} demand · $${top.currentPriceUSD.toFixed(2)}/kg`,
      type: 'market',
      createdAt: new Date().toISOString(),
      read: false,
      href: '/(tabs)/market',
    });
  }

  items.push({
    id: `digest-${today}`,
    title: 'Daily farm digest',
    body:
      dueToday.length > 0
        ? `${dueToday.length} task(s) scheduled for today. Push reminders fire at 7:00 AM.`
        : 'No tasks due today. Check weather and market prices on your dashboard.',
    type: 'system',
    createdAt: new Date().toISOString(),
    read: false,
    href: '/(tabs)',
  });

  const prev = useNotificationStore.getState().items;
  const readIds = new Set(prev.filter((n) => n.read).map((n) => n.id));

  const merged = items.map((n) => ({
    ...n,
    read: readIds.has(n.id),
  }));

  await useNotificationStore.getState().setItems(userId, merged);
  return merged;
}
