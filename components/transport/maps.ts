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
  return regionForPoints([from, to]);
}

/** Fits any set of coordinates, with a town-sized floor so a short hop still reads. */
export function regionForPoints(points: { latitude: number; longitude: number }[]) {
  if (points.length === 0) {
    return { latitude: -17.8292, longitude: 31.0522, latitudeDelta: 0.6, longitudeDelta: 0.6 };
  }
  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(Math.abs(maxLat - minLat) * 1.6, 0.6),
    longitudeDelta: Math.max(Math.abs(maxLng - minLng) * 1.6, 0.6),
  };
}
