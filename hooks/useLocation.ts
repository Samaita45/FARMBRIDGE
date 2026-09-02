import { useCallback, useEffect, useState } from 'react';

import { nearestPlace } from '@/constants/zimbabwe-data/places';
import { PROVINCES } from '@/constants/zimbabwe-data';
import { useAuthStore, type AuthState } from '@/stores/authStore';

export interface AppLocation {
  latitude: number;
  longitude: number;
  label: string;
}

/** Where the label and coordinates came from, so screens can say. */
export type LocationSource = 'gps' | 'profile' | 'default';

export type LocationPermission = 'unknown' | 'granted' | 'denied' | 'unavailable';

const HARARE: AppLocation = {
  latitude: -17.8292,
  longitude: 31.0522,
  label: 'Harare',
};

/**
 * Where the person using the app is.
 *
 * THE BUG THIS FIXES. The old version asked for a GPS fix, got one, and then
 * labelled it `user.province` — so the coordinates moved and the name did not.
 * Someone standing in Kwekwe with "Harare" saved on their profile was told
 * they were in Harare, with nothing on screen to suggest otherwise. Position
 * and label now come from the same place, always.
 *
 * NAMING A FIX, IN ORDER. A reverse geocode is tried first, since it can name a
 * suburb. It needs a network and, on Android, Play services, so when it is
 * unavailable the fix is named from the town gazetteer instead — which works
 * offline, and is the common case on a farm. If the nearest town is more than
 * 25 km away the label says "near", because the gazetteer holds towns and most
 * of Zimbabwe is not one.
 *
 * `source` says which of those happened. Screens that show the location are
 * expected to show it: a profile fallback presented as a live fix is the bug
 * this hook just had.
 */
export function useLocation() {
  const user = useAuthStore((s: AuthState) => s.user);
  const [location, setLocation] = useState<AppLocation>(HARARE);
  const [source, setSource] = useState<LocationSource>('default');
  const [permission, setPermission] = useState<LocationPermission>('unknown');
  const [loading, setLoading] = useState(true);

  const resolve = useCallback(async () => {
    setLoading(true);

    // Start from the profile province so there is always something sensible on
    // screen, and mark it as such.
    const userProvince = PROVINCES.find((p) => p.name === user?.province);
    if (userProvince) {
      setLocation({
        latitude: userProvince.latitude,
        longitude: userProvince.longitude,
        label: userProvince.name,
      });
      setSource('profile');
    }

    try {
      // expo-location is imported dynamically so a missing package degrades to
      // the profile location rather than taking the screen down.
      const Location = await import('expo-location').catch(() => null);
      if (!Location) {
        setPermission('unavailable');
        return;
      }

      const services = await Location.hasServicesEnabledAsync().catch(() => true);
      if (!services) {
        setPermission('unavailable');
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermission('denied');
        return;
      }
      setPermission('granted');

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };

      setLocation({ ...coords, label: await nameFor(Location, coords) });
      setSource('gps');
    } catch {
      // Keep whatever is already showing; `source` still says where it is from.
    } finally {
      setLoading(false);
    }
  }, [user?.province]);

  useEffect(() => {
    let active = true;
    void (async () => {
      await resolve();
      if (!active) return;
    })();
    return () => {
      active = false;
    };
  }, [resolve]);

  return { location, source, permission, loading, refresh: resolve };
}

/** Names a coordinate: reverse geocode if it works, gazetteer if it does not. */
async function nameFor(
  Location: typeof import('expo-location'),
  coords: { latitude: number; longitude: number }
): Promise<string> {
  try {
    const [result] = await Location.reverseGeocodeAsync(coords);
    const name = result?.city ?? result?.subregion ?? result?.district ?? null;
    if (name) return name;
  } catch {
    // No network, or no Play services. The gazetteer covers it.
  }

  const { place, distanceKm } = nearestPlace(coords);
  return distanceKm > 25 ? `Near ${place.name}` : place.name;
}
