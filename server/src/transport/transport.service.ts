import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  TransportBidStatus,
  TransportLifecycleStatus,
  type Prisma,
} from '@prisma/client';

import { AUDIT_ACTIONS, type AuditContext } from '@/audit/audit.service';
import { AuditService } from '@/audit/audit.service';
import type { AuthenticatedUser } from '@/auth/authenticated-user';
import { assertOwnership } from '@/common/guards/ownership';
import { MapsService } from '@/maps/maps.service';
import { haversineKm } from '@/maps/routes.service';
import { PrismaService } from '@/prisma/prisma.service';

import {
  CreateBidDto,
  CreateTransportRequestDto,
  DriverLocationDto,
  PricingQuoteDto,
  UpdateBidDto,
  UpdateBookingStatusDto,
} from './dto/transport.dto';
import { TransportPricingService } from './pricing/transport-pricing.service';
import { TRANSPORT_EVENTS } from './transport.events';
import { TransportGateway } from './transport.gateway';

const OPEN_REQUEST: TransportLifecycleStatus[] = [
  TransportLifecycleStatus.REQUESTED,
  TransportLifecycleStatus.BIDDING,
];

const ACTIVE_BOOKING: TransportLifecycleStatus[] = [
  TransportLifecycleStatus.ACCEPTED,
  TransportLifecycleStatus.DRIVER_ASSIGNED,
  TransportLifecycleStatus.GOODS_COLLECTED,
  TransportLifecycleStatus.IN_TRANSIT,
];

const TRANSPORTER_TRANSITIONS: Partial<
  Record<TransportLifecycleStatus, TransportLifecycleStatus>
> = {
  [TransportLifecycleStatus.DRIVER_ASSIGNED]: TransportLifecycleStatus.GOODS_COLLECTED,
  [TransportLifecycleStatus.GOODS_COLLECTED]: TransportLifecycleStatus.IN_TRANSIT,
  [TransportLifecycleStatus.IN_TRANSIT]: TransportLifecycleStatus.DELIVERED,
};

@Injectable()
export class TransportService {
  private readonly lastLocationAt = new Map<string, number>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly maps: MapsService,
    private readonly pricing: TransportPricingService,
    private readonly audit: AuditService,
    private readonly realtime: TransportGateway,
  ) {}

  async createRequest(
    user: AuthenticatedUser,
    dto: CreateTransportRequestDto,
    context: AuditContext,
  ) {
    const route = await this.maps.route(
      { latitude: dto.pickupLat, longitude: dto.pickupLng },
      { latitude: dto.destinationLat, longitude: dto.destinationLng },
    );
    const quote = await this.pricing.quote(user, {
      distanceKm: route.distanceKm,
      vehicleType: dto.vehicleType,
      weightKg: dto.weightKg,
      goodsType: dto.goodsType,
      urgency: dto.urgency,
      extras: dto.extras,
    });

    const db = this.prisma.forTenant(user.tenantId);
    const request = await db.transportRequest.create({
      data: {
        tenantId: user.tenantId,
        customerId: user.id,
        pickupAddress: dto.pickupAddress.trim(),
        pickupLat: dto.pickupLat,
        pickupLng: dto.pickupLng,
        destinationAddress: dto.destinationAddress.trim(),
        destinationLat: dto.destinationLat,
        destinationLng: dto.destinationLng,
        distanceMeters: route.distanceKm * 1000,
        durationSeconds: route.durationSeconds,
        routePolyline: route.polyline,
        goodsDescription: dto.goodsDescription.trim(),
        goodsType: dto.goodsType,
        weightKg: dto.weightKg,
        vehicleType: dto.vehicleType,
        urgency: dto.urgency,
        extras: dto.extras ?? [],
        estimatedPriceUsdCents: quote.estimatedPriceUsdCents,
        pricingBreakdown: quote.breakdown as unknown as Prisma.InputJsonValue,
        status: TransportLifecycleStatus.REQUESTED,
        preferredAt: dto.preferredAt ? new Date(dto.preferredAt) : null,
      },
    });

    await this.audit.record({
      action: AUDIT_ACTIONS.TRANSPORT_REQUEST_CREATED,
      actor: user,
      tenantId: user.tenantId,
      resourceType: 'TransportRequest',
      resourceId: request.id,
      context,
      metadata: { distanceKm: route.distanceKm, estimatedPriceUsdCents: quote.estimatedPriceUsdCents },
    });

    this.realtime.emitToTransporters(user.tenantId, TRANSPORT_EVENTS.REQUEST_CREATED, {
      request: this.publicRequest(request),
    });

    return { request: this.publicRequest(request) };
  }

  async listMine(user: AuthenticatedUser) {
    const db = this.prisma.forTenant(user.tenantId);
    const requests = await db.transportRequest.findMany({
      where: { customerId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return { requests: requests.map((row) => this.publicRequest(row)) };
  }

  async nearby(user: AuthenticatedUser, lat: number, lng: number, radiusKm = 50) {
    const db = this.prisma.forTenant(user.tenantId);
    const open = await db.transportRequest.findMany({
      where: { status: { in: OPEN_REQUEST } },
      orderBy: { createdAt: 'desc' },
      take: 80,
    });

    const requests = open
      .map((row) => ({
        ...this.publicRequest(row),
        distanceFromYouKm: Math.round(
          haversineKm({ latitude: lat, longitude: lng }, { latitude: row.pickupLat, longitude: row.pickupLng }),
        ),
      }))
      .filter((row) => row.distanceFromYouKm <= radiusKm)
      .sort((a, b) => a.distanceFromYouKm - b.distanceFromYouKm);

    return { requests };
  }

  async getRequest(user: AuthenticatedUser, id: string) {
    const db = this.prisma.forTenant(user.tenantId);
    const request = await db.transportRequest.findFirst({
      where: { id },
      /*
        The transporter's name comes with the bid. A customer is being asked to
        choose between offers, and a list of UUIDs is not a choice — but only
        the name and the account age go out. A bid is not a licence to read
        somebody's profile.
      */
      include: {
        bids: {
          include: {
            transporter: { select: { id: true, name: true, createdAt: true } },
          },
        },
      },
    });
    if (!request) throw new NotFoundException('Not found.');

    const isCustomer = request.customerId === user.id;
    const isBidder = request.bids.some((bid) => bid.transporterId === user.id);
    if (!isCustomer && !isBidder && !OPEN_REQUEST.includes(request.status)) {
      throw new NotFoundException('Not found.');
    }

    // A customer sees every offer; anyone else sees only their own.
    const visible = isCustomer
      ? request.bids
      : request.bids.filter((bid) => bid.transporterId === user.id);

    return {
      request: this.publicRequest(request),
      bids: visible.map((bid) => ({
        id: bid.id,
        requestId: bid.requestId,
        transporterId: bid.transporterId,
        transporterName: bid.transporter?.name ?? 'Transporter',
        transporterSince: bid.transporter?.createdAt ?? null,
        amountUsdCents: bid.amountUsdCents,
        note: bid.note,
        etaMinutes: bid.etaMinutes,
        status: bid.status,
        createdAt: bid.createdAt,
      })),
    };
  }

  async createBid(
    user: AuthenticatedUser,
    requestId: string,
    dto: CreateBidDto,
    context: AuditContext,
  ) {
    const db = this.prisma.forTenant(user.tenantId);
    const request = await db.transportRequest.findFirst({ where: { id: requestId } });
    if (!request || !OPEN_REQUEST.includes(request.status)) {
      throw new BadRequestException('This request is not open for bids.');
    }
    if (request.customerId === user.id) {
      throw new BadRequestException('You cannot bid on your own request.');
    }

    const bid = await db.transportBid.upsert({
      where: { requestId_transporterId: { requestId, transporterId: user.id } },
      create: {
        tenantId: user.tenantId,
        requestId,
        transporterId: user.id,
        amountUsdCents: dto.amountUsdCents,
        note: dto.note,
        etaMinutes: dto.etaMinutes,
      },
      update: {
        amountUsdCents: dto.amountUsdCents,
        note: dto.note,
        etaMinutes: dto.etaMinutes,
        status: TransportBidStatus.OPEN,
      },
    });

    if (request.status === TransportLifecycleStatus.REQUESTED) {
      await db.transportRequest.update({
        where: { id: requestId },
        data: { status: TransportLifecycleStatus.BIDDING },
      });
    }

    await this.audit.record({
      action: AUDIT_ACTIONS.TRANSPORT_BID_CREATED,
      actor: user,
      tenantId: user.tenantId,
      resourceType: 'TransportBid',
      resourceId: bid.id,
      context,
      metadata: { requestId, amountUsdCents: dto.amountUsdCents },
    });

    this.realtime.emitToUser(request.customerId, TRANSPORT_EVENTS.BID_CREATED, { bid });
    return { bid };
  }

  async updateBid(
    user: AuthenticatedUser,
    bidId: string,
    dto: UpdateBidDto,
    context: AuditContext,
  ) {
    const db = this.prisma.forTenant(user.tenantId);
    const bid = await db.transportBid.findFirst({ where: { id: bidId } });
    assertOwnership(user, bid ? { ownerId: bid.transporterId } : null);
    if (bid!.status !== TransportBidStatus.OPEN) {
      throw new BadRequestException('This bid can no longer be changed.');
    }

    const updated = await db.transportBid.update({
      where: { id: bidId },
      data: {
        amountUsdCents: dto.amountUsdCents,
        note: dto.note,
        status: dto.status === 'WITHDRAWN' ? TransportBidStatus.WITHDRAWN : undefined,
      },
    });

    const request = await db.transportRequest.findFirst({ where: { id: updated.requestId } });
    await this.audit.record({
      action: AUDIT_ACTIONS.TRANSPORT_BID_UPDATED,
      actor: user,
      tenantId: user.tenantId,
      resourceType: 'TransportBid',
      resourceId: updated.id,
      context,
    });

    if (request) {
      this.realtime.emitToUser(request.customerId, TRANSPORT_EVENTS.BID_UPDATED, { bid: updated });
    }
    return { bid: updated };
  }

  async acceptBid(user: AuthenticatedUser, bidId: string, context: AuditContext) {
    const db = this.prisma.forTenant(user.tenantId);
    const bid = await db.transportBid.findFirst({ where: { id: bidId } });
    if (!bid || bid.status !== TransportBidStatus.OPEN) {
      throw new BadRequestException('This bid is not available.');
    }

    const request = await db.transportRequest.findFirst({ where: { id: bid.requestId } });
    assertOwnership(user, request ? { ownerId: request.customerId } : null);
    if (!request || !OPEN_REQUEST.includes(request.status)) {
      throw new BadRequestException('This request is no longer open.');
    }

    const booking = await this.prisma.$transaction(async (tx) => {
      await tx.transportBid.update({
        where: { id: bid.id },
        data: { status: TransportBidStatus.ACCEPTED },
      });
      await tx.transportBid.updateMany({
        where: {
          requestId: request.id,
          id: { not: bid.id },
          status: TransportBidStatus.OPEN,
        },
        data: { status: TransportBidStatus.REJECTED },
      });
      await tx.transportRequest.update({
        where: { id: request.id },
        data: { status: TransportLifecycleStatus.DRIVER_ASSIGNED },
      });
      return tx.transportBooking.create({
        data: {
          tenantId: user.tenantId,
          requestId: request.id,
          customerId: request.customerId,
          transporterId: bid.transporterId,
          acceptedBidId: bid.id,
          pickupAddress: request.pickupAddress,
          pickupLat: request.pickupLat,
          pickupLng: request.pickupLng,
          destinationAddress: request.destinationAddress,
          destinationLat: request.destinationLat,
          destinationLng: request.destinationLng,
          distanceMeters: request.distanceMeters,
          durationSeconds: request.durationSeconds,
          routePolyline: request.routePolyline,
          agreedPriceUsdCents: bid.amountUsdCents,
          status: TransportLifecycleStatus.DRIVER_ASSIGNED,
        },
      });
    });

    await this.audit.record({
      action: AUDIT_ACTIONS.TRANSPORT_ACCEPTED,
      actor: user,
      tenantId: user.tenantId,
      resourceType: 'TransportBooking',
      resourceId: booking.id,
      context,
      metadata: { bidId, transporterId: bid.transporterId },
    });

    const payload = { booking: this.publicBooking(booking) };
    this.realtime.emitToUser(request.customerId, TRANSPORT_EVENTS.BOOKING_ACCEPTED, payload);
    this.realtime.emitToUser(bid.transporterId, TRANSPORT_EVENTS.BOOKING_ACCEPTED, payload);
    this.realtime.emitToBooking(booking.id, TRANSPORT_EVENTS.BOOKING_ACCEPTED, payload);
    return payload;
  }

  async updateStatus(
    user: AuthenticatedUser,
    bookingId: string,
    dto: UpdateBookingStatusDto,
    context: AuditContext,
  ) {
    const db = this.prisma.forTenant(user.tenantId);
    const booking = await db.transportBooking.findFirst({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Not found.');

    if (dto.status === TransportLifecycleStatus.CANCELLED) {
      assertOwnership(user, { ownerId: booking.customerId });
      if (!ACTIVE_BOOKING.includes(booking.status) && booking.status !== TransportLifecycleStatus.ACCEPTED) {
        throw new BadRequestException('This booking cannot be cancelled.');
      }
      if (
        booking.status === TransportLifecycleStatus.GOODS_COLLECTED ||
        booking.status === TransportLifecycleStatus.IN_TRANSIT
      ) {
        throw new BadRequestException('Goods already collected cannot be cancelled here.');
      }
    } else {
      assertOwnership(user, { ownerId: booking.transporterId });
      if (TRANSPORTER_TRANSITIONS[booking.status] !== dto.status) {
        throw new BadRequestException('That status change is not allowed.');
      }
    }

    const updated = await db.transportBooking.update({
      where: { id: bookingId },
      data: {
        status: dto.status,
        goodsCollectedAt:
          dto.status === TransportLifecycleStatus.GOODS_COLLECTED ? new Date() : undefined,
        deliveredAt: dto.status === TransportLifecycleStatus.DELIVERED ? new Date() : undefined,
      },
    });
    await db.transportRequest.update({
      where: { id: booking.requestId },
      data: { status: dto.status },
    });

    await this.audit.record({
      action:
        dto.status === TransportLifecycleStatus.DELIVERED
          ? AUDIT_ACTIONS.TRANSPORT_COMPLETED
          : AUDIT_ACTIONS.TRANSPORT_STATUS_UPDATED,
      actor: user,
      tenantId: user.tenantId,
      resourceType: 'TransportBooking',
      resourceId: updated.id,
      context,
      metadata: { from: booking.status, to: dto.status },
    });

    const payload = { booking: this.publicBooking(updated) };
    this.realtime.emitToBooking(updated.id, TRANSPORT_EVENTS.STATUS_UPDATED, payload);
    this.realtime.emitToUser(updated.customerId, TRANSPORT_EVENTS.STATUS_UPDATED, payload);
    this.realtime.emitToUser(updated.transporterId, TRANSPORT_EVENTS.STATUS_UPDATED, payload);
    return payload;
  }

  async updateLocation(
    user: AuthenticatedUser,
    bookingId: string,
    dto: DriverLocationDto,
    context: AuditContext,
  ) {
    const throttleKey = `${user.id}:${bookingId}`;
    const last = this.lastLocationAt.get(throttleKey) ?? 0;
    if (Date.now() - last < 5_000) {
      throw new HttpException('Location updates are limited to once every 5 seconds.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const db = this.prisma.forTenant(user.tenantId);
    const booking = await db.transportBooking.findFirst({ where: { id: bookingId } });
    assertOwnership(user, booking ? { ownerId: booking.transporterId } : null);
    if (!booking || !ACTIVE_BOOKING.includes(booking.status)) {
      throw new BadRequestException('Location can only be updated on an active booking.');
    }

    this.lastLocationAt.set(throttleKey, Date.now());
    await db.transporterLocation.create({
      data: {
        tenantId: user.tenantId,
        transporterId: user.id,
        bookingId,
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
    });

    await this.audit.record({
      action: AUDIT_ACTIONS.TRANSPORT_LOCATION_UPDATED,
      actor: user,
      tenantId: user.tenantId,
      resourceType: 'TransportBooking',
      resourceId: bookingId,
      context,
      metadata: { latitude: dto.latitude, longitude: dto.longitude },
    });

    const payload = {
      bookingId,
      latitude: dto.latitude,
      longitude: dto.longitude,
      recordedAt: new Date().toISOString(),
    };
    this.realtime.emitToBooking(bookingId, TRANSPORT_EVENTS.DRIVER_LOCATION, payload);
    return { ok: true };
  }

  async activeBookings(user: AuthenticatedUser) {
    const db = this.prisma.forTenant(user.tenantId);
    const bookings = await db.transportBooking.findMany({
      where: {
        status: { in: ACTIVE_BOOKING },
        OR: [{ customerId: user.id }, { transporterId: user.id }],
      },
      orderBy: { createdAt: 'desc' },
    });
    return { bookings: bookings.map((row) => this.publicBooking(row)) };
  }

  async quote(user: AuthenticatedUser, dto: PricingQuoteDto) {
    return { quote: await this.pricing.quote(user, dto) };
  }

  private publicRequest(row: {
    id: string;
    status: TransportLifecycleStatus;
    pickupAddress: string;
    pickupLat: number;
    pickupLng: number;
    destinationAddress: string;
    destinationLat: number;
    destinationLng: number;
    distanceMeters: number;
    durationSeconds: number;
    routePolyline: string | null;
    estimatedPriceUsdCents: number;
    goodsDescription: string;
    goodsType: string;
    weightKg: number;
  }) {
    return {
      id: row.id,
      status: row.status,
      pickupAddress: row.pickupAddress,
      pickupLat: row.pickupLat,
      pickupLng: row.pickupLng,
      destinationAddress: row.destinationAddress,
      destinationLat: row.destinationLat,
      destinationLng: row.destinationLng,
      distanceMeters: row.distanceMeters,
      durationSeconds: row.durationSeconds,
      routePolyline: row.routePolyline,
      estimatedPriceUsdCents: row.estimatedPriceUsdCents,
      goodsDescription: row.goodsDescription,
      goodsType: row.goodsType,
      weightKg: row.weightKg,
    };
  }

  private publicBooking(row: {
    id: string;
    requestId: string;
    status: TransportLifecycleStatus;
    pickupAddress: string;
    pickupLat: number;
    pickupLng: number;
    destinationAddress: string;
    destinationLat: number;
    destinationLng: number;
    distanceMeters: number;
    durationSeconds: number;
    agreedPriceUsdCents: number;
  }) {
    return {
      id: row.id,
      requestId: row.requestId,
      status: row.status,
      pickupAddress: row.pickupAddress,
      pickupLat: row.pickupLat,
      pickupLng: row.pickupLng,
      destinationAddress: row.destinationAddress,
      destinationLat: row.destinationLat,
      destinationLng: row.destinationLng,
      distanceMeters: row.distanceMeters,
      durationSeconds: row.durationSeconds,
      agreedPriceUsdCents: row.agreedPriceUsdCents,
    };
  }
}
