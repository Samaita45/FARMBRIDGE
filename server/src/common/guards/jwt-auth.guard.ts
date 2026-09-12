import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

import type { AccessTokenPayload, AuthenticatedUser } from '@/auth/authenticated-user';
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';
import { PrismaService } from '@/prisma/prisma.service';
import { resolvePermissions, type RoleName } from '@/rbac/permissions';

/**
 * Authentication, applied globally.
 *
 * Registered as an APP_GUARD so every route is private unless it opts out with
 * `@Public()`. Forgetting the decorator therefore locks an endpoint down rather
 * than exposing it — the failure mode we want.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // Socket.IO authenticates in the gateway handshake. This guard reads
    // Express headers and must not run on the upgrade or on @SubscribeMessage.
    if (context.getType() !== 'http') return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException('Authentication required.');

    let payload: AccessTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<AccessTokenPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Your session has expired.');
    }

    // The token is signed, but the account behind it may have been suspended,
    // deleted, or had its roles changed since. Roles and denials are read from
    // the database rather than trusted from the token, so a revocation takes
    // effect immediately instead of at the next refresh.
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

    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException('This account is no longer active.');
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      throw new UnauthorizedException('This account is temporarily locked.');
    }

    if (payload.iat * 1000 < user.tokensValidFrom.getTime()) {
      throw new UnauthorizedException('Please sign in again.');
    }

    // The token's tenant must match the account's. A mismatch means a token was
    // replayed against the wrong tenant, which is worth refusing loudly.
    if (payload.tid !== user.tenantId) {
      this.logger.warn(`Token tenant ${payload.tid} does not match user ${user.id}`);
      throw new UnauthorizedException('Authentication failed.');
    }

    const authenticated: AuthenticatedUser = {
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

    (request as Request & { user?: AuthenticatedUser }).user = authenticated;
    return true;
  }

  private extractToken(request: Request): string | null {
    const header = request.headers.authorization;
    if (!header) return null;
    const [scheme, value] = header.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !value) return null;
    return value.trim();
  }
}
