import type { FarmTask } from '@/types/crop-management';
import type { AppNotification } from '@/types/notifications';

import { updateTaskNotificationId } from './database';
import { fastGetAsync, fastSetAsync } from './fastStorage';
import { isOnline } from './syncService';
import { sendTaskSmsReminder } from './smsService';
import { useSettingsStore } from '@/stores/settingsStore';

// Set notification handler lazily so the module doesn't crash when
// expo-notifications is not installed yet.
let notifHandlerSet = false;
async function ensureHandler() {
  if (notifHandlerSet) return;
  const Notifications = await import('expo-notifications').catch(() => null);
  if (!Notifications) return;
  notifHandlerSet = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}
void ensureHandler();

const DIGEST_STORAGE_KEY = 'farmbridge_digest_notif_id';
const APP_NAME = 'FarmBridge';

function pushEnabled(): boolean {
  return useSettingsStore.getState().pushNotifications;
}

/** Listen for foreground push notifications and mirror into the in-app inbox. */
export async function registerNotificationListeners(
  onInboxItem: (item: AppNotification) => void,
): Promise<(() => void) | null> {
  await ensureHandler();
  const Notifications = await import('expo-notifications').catch(() => null);
  if (!Notifications?.addNotificationReceivedListener) return null;

  const sub = Notifications.addNotificationReceivedListener((notification) => {
    const content = notification.request.content;
    const title = typeof content.title === 'string' ? content.title : APP_NAME;
    const body = typeof content.body === 'string' ? content.body : '';
    const data = (content.data ?? {}) as { taskId?: string; href?: string };
    onInboxItem({
      id: `push-${notification.date}-${title}`.slice(0, 80),
      title,
      body,
      type: data.taskId ? 'task' : 'system',
      createdAt: new Date(notification.date).toISOString(),
      read: false,
      href: data.href ?? (data.taskId ? '/crop-management/tasks' : undefined),
    });
  });

  return () => sub.remove();
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const Notifications = await import('expo-notifications').catch(() => null);
  if (!Notifications) return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleTaskNotification(task: FarmTask): Promise<string | null> {
  if (!pushEnabled()) return null;
  const Notifications = await import('expo-notifications').catch(() => null);
  if (!Notifications) return null;

  const granted = await requestNotificationPermissions();
  if (!granted) return null;

  const due = new Date(task.dueDate);
  due.setHours(7, 0, 0, 0);

  const dayBefore = new Date(due);
  dayBefore.setDate(dayBefore.getDate() - 1);
  dayBefore.setHours(7, 0, 0, 0);

  const now = Date.now();
  const triggers: { date: Date; title: string }[] = [];

  if (dayBefore.getTime() > now) {
    triggers.push({ date: dayBefore, title: `Tomorrow: ${task.title} 💧` });
  }
  if (due.getTime() > now) {
    triggers.push({ date: due, title: `Today's Task: ${task.title}` });
  }

  let lastId: string | null = null;
  for (const trigger of triggers) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${APP_NAME} Reminder`,
        body: trigger.title,
        data: { taskId: task.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: trigger.date,
      },
    });
    lastId = id;
  }

  return lastId;
}

export async function cancelTaskNotification(notificationId: string | null): Promise<void> {
  if (!notificationId) return;
  const Notifications = await import('expo-notifications').catch(() => null);
  if (!Notifications) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // ignore
  }
}

export async function rescheduleTaskNotification(task: FarmTask): Promise<string | null> {
  await cancelTaskNotification(task.notificationId);
  const id = await scheduleTaskNotification(task);
  await updateTaskNotificationId(task.id, id);
  return id;
}

function nextSixAm(): Date {
  const d = new Date();
  d.setHours(6, 0, 0, 0);
  if (d.getTime() <= Date.now()) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

export async function cancelDailyDigestNotification(): Promise<void> {
  const prev = await fastGetAsync(DIGEST_STORAGE_KEY);
  if (!prev) return;
  const Notifications = await import('expo-notifications').catch(() => null);
  if (!Notifications) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(prev);
  } catch {
    // ignore
  }
  await fastSetAsync(DIGEST_STORAGE_KEY, '');
}

/** Schedules the next 6:00 local notification (re-schedule on app open for fresh task count). */
export async function rescheduleDailyDigestNotification(taskCountToday: number): Promise<void> {
  if (!pushEnabled()) {
    await cancelDailyDigestNotification();
    return;
  }
  const Notifications = await import('expo-notifications').catch(() => null);
  if (!Notifications) return;

  await cancelDailyDigestNotification();
  const granted = await requestNotificationPermissions();
  if (!granted) return;

  const when = nextSixAm();
  const body =
    taskCountToday > 0
      ? `You have ${taskCountToday} farm task(s) due today.`
      : "Open FarmBridge for today's tasks and market tips.";

  const id = await Notifications.scheduleNotificationAsync({
    content: { title: `🌱 ${APP_NAME}`, body, data: { href: '/(tabs)' } },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: when,
    },
  });
  await fastSetAsync(DIGEST_STORAGE_KEY, id);
}

export async function openSmsReminder(task: FarmTask, phone: string): Promise<void> {
  const online = await isOnline();
  await sendTaskSmsReminder(task, phone, !online);
}
