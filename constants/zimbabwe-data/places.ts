/**
 * A gazetteer of Zimbabwean towns.
 *
 * WHY THIS EXISTS. Location text was matched against the ten provinces and
 * their capitals and nothing else, so "Chegutu", "Kadoma", "Rusape" and every
 * other town in the country resolved to nothing — and the route map, which
 * refuses to guess, simply did not draw. Coordinates were also used to label a
 * position by reading the user's saved profile province, which is why the app
 * said "Harare" to someone standing in Kwekwe.
 *
 * These are town centres, to roughly a kilometre. They are good enough to
 * place a marker and to name where somebody is; they are not survey data and
 * nothing should navigate by them.
 */

export interface Place {
  name: string;
  latitude: number;
  longitude: number;
  /** The province the town sits in, for a coarser label. */
  province: string;
}

export const PLACES: Place[] = [
  // Harare and its satellites
  { name: 'Harare', latitude: -17.8292, longitude: 31.0522, province: 'Harare' },
  { name: 'Chitungwiza', latitude: -18.0128, longitude: 31.0756, province: 'Harare' },
  { name: 'Epworth', latitude: -17.89, longitude: 31.1467, province: 'Harare' },
  { name: 'Ruwa', latitude: -17.8894, longitude: 31.245, province: 'Mashonaland East' },
  { name: 'Norton', latitude: -17.8833, longitude: 30.7, province: 'Mashonaland West' },

  // Bulawayo and Matabeleland
  { name: 'Bulawayo', latitude: -20.15, longitude: 28.5833, province: 'Bulawayo' },
  { name: 'Esigodini', latitude: -20.3, longitude: 28.9333, province: 'Matabeleland South' },
  { name: 'Gwanda', latitude: -20.9333, longitude: 29.0, province: 'Matabeleland South' },
  { name: 'Beitbridge', latitude: -22.2167, longitude: 30.0, province: 'Matabeleland South' },
  { name: 'Plumtree', latitude: -20.4833, longitude: 27.8167, province: 'Matabeleland South' },
  { name: 'Filabusi', latitude: -20.5333, longitude: 29.2833, province: 'Matabeleland South' },
  { name: 'Lupane', latitude: -18.9333, longitude: 27.8, province: 'Matabeleland North' },
  { name: 'Hwange', latitude: -18.3647, longitude: 26.5, province: 'Matabeleland North' },
  { name: 'Victoria Falls', latitude: -17.9243, longitude: 25.8572, province: 'Matabeleland North' },
  { name: 'Binga', latitude: -17.6206, longitude: 27.3411, province: 'Matabeleland North' },

  // Midlands
  { name: 'Gweru', latitude: -19.45, longitude: 29.8167, province: 'Midlands' },
  { name: 'Kwekwe', latitude: -18.9281, longitude: 29.8149, province: 'Midlands' },
  { name: 'Redcliff', latitude: -19.0333, longitude: 29.7833, province: 'Midlands' },
  { name: 'Shurugwi', latitude: -19.67, longitude: 30.0, province: 'Midlands' },
  { name: 'Zvishavane', latitude: -20.3333, longitude: 30.0667, province: 'Midlands' },
  { name: 'Gokwe', latitude: -18.2167, longitude: 28.9333, province: 'Midlands' },
  { name: 'Mberengwa', latitude: -20.5167, longitude: 29.9, province: 'Midlands' },

  // Manicaland
  { name: 'Mutare', latitude: -18.9707, longitude: 32.6709, province: 'Manicaland' },
  { name: 'Rusape', latitude: -18.5275, longitude: 32.1283, province: 'Manicaland' },
  { name: 'Chipinge', latitude: -20.1883, longitude: 32.6236, province: 'Manicaland' },
  { name: 'Nyanga', latitude: -18.2167, longitude: 32.75, province: 'Manicaland' },
  { name: 'Chimanimani', latitude: -19.8, longitude: 32.8667, province: 'Manicaland' },
  { name: 'Headlands', latitude: -18.35, longitude: 32.0667, province: 'Manicaland' },

  // Mashonaland West
  { name: 'Chinhoyi', latitude: -17.3667, longitude: 30.2, province: 'Mashonaland West' },
  { name: 'Chegutu', latitude: -18.13, longitude: 30.14, province: 'Mashonaland West' },
  { name: 'Kadoma', latitude: -18.3333, longitude: 29.9167, province: 'Mashonaland West' },
  { name: 'Karoi', latitude: -16.81, longitude: 29.69, province: 'Mashonaland West' },
  { name: 'Kariba', latitude: -16.5167, longitude: 28.8, province: 'Mashonaland West' },
  { name: 'Banket', latitude: -17.3833, longitude: 30.4, province: 'Mashonaland West' },
  { name: 'Sanyati', latitude: -17.8, longitude: 29.4, province: 'Mashonaland West' },

  // Mashonaland Central
  { name: 'Bindura', latitude: -17.3019, longitude: 31.3306, province: 'Mashonaland Central' },
  { name: 'Mount Darwin', latitude: -16.7728, longitude: 31.5839, province: 'Mashonaland Central' },
  { name: 'Shamva', latitude: -17.3167, longitude: 31.5667, province: 'Mashonaland Central' },
  { name: 'Mvurwi', latitude: -17.0333, longitude: 30.85, province: 'Mashonaland Central' },
  { name: 'Guruve', latitude: -16.65, longitude: 30.7, province: 'Mashonaland Central' },
  { name: 'Centenary', latitude: -16.7833, longitude: 31.1167, province: 'Mashonaland Central' },

  // Mashonaland East
  { name: 'Marondera', latitude: -18.1853, longitude: 31.5519, province: 'Mashonaland East' },
  { name: 'Murewa', latitude: -17.65, longitude: 31.7833, province: 'Mashonaland East' },
  { name: 'Mutoko', latitude: -17.4, longitude: 32.2167, province: 'Mashonaland East' },
  { name: 'Wedza', latitude: -18.6167, longitude: 31.5833, province: 'Mashonaland East' },
  { name: 'Chivhu', latitude: -19.0167, longitude: 30.9, province: 'Mashonaland East' },

  // Masvingo
  { name: 'Masvingo', latitude: -20.0744, longitude: 30.8328, province: 'Masvingo' },
  { name: 'Chiredzi', latitude: -21.05, longitude: 31.6667, province: 'Masvingo' },
  { name: 'Triangle', latitude: -21.0333, longitude: 31.4667, province: 'Masvingo' },
  { name: 'Bikita', latitude: -20.0833, longitude: 31.3167, province: 'Masvingo' },
  { name: 'Gutu', latitude: -19.6333, longitude: 31.1667, province: 'Masvingo' },
  { name: 'Mwenezi', latitude: -21.3667, longitude: 30.7333, province: 'Masvingo' },
];

/**
 * Finds a town in free text.
 *
 * Longest name first, so "Mount Darwin" is not swallowed by a shorter entry and
 * "Victoria Falls" wins over nothing at all. Returns null rather than guessing:
 * a pin in the wrong place is worse than no pin on a screen about where goods
 * are going.
 */
export function findPlace(text: string): Place | null {
  const query = text.trim().toLowerCase();
  if (!query) return null;

  const byLength = [...PLACES].sort((a, b) => b.name.length - a.name.length);
  return byLength.find((p) => query.includes(p.name.toLowerCase())) ?? null;
}

const EARTH_KM = 6371;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in kilometres. */
export function distanceKmBetween(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * The nearest town to a coordinate, and how far away it is.
 *
 * This is what names a GPS fix when there is no network for a reverse geocode.
 * The distance comes back with it so the caller can say "near Kwekwe" instead
 * of claiming to be in it — the gazetteer holds towns, not farms, and most of
 * this country is neither.
 */
export function nearestPlace(coords: { latitude: number; longitude: number }): {
  place: Place;
  distanceKm: number;
} {
  let best = PLACES[0];
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const place of PLACES) {
    const d = distanceKmBetween(coords, place);
    if (d < bestDistance) {
      best = place;
      bestDistance = d;
    }
  }

  return { place: best, distanceKm: Math.round(bestDistance) };
}
