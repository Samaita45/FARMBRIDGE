import { IS_API_ENABLED } from '@/services/api/config';
import { api } from '@/services/api/client';
import type { ResolvedPlace, RouteEstimate } from '@/types/geo';
import * as Crypto from 'expo-crypto';

export interface PlaceSuggestion {
  placeId: string;
  primaryText: string;
  secondaryText: string;
}

interface AutocompleteResponse {
  suggestions: PlaceSuggestion[];
}

interface PlaceDetailsResponse {
  place: ResolvedPlace;
}

interface RouteResponse {
  route: RouteEstimate;
}

interface GeocodeResponse {
  place: ResolvedPlace;
}

/**
 * Maps REST client.
 *
 * Calls the Nest MapsModule. The Google server key never leaves the API.
 * When the API is off the functions return empty / null so the gazetteer
 * on the device remains the working path.
 */
/**
 * A fresh autocomplete session token.
 *
 * A UUID rather than a timestamp: two search fields mounting in the same
 * millisecond would otherwise share a token, and Google would bill their two
 * unrelated searches as one session — or reject the second.
 *
 * `randomUUID` comes from expo-crypto, which is already a dependency. The
 * fallback exists because the token only has to be unique, not unguessable:
 * losing it means one search bills per request, which is what happens today.
 */
export function newSessionToken(): string {
  try {
    return Crypto.randomUUID();
  } catch {
    return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

export const mapsApi = {
  async autocomplete(query: string, sessionToken?: string): Promise<PlaceSuggestion[]> {
    if (!IS_API_ENABLED || query.trim().length < 2) return [];
    try {
      const data = await api.get<AutocompleteResponse>(
        `/maps/autocomplete?q=${encodeURIComponent(query.trim())}${
          sessionToken ? `&session=${encodeURIComponent(sessionToken)}` : ''
        }`
      );
      return data.suggestions ?? [];
    } catch {
      return [];
    }
  },

  /**
   * Details for one place, and the call that closes an autocomplete session.
   *
   * Pass the same token the autocomplete used. Google bills the whole session as
   * one unit only when the details call closes it with that token; without it,
   * every keystroke that produced a suggestion is billed on its own.
   */
  async placeDetails(placeId: string, sessionToken?: string): Promise<ResolvedPlace | null> {
    if (!IS_API_ENABLED || !placeId) return null;
    try {
      const data = await api.get<PlaceDetailsResponse>(
        `/maps/places/${encodeURIComponent(placeId)}${
          sessionToken ? `?session=${encodeURIComponent(sessionToken)}` : ''
        }`
      );
      return data.place ?? null;
    } catch {
      return null;
    }
  },

  async geocode(address: string): Promise<ResolvedPlace | null> {
    if (!IS_API_ENABLED || !address.trim()) return null;
    try {
      const data = await api.get<GeocodeResponse>(
        `/maps/geocode?address=${encodeURIComponent(address.trim())}`
      );
      return data.place ?? null;
    } catch {
      return null;
    }
  },

  async route(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ): Promise<RouteEstimate | null> {
    if (!IS_API_ENABLED) return null;
    try {
      const data = await api.post<RouteResponse>('/maps/route', { origin, destination });
      return data.route ?? null;
    } catch {
      return null;
    }
  },
};
