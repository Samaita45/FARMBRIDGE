import { useEffect, useState } from 'react';

import { PROVINCES } from '@/constants/zimbabwe-data';
import { useAuthStore, type AuthState } from '@/stores/authStore';

export interface AppLocation {
  latitude: number;
  longitude: number;
  label: string;
}

const HARARE: AppLocation = {
  latitude: -17.8292,
  longitude: 31.0539,
  label: 'Harare',
};

export function useLocation() {
  const user = useAuthStore((s: AuthState) => s.user);
  const [location, setLocation] = useState<AppLocation>(HARARE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function resolve() {
      const userProvince = PROVINCES.find((p) => p.name === user?.province);
      if (userProvince) {
        setLocation({
          latitude: userProvince.latitude,
          longitude: userProvince.longitude,
          label: userProvince.name,
        });
      }

      try {
        // expo-location is optional; use dynamic import to avoid crash
        // when the package is not yet installed.
        const Location = await import('expo-location').catch(() => null);
        if (!Location) {
          if (active) setLoading(false);
          return;
        }
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (active) setLoading(false);
          return;
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (active) {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            label: user?.province ?? 'Your location',
          });
        }
      } catch {
        // keep province or Harare default
      } finally {
        if (active) setLoading(false);
      }
    }

    void resolve();
    return () => {
      active = false;
    };
  }, [user?.province]);

  return { location, loading };
}
