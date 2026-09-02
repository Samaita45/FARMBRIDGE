import { PROVINCES } from '@/constants/zimbabwe-data';

/**
 * Shared map plumbing for the transport screens.
 *
 * react-native-maps is loaded defensively and once: if it is unavailable the
 * screens fall back to a non-map layout rather than taking the tab down. Both
 * the route preview and the nearby map need the same loader and the same
 * text-to-coordinate lookup, so they live here instead of being copied.
 */

/** Loads react-native-maps, or null when it is not present. */
function loadMaps() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-maps') as typeof import('react-native-maps');
  } catch {
    return null;
  }
}

export const Maps = loadMaps();

export interface Point {
  latitude: number;
  longitude: number;
  label: string;
}

/**
 * Matches free text against province and capital names.
 *
 * Returns null rather than guessing. There is no geocoder, and a pin dropped
 * somewhere plausible is worse than no pin on a screen about where goods are
 * going.
 */
export function locate(text: string): Point | null {
  const query = text.trim().toLowerCase();
  if (!query) return null;

  const match =
    PROVINCES.find((p) => query.includes(p.name.toLowerCase())) ??
    PROVINCES.find((p) => query.includes(p.capital.toLowerCase()));

  if (!match) return null;
  return { latitude: match.latitude, longitude: match.longitude, label: match.name };
}

/** A region that fits both points with a margin, never narrower than a town. */
export function regionFor(from: Point, to: Point) {
  return {
    latitude: (from.latitude + to.latitude) / 2,
    longitude: (from.longitude + to.longitude) / 2,
    latitudeDelta: Math.max(Math.abs(from.latitude - to.latitude) * 1.6, 0.6),
    longitudeDelta: Math.max(Math.abs(from.longitude - to.longitude) * 1.6, 0.6),
  };
}
