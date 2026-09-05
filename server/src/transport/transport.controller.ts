import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';

import { AuditService } from '@/audit/audit.service';
import type { AuthenticatedUser } from '@/auth/authenticated-user';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { RequireAnyPermission, RequirePermissions } from '@/common/decorators/permissions.decorator';
import { PERMISSIONS } from '@/rbac/permissions';

import {
  CreateBidDto,
  CreateTransportRequestDto,
  DriverLocationDto,
  NearbyQueryDto,
  PricingQuoteDto,
  UpdateBidDto,
  UpdateBookingStatusDto,
} from './dto/transport.dto';
import { TransportService } from './transport.service';

@Controller({ path: 'transport', version: '1' })
export class TransportController {
  constructor(private readonly transport: TransportService) {}

  @Post('pricing/quote')
  @RequireAnyPermission(PERMISSIONS.TRANSPORT_REQUEST, PERMISSIONS.TRANSPORT_BID)
  quote(@CurrentUser() user: AuthenticatedUser, @Body() dto: PricingQuoteDto) {
    return this.transport.quote(user, dto);
  }

  @Post('requests')
  @RequirePermissions(PERMISSIONS.TRANSPORT_REQUEST)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  createRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTransportRequestDto,
    @Req() request: Request,
  ) {
    return this.transport.createRequest(user, dto, AuditService.contextFrom(request));
  }

  @Get('requests')
  @RequirePermissions(PERMISSIONS.TRANSPORT_REQUEST)
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.transport.listMine(user);
  }

  @Get('requests/nearby')
  @RequirePermissions(PERMISSIONS.TRANSPORT_BID)
  nearby(@CurrentUser() user: AuthenticatedUser, @Query() query: NearbyQueryDto) {
    return this.transport.nearby(user, query.lat, query.lng, query.radiusKm);
  }

  @Get('requests/:id')
  @RequireAnyPermission(PERMISSIONS.TRANSPORT_REQUEST, PERMISSIONS.TRANSPORT_BID)
  getRequest(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.transport.getRequest(user, id);
  }

  @Post('requests/:id/bids')
  @RequirePermissions(PERMISSIONS.TRANSPORT_BID)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  createBid(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateBidDto,
    @Req() request: Request,
  ) {
    return this.transport.createBid(user, id, dto, AuditService.contextFrom(request));
  }

  @Patch('bids/:id')
  @RequirePermissions(PERMISSIONS.TRANSPORT_BID)
  updateBid(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateBidDto,
    @Req() request: Request,
  ) {
    return this.transport.updateBid(user, id, dto, AuditService.contextFrom(request));
  }

  @Post('bids/:id/accept')
  @RequirePermissions(PERMISSIONS.TRANSPORT_ACCEPT)
  acceptBid(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() request: Request,
  ) {
    return this.transport.acceptBid(user, id, AuditService.contextFrom(request));
  }

  @Get('bookings/active')
  @RequireAnyPermission(PERMISSIONS.TRANSPORT_REQUEST, PERMISSIONS.TRANSPORT_BID)
  active(@CurrentUser() user: AuthenticatedUser) {
    return this.transport.activeBookings(user);
  }

  @Patch('bookings/:id/status')
  @RequireAnyPermission(
    PERMISSIONS.TRANSPORT_COMPLETE,
    PERMISSIONS.TRANSPORT_ACCEPT,
    PERMISSIONS.TRANSPORT_REQUEST,
  )
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
    @Req() request: Request,
  ) {
    return this.transport.updateStatus(user, id, dto, AuditService.contextFrom(request));
  }

  @Post('bookings/:id/location')
  @RequirePermissions(PERMISSIONS.TRANSPORT_LOCATE)
  @Throttle({ default: { limit: 12, ttl: 60_000 } })
  updateLocation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: DriverLocationDto,
    @Req() request: Request,
  ) {
    return this.transport.updateLocation(user, id, dto, AuditService.contextFrom(request));
  }
}
