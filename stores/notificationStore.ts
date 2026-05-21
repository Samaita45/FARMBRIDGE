import { create } from 'zustand';

import { getJSON, setJSON } from '@/services/storage';
import type { AppNotification } from '@/types/notifications';

const inboxKey = (userId: string) => `notification_inbox:${userId}`;

interface NotificationState {
  items: AppNotification[];
  isHydrated: boolean;
  hydrate: (userId: string) => Promise<void>;
  setItems: (userId: string, items: AppNotification[]) => Promise<void>;
  add: (userId: string, item: AppNotification) => Promise<void>;
  markRead: (userId: string, id: string) => Promise<void>;
  markAllRead: (userId: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  isHydrated: false,

  hydrate: async (userId) => {
    const items = (await getJSON<AppNotification[]>(inboxKey(userId))) ?? [];
    set({ items, isHydrated: true });
  },

  setItems: async (userId, items) => {
    await setJSON(inboxKey(userId), items);
    set({ items, isHydrated: true });
  },

  add: async (userId, item) => {
    const existing = get().items;
    if (existing.some((n) => n.id === item.id)) return;
    const items = [item, ...existing].slice(0, 50);
    await setJSON(inboxKey(userId), items);
    set({ items });
  },

  markRead: async (userId, id) => {
    const items = get().items.map((n) => (n.id === id ? { ...n, read: true } : n));
    await setJSON(inboxKey(userId), items);
    set({ items });
  },

  markAllRead: async (userId) => {
    const items = get().items.map((n) => ({ ...n, read: true }));
    await setJSON(inboxKey(userId), items);
    set({ items });
  },
}));

export const selectUnreadCount = (s: NotificationState): number =>
  s.items.filter((n) => !n.read).length;
