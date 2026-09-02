import { findPlace } from '@/constants/zimbabwe-data/places';

/**
 * Shared map plumbing for the transport screens.
 *
 * react-native-maps is loaded defensively and once: if it is unavailable the
 * screens fall back to a non-map layout rather than taking the tab down. Both
 * the route preview and the nearby map need the same loader and the same
 * text-to-coordinate lookup, so they live here instead of being copied.
 */

/**
 * Loads react-native-maps, or null when it is not usable.
 *
 * The require succeeding is not enough — the JS resolves even when the native
 * side is missing, and the failure then arrives as a render crash rather than
 * as a null. Checking for the default export catches that here, where it can
 * be handled, instead of on screen.
 */
function loadMaps() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-maps') as typeof import('react-native-maps');
    return mod?.default ? mod : null;
  } catch {
    return null;
  }
}

export const Maps = loadMaps();

/** True when a map can be drawn at all. Screens use it to explain the absence. */
export const MAPS_AVAILABLE = Maps !== null;

export interface Point {
  latitude: number;
  longitude: number;
  label: string;
}

/**
 * Matches free text against the town gazetteer.
 *
 * This used to check the ten provinces and their capitals only, so a route to
 * Chegutu, Kadoma or Rusape resolved to nothing and the map did not draw at
 * all. It now covers the towns people actually name.
 *
 * Still returns null rather than guessing: a pin dropped somewhere plausible is
 * worse than no pin on a screen about where goods are going.
 */
export function locate(text: string): Point | null {
  const place = findPlace(text);
  if (!place) return null;
  return { latitude: place.latitude, longitude: place.longitude, label: place.name };
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
