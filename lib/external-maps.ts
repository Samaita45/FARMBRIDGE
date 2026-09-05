import { Linking, Platform } from 'react-native';

import type { GeoPoint } from '@/types/geo';

/**
 * Opens the device maps app for turn-by-turn navigation.
 *
 * This is the driver's "navigate to pickup" path. FarmBridge does not ship
 * its own navigation SDK.
 */
export function openExternalNavigation(point: GeoPoint, label: string): Promise<void> {
  const { latitude, longitude } = point;
  const q = encodeURIComponent(label);
  const url =
    Platform.OS === 'ios'
      ? `maps://?daddr=${latitude},${longitude}&q=${q}`
      : Platform.OS === 'android'
        ? `google.navigation:q=${latitude},${longitude}`
        : `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  return Linking.openURL(url).then(() => undefined);
}
