import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { resolveAvatarUri } from '@/lib/profile-photo';
import { getFarmProfile } from '@/services/profileService';
import { useAuthStore } from '@/stores/authStore';

export function useProfileAvatar() {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setAvatarUri(null);
      return;
    }
    const farm = await getFarmProfile(userId);
    const resolved = await resolveAvatarUri(farm.avatarUri);
    setAvatarUri(resolved);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const initials =
    user?.name
      ?.split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ??
    user?.name?.charAt(0)?.toUpperCase() ??
    'F';

  return { avatarUri, initials, refresh, userId };
}
