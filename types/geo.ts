/**
 * Shared geography types. Coordinates live here so transport, farm and
 * delivery screens do not invent their own lat/lng shapes.
 */
export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export type PlaceRole =
  | 'pickup'
  | 'destination'
  | 'goods'
  | 'farm'
  | 'delivery'
  | 'current';

export interface ResolvedPlace extends GeoPoint {
  /** Display line: town, suburb, or formatted address. */
  address: string;
  placeId?: string;
  /** How the coordinates were obtained. */
  source: 'gazetteer' | 'gps' | 'places' | 'geocode';
  role?: PlaceRole;
}

export interface RouteEstimate {
  distanceKm: number;
  durationSeconds: number;
  /** Encoded polyline when the Routes API returned one. */
  polyline?: string;
  source: 'gazetteer' | 'routes';
}
