import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { RequireAnyPermission } from '@/common/decorators/permissions.decorator';
import { PERMISSIONS } from '@/rbac/permissions';

import {
  AutocompleteQueryDto,
  ComputeRouteDto,
  GeocodeQueryDto,
  PlaceDetailsQueryDto,
} from './dto/maps.dto';
import { MapsService } from './maps.service';

@Controller({ path: 'maps', version: '1' })
@RequireAnyPermission(PERMISSIONS.TRANSPORT_REQUEST, PERMISSIONS.TRANSPORT_BID)
export class MapsController {
  constructor(private readonly maps: MapsService) {}

  @Get('autocomplete')
  @Throttle({ default: { limit: 40, ttl: 60_000 } })
  async autocomplete(@Query() query: AutocompleteQueryDto) {
    return { suggestions: await this.maps.autocomplete(query.q, query.session) };
  }

  @Get('places/:placeId')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async placeDetails(
    @Param('placeId') placeId: string,
    @Query() query: PlaceDetailsQueryDto,
  ) {
    // Carrying the session token through is what closes the autocomplete
    // session and collapses its keystrokes into a single billed unit.
    return { place: await this.maps.placeDetails(placeId, query.session) };
  }

  @Get('geocode')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async geocode(@Query() query: GeocodeQueryDto) {
    return { place: await this.maps.geocode(query.address) };
  }

  @Post('route')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async route(@Body() body: ComputeRouteDto) {
    return { route: await this.maps.route(body.origin, body.destination) };
  }
}
