import { Injectable, Logger } from '@nestjs/common';

import { GoogleMapsClient } from './google-maps.client';
import { MapsCache } from './maps.cache';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface RouteEstimate {
  distanceKm: number;
  durationSeconds: number;
  polyline?: string;
  source: 'routes' | 'gazetteer';
}

interface ComputeRoutesResponse {
  routes?: Array<{
    distanceMeters?: number;
    duration?: string;
    polyline?: { encodedPolyline?: string };
  }>;
}

const ROUTE_TTL_MS = 6 * 60 * 60 * 1000;
const ROAD_FACTOR = 1.25;
const FALLBACK_KMH = 50;

@Injectable()
export class RoutesService {
  private readonly logger = new Logger(RoutesService.name);

  constructor(
    private readonly client: GoogleMapsClient,
    private readonly cache: MapsCache,
  ) {}

  async compute(origin: LatLng, destination: LatLng): Promise<RouteEstimate> {
    const cacheKey = `route:${round(origin)}:${round(destination)}`;
    const cached = this.cache.get<RouteEstimate>(cacheKey);
    if (cached) return cached;

    /*
      A ROUTE MUST NEVER BE THE REASON A LOAD CANNOT BE POSTED.

      This used to call Google inside the `configured` check with nothing around
      it. `postJson` throws on any non-OK response, so the fallback below was
      unreachable whenever the API actually failed — it only ran when there was
      no key at all. The gap that matters: a key set before billing is enabled
      returns 403, which is a completely ordinary state for a project being set
      up, and it would have taken down every transport request on the platform
      rather than costing a slightly less accurate distance.

      A wrong-by-25% distance is a worse estimate. A thrown exception is a
      farmer who cannot ask for a truck.
    */
    if (this.client.configured) {
      try {
        const data = await this.client.postJson<ComputeRoutesResponse>(
          'https://routes.googleapis.com/directions/v2:computeRoutes',
          {
            origin: { location: { latLng: origin } },
            destination: { location: { latLng: destination } },
            travelMode: 'DRIVE',
            routingPreference: 'TRAFFIC_UNAWARE',
            computeAlternativeRoutes: false,
            languageCode: 'en',
            regionCode: 'ZW',
            units: 'METRIC',
          },
          'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline',
        );

        const route = data.routes?.[0];
        if (route?.distanceMeters) {
          const estimate: RouteEstimate = {
            distanceKm: Math.max(1, Math.round(route.distanceMeters / 1000)),
            durationSeconds: parseDurationSeconds(route.duration) ??
              fallbackDuration(route.distanceMeters / 1000),
            polyline: route.polyline?.encodedPolyline,
            source: 'routes',
          };
          this.cache.set(cacheKey, estimate, ROUTE_TTL_MS);
          return estimate;
        }
      } catch (error) {
        // Logged, not swallowed silently: a permanently failing key should be
        // visible to whoever runs this, even though the request still succeeds.
        this.logger.warn(
          `Routes API unavailable, using the straight-line estimate: ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
      }
    }

    const estimate = this.fallback(origin, destination);
    this.cache.set(cacheKey, estimate, ROUTE_TTL_MS);
    return estimate;
  }

  fallback(origin: LatLng, destination: LatLng): RouteEstimate {
    const km = Math.max(5, Math.round(haversineKm(origin, destination) * ROAD_FACTOR));
    return {
      distanceKm: km,
      durationSeconds: fallbackDuration(km),
      source: 'gazetteer',
    };
  }
}

function fallbackDuration(distanceKm: number): number {
  return Math.round((distanceKm / FALLBACK_KMH) * 3600);
}

function parseDurationSeconds(value?: string): number | null {
  if (!value) return null;
  const match = /^(\d+(?:\.\d+)?)s$/.exec(value);
  if (!match?.[1]) return null;
  return Math.round(Number(match[1]));
}

function round(point: LatLng): string {
  return `${point.latitude.toFixed(4)},${point.longitude.toFixed(4)}`;
}

export function haversineKm(a: LatLng, b: LatLng): number {
  const earthKm = 6371;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * earthKm * Math.asin(Math.min(1, Math.sqrt(h)));
}

function rad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
