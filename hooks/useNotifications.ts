import { useCallback, useEffect } from 'react';

import { syncNotificationInbox } from '@/services/notificationInboxService';
import { requestNotificationPermissions } from '@/services/notificationService';
import { useAuthStore } from '@/stores/authStore';
import {
  selectUnreadCount,
  useNotificationStore,
} from '@/stores/notificationStore';

export function useNotifications() {
  const userId = useAuthStore((s) => s.user?.id);
  const items = useNotificationStore((s) => s.items);
  const unreadCount = useNotificationStore(selectUnreadCount);
  const hydrate = useNotificationStore((s) => s.hydrate);
  const isHydrated = useNotificationStore((s) => s.isHydrated);

  const refresh = useCallback(async () => {
    if (!userId) return;
    await hydrate(userId);
    await syncNotificationInbox(userId);
  }, [userId, hydrate]);

  useEffect(() => {
    if (!userId) return;
    void refresh();
  }, [userId, refresh]);

  const requestPermissions = useCallback(async () => {
    return requestNotificationPermissions();
  }, []);

  return {
    items,
    unreadCount,
    isHydrated,
    refresh,
    requestPermissions,
    userId,
  };
}
