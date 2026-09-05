import { Module } from '@nestjs/common';

import { GeocodingService } from './geocoding.service';
import { GoogleMapsClient } from './google-maps.client';
import { MapsCache } from './maps.cache';
import { MapsController } from './maps.controller';
import { MapsService } from './maps.service';
import { PlacesService } from './places.service';
import { RoutesService } from './routes.service';

@Module({
  controllers: [MapsController],
  providers: [
    MapsCache,
    GoogleMapsClient,
    PlacesService,
    GeocodingService,
    RoutesService,
    MapsService,
  ],
  exports: [MapsService, RoutesService],
})
export class MapsModule {}
