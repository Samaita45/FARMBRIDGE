import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { TransportLifecycleStatus } from '@prisma/client';
import type { Server, Socket } from 'socket.io';

import type { AccessTokenPayload, AuthenticatedUser } from '@/auth/authenticated-user';
import { PrismaService } from '@/prisma/prisma.service';
import { PERMISSIONS, resolvePermissions, type RoleName } from '@/rbac/permissions';

import { bookingRoom, transportersRoom, userRoom } from './transport.events';

const ACTIVE: TransportLifecycleStatus[] = [
  TransportLifecycleStatus.ACCEPTED,
  TransportLifecycleStatus.DRIVER_ASSIGNED,
  TransportLifecycleStatus.GOODS_COLLECTED,
  TransportLifecycleStatus.IN_TRANSIT,
];

type AuthedSocket = Socket & { data: { user?: AuthenticatedUser } };

/**
 * Realtime transport events.
 *
 * Authentication happens on the handshake, not through the HTTP JWT guard —
 * that guard reads Express headers and must not run on the socket upgrade.
 * Rooms are joined only after an ownership check.
 */
@WebSocketGateway({ namespace: '/realtime', cors: { origin: false } })
export class TransportGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(TransportGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: AuthedSocket): Promise<void> {
    try {
      const user = await this.authenticate(client);
      client.data.user = user;
      void client.join(userRoom(user.id));
      if (user.permissions.has(PERMISSIONS.TRANSPORT_BID)) {
        void client.join(transportersRoom(user.tenantId));
      }
    } catch {
      this.logger.warn('Rejected unauthenticated socket');
      client.disconnect(true);
    }
  }

  handleDisconnect(_client: AuthedSocket): void {
    // Rooms are dropped with the socket.
  }

  @SubscribeMessage('transport:booking:subscribe')
  async subscribeBooking(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { bookingId?: string },
  ) {
    const user = client.data.user;
    const bookingId = body?.bookingId;
    if (!user || !bookingId) return { ok: false };

    const allowed = await this.canSeeBooking(user, bookingId);
    if (!allowed) return { ok: false };

    await client.join(bookingRoom(bookingId));
    return { ok: true };
  }

  emitToUser(userId: string, event: string, payload: unknown): void {
    this.server?.to(userRoom(userId)).emit(event, payload);
  }

  emitToTransporters(tenantId: string, event: string, payload: unknown): void {
    this.server?.to(transportersRoom(tenantId)).emit(event, payload);
  }

  emitToBooking(bookingId: string, event: string, payload: unknown): void {
    this.server?.to(bookingRoom(bookingId)).emit(event, payload);
  }

  private async authenticate(client: Socket): Promise<AuthenticatedUser> {
    const header = client.handshake.headers.authorization;
    const fromHeader =
      typeof header === 'string' && header.toLowerCase().startsWith('bearer ')
        ? header.slice(7).trim()
        : null;
    const token =
      (typeof client.handshake.auth?.token === 'string' ? client.handshake.auth.token : null) ??
      fromHeader;
    if (!token) throw new Error('missing token');

    const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        tenantId: true,
        email: true,
        roles: true,
        extraPermissions: true,
        deniedPermissions: true,
        isActive: true,
        deletedAt: true,
        lockedUntil: true,
        tokensValidFrom: true,
      },
    });

    if (!user || !user.isActive || user.deletedAt) throw new Error('inactive');
    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) throw new Error('locked');
    if (payload.tid !== user.tenantId) throw new Error('tenant mismatch');
    if (payload.iat * 1000 < user.tokensValidFrom.getTime()) throw new Error('revoked');

    return {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      roles: user.roles as RoleName[],
      permissions: resolvePermissions(
        user.roles as RoleName[],
        user.extraPermissions,
        user.deniedPermissions,
      ),
    };
  }

  private async canSeeBooking(user: AuthenticatedUser, bookingId: string): Promise<boolean> {
    const db = this.prisma.forTenant(user.tenantId);
    const booking = await db.transportBooking.findFirst({
      where: { id: bookingId, status: { in: ACTIVE } },
      select: { customerId: true, transporterId: true },
    });
    if (!booking) return false;
    return booking.customerId === user.id || booking.transporterId === user.id;
  }
}
