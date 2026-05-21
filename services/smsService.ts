/**
 * SMS reminders: expo-sms when available, else opens the system composer.
 * Offline: queues messages in MMKV (or AsyncStorage fallback in Expo Go).
 */
import { Linking } from 'react-native';

import type { FarmTask } from '@/types/crop-management';

import { fastGet, fastSet } from './fastStorage';

const SMS_QUEUE_KEY = 'zimfarm_sms_queue';

export interface SmsQueueItem {
  id: string;
  phone: string;
  message: string;
  createdAt: number;
}

function readSmsQueue(): SmsQueueItem[] {
  try {
    const raw = fastGet(SMS_QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SmsQueueItem[];
  } catch {
    return [];
  }
}

function writeSmsQueue(items: SmsQueueItem[]): void {
  fastSet(SMS_QUEUE_KEY, JSON.stringify(items));
}

export function buildSmsReminderBody(task: FarmTask): string {
  return `ZimFarm Reminder: ${task.title} for ${task.cropName} due ${task.dueDate}`;
}

export function queueSmsReminder(phone: string, message: string): void {
  const q = readSmsQueue();
  q.push({ id: `sms_${Date.now()}`, phone, message, createdAt: Date.now() });
  writeSmsQueue(q);
}

export async function openSmsComposer(phone: string, message: string): Promise<void> {
  const body = encodeURIComponent(message);
  const url = `sms:${phone.replace(/\s/g, '')}?body=${body}`;
  const can = await Linking.canOpenURL(url);
  if (can) await Linking.openURL(url);
}

/**
 * Prefers expo-sms when available; otherwise opens the native SMS composer.
 * When offline, queues the message for later.
 */
export async function sendOrComposeSms(
  phone: string,
  message: string,
  options?: { offline?: boolean }
): Promise<'sent' | 'composed' | 'queued' | 'unavailable'> {
  if (options?.offline) {
    queueSmsReminder(phone, message);
    return 'queued';
  }

  try {
    const SMS = await import('expo-sms').catch(() => null);
    if (SMS) {
      const available = await SMS.isAvailableAsync();
      if (available) {
        const result = await SMS.sendSMSAsync([phone], message);
        if (result.result === 'sent') return 'sent';
        if (result.result === 'cancelled') return 'composed';
      }
    }
  } catch {
    // fall through to openSmsComposer
  }

  await openSmsComposer(phone, message);
  return 'composed';
}

export async function sendTaskSmsReminder(
  task: FarmTask,
  phone: string,
  offline: boolean
): Promise<'sent' | 'composed' | 'queued' | 'unavailable'> {
  const message = buildSmsReminderBody(task);
  return sendOrComposeSms(phone, message, { offline });
}
