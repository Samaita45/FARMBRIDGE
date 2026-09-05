import { Injectable, Logger } from '@nestjs/common';

import { GoogleMapsClient } from './google-maps.client';
import { MapsCache } from './maps.cache';

export interface PlaceSuggestion {
  placeId: string;
  primaryText: string;
  secondaryText: string;
}

export interface PlaceDetails {
  latitude: number;
  longitude: number;
  address: string;
  placeId: string;
  source: 'places';
}

interface AutocompleteResponse {
  suggestions?: Array<{
    placePrediction?: {
      placeId?: string;
      structuredFormat?: {
        mainText?: { text?: string };
        secondaryText?: { text?: string };
      };
      text?: { text?: string };
    };
  }>;
}

interface PlaceDetailsResponse {
  id?: string;
  formattedAddress?: string;
  displayName?: { text?: string };
  location?: { latitude?: number; longitude?: number };
}

const AUTOCOMPLETE_TTL_MS = 2 * 60 * 1000;
const DETAILS_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class PlacesService {
  private readonly logger = new Logger(PlacesService.name);

  constructor(
    private readonly client: GoogleMapsClient,
    private readonly cache: MapsCache,
  ) {}

  async autocomplete(query: string, sessionToken?: string): Promise<PlaceSuggestion[]> {
    const trimmed = query.trim();
    if (trimmed.length < 2 || !this.client.configured) return [];

    const cacheKey = `places:auto:${trimmed.toLowerCase()}`;
    const cached = this.cache.get<PlaceSuggestion[]>(cacheKey);
    if (cached) return cached;

    try {
      const body: Record<string, unknown> = {
        input: trimmed,
        languageCode: 'en',
        includedRegionCodes: ['zw'],
      };
      if (sessionToken) body.sessionToken = sessionToken;

      const data = await this.client.postJson<AutocompleteResponse>(
        'https://places.googleapis.com/v1/places:autocomplete',
        body,
        'suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat,suggestions.placePrediction.text',
      );

      const suggestions = (data.suggestions ?? [])
        .map((row) => {
          const prediction = row.placePrediction;
          if (!prediction?.placeId) return null;
          return {
            placeId: prediction.placeId,
            primaryText:
              prediction.structuredFormat?.mainText?.text ?? prediction.text?.text ?? '',
            secondaryText: prediction.structuredFormat?.secondaryText?.text ?? '',
          };
        })
        .filter((row): row is PlaceSuggestion => Boolean(row?.primaryText))
        .slice(0, 8);

      this.cache.set(cacheKey, suggestions, AUTOCOMPLETE_TTL_MS);
      return suggestions;
    } catch (error) {
      this.logger.warn(
        `Places autocomplete failed: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      return [];
    }
  }

  /**
   * Place Details, and the call that CLOSES an autocomplete session.
   *
   * WHY THE TOKEN MATTERS HERE. Google bills autocomplete per request unless the
   * requests share a session token AND that session is closed by a Place Details
   * call carrying the same token — then the whole session is billed as one unit.
   * This method used to ignore the token the client was already generating, so
   * the session never closed and every debounced keystroke billed on its own.
   * A single address entry was four to eight billed requests instead of one.
   *
   * The token is passed as a query parameter, which is where Places API (New)
   * expects it on the details endpoint.
   */
  async details(placeId: string, sessionToken?: string): Promise<PlaceDetails | null> {
    if (!placeId || !this.client.configured) return null;

    /*
      Cached details are keyed on the place alone, deliberately: the address of
      a place does not change per session, and a cache hit is a call we do not
      pay for. The cost of a hit is that this particular session goes unclosed —
      cheaper than fetching the same place again to tidy up the accounting.
    */
    const cacheKey = `places:details:${placeId}`;
    const cached = this.cache.get<PlaceDetails>(cacheKey);
    if (cached) return cached;

    const id = placeId.startsWith('places/') ? placeId.slice('places/'.length) : placeId;
    const query = sessionToken
      ? `?sessionToken=${encodeURIComponent(sessionToken)}`
      : '';
    const data = await this.client.getAuthedJson<PlaceDetailsResponse>(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(id)}${query}`,
      'id,formattedAddress,location,displayName',
    );

    const latitude = data.location?.latitude;
    const longitude = data.location?.longitude;
    if (latitude == null || longitude == null) return null;

    const place: PlaceDetails = {
      latitude,
      longitude,
      address: data.formattedAddress ?? data.displayName?.text ?? '',
      placeId: data.id ?? placeId,
      source: 'places',
    };
    this.cache.set(cacheKey, place, DETAILS_TTL_MS);
    return place;
  }
}
