import { useEffect } from 'react';

import { getTasks } from '@/services/database';
import { cancelDailyDigestNotification, rescheduleDailyDigestNotification } from '@/services/notificationService';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';

/** Re-schedules the next 6:00 digest based on today’s pending tasks (local/offline). */
export function useDailyDigestScheduler() {
  const user = useAuthStore((s) => s.user);
  const pushOn = useSettingsStore((s) => s.pushNotifications);

  useEffect(() => {
    if (!user?.id) return;
    if (!pushOn) {
      void cancelDailyDigestNotification();
      return;
    }
    void (async () => {
      const tasks = await getTasks(user.id);
      const today = new Date().toISOString().slice(0, 10);
      const count = tasks.filter(
        (t) => t.dueDate === today && t.status !== 'completed'
      ).length;
      await rescheduleDailyDigestNotification(count);
    })();
  }, [user?.id, pushOn]);
}
