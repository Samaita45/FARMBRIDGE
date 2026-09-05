import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { GeocodingService } from './geocoding.service';
import { GoogleMapsClient } from './google-maps.client';
import { PlacesService } from './places.service';
import { type LatLng, type RouteEstimate, RoutesService } from './routes.service';

/**
 * Facade for Places, Geocoding and Routes. Controllers talk to this, not to
 * Google, so swapping a provider later does not leak into HTTP.
 */
@Injectable()
export class MapsService implements OnModuleInit {
  private readonly logger = new Logger(MapsService.name);

  constructor(
    private readonly client: GoogleMapsClient,
    private readonly places: PlacesService,
    private readonly geocoding: GeocodingService,
    private readonly routes: RoutesService,
  ) {}

  onModuleInit(): void {
    if (!this.client.configured) {
      this.logger.warn(
        'GOOGLE_MAPS_SERVER_API_KEY is empty. Gazetteer fallbacks will be used; Places and Routes stay off.',
      );
    }
  }

  autocomplete(query: string, session?: string) {
    return this.places.autocomplete(query, session);
  }

  placeDetails(placeId: string, sessionToken?: string) {
    return this.places.details(placeId, sessionToken);
  }

  geocode(address: string) {
    return this.geocoding.geocode(address);
  }

  route(origin: LatLng, destination: LatLng): Promise<RouteEstimate> {
    return this.routes.compute(origin, destination);
  }
}
