import { Injectable, Logger } from '@nestjs/common';

import { GoogleMapsClient } from './google-maps.client';
import { MapsCache } from './maps.cache';

export interface GeocodedPlace {
  latitude: number;
  longitude: number;
  address: string;
  placeId?: string;
  source: 'geocode';
}

interface GeocodeResponse {
  status?: string;
  results?: Array<{
    formatted_address?: string;
    place_id?: string;
    geometry?: { location?: { lat?: number; lng?: number } };
  }>;
}

const GEOCODE_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);

  constructor(
    private readonly client: GoogleMapsClient,
    private readonly cache: MapsCache,
  ) {}

  async geocode(address: string): Promise<GeocodedPlace | null> {
    const trimmed = address.trim();
    if (!trimmed) return null;

    const cacheKey = `geo:${trimmed.toLowerCase()}`;
    const cached = this.cache.get<GeocodedPlace>(cacheKey);
    if (cached) return cached;

    const key = this.client.requireKey();
    const url =
      'https://maps.googleapis.com/maps/api/geocode/json' +
      `?address=${encodeURIComponent(trimmed)}&region=zw&key=${encodeURIComponent(key)}`;

    const data = await this.client.getJson<GeocodeResponse>(url);
    const first = data.results?.[0];
    const lat = first?.geometry?.location?.lat;
    const lng = first?.geometry?.location?.lng;
    if (!first || lat == null || lng == null) {
      this.logger.debug(`Geocode returned no result for a ${trimmed.length}-char address`);
      return null;
    }

    const place: GeocodedPlace = {
      latitude: lat,
      longitude: lng,
      address: first.formatted_address ?? trimmed,
      placeId: first.place_id,
      source: 'geocode',
    };
    this.cache.set(cacheKey, place, GEOCODE_TTL_MS);
    return place;
  }
}
