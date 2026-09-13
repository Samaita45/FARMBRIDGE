import { createHash, randomBytes } from 'node:crypto';

import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { PrismaService } from '@/prisma/prisma.service';
import { isTokenRevoked } from './token-validity';
import type { RoleName } from '@/rbac/permissions';

import type {
  AccessTokenClaims,
  RefreshTokenClaims,
  RefreshTokenPayload,
} from './authenticated-user';

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface TokenContext {
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Refresh tokens are stored as a SHA-256 digest, never in the clear, so a
   * database dump does not hand an attacker a set of working sessions. The
   * digest is unkeyed on purpose: the token is 384 bits of entropy, so there
   * is no dictionary to attack and no benefit to a slow hash here.
   */
  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async issue(
    user: { id: string; tenantId: string; email: string; roles: RoleName[] },
    familyId: string | null,
    context: TokenContext = {},
  ): Promise<IssuedTokens> {
    const family = familyId ?? randomBytes(16).toString('hex');
    const jti = randomBytes(24).toString('hex');

    const accessPayload: AccessTokenClaims = {
      sub: user.id,
      tid: user.tenantId,
      email: user.email,
      roles: user.roles,
    };

    // Seconds, not a duration string: `expiresIn` is typed as
    // `number | StringValue`, and StringValue is a template-literal type that a
    // value read from the environment cannot satisfy.
    const accessTtlMs = this.ttlToMs(this.config.get<string>('JWT_ACCESS_TTL', '15m'));
    const refreshTtlMs = this.ttlToMs(this.config.get<string>('JWT_REFRESH_TTL', '30d'));

    const accessToken = await this.jwt.signAsync(accessPayload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: Math.floor(accessTtlMs / 1000),
    });

    const refreshPayload: RefreshTokenClaims = {
      sub: user.id,
      tid: user.tenantId,
      fam: family,
      jti,
    };

    const refreshToken = await this.jwt.signAsync(refreshPayload, {
      // A separate secret, so a leaked access secret cannot mint refresh tokens.
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: Math.floor(refreshTtlMs / 1000),
    });

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hash(refreshToken),
        familyId: family,
        expiresAt: new Date(Date.now() + refreshTtlMs),
        createdByIp: context.ip ?? null,
        userAgent: context.userAgent ?? null,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: Math.floor(accessTtlMs / 1000),
    };
  }

  /**
   * Rotates a refresh token, detecting reuse.
   *
   * Each refresh burns the presented token and issues a new one in the same
   * family. If a token that has already been rotated is presented again, the
   * only explanations are theft or a cloned device — so the entire family is
   * revoked and every session in that chain dies. That is the standard
   * response, and it is deliberately aggressive: a legitimate user
   * re-authenticating is a smaller harm than an attacker keeping a session.
   */
  async rotate(refreshToken: string, context: TokenContext = {}): Promise<IssuedTokens> {
    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<RefreshTokenPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Your session has expired. Please sign in again.');
    }

    const tokenHash = this.hash(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored) {
      // A validly signed token we have never stored means the row was pruned
      // or the token was minted elsewhere. Treat it as hostile.
      await this.revokeFamily(payload.fam, 'unknown-token');
      throw new UnauthorizedException('Your session has expired. Please sign in again.');
    }

    if (stored.revokedAt) {
      await this.revokeFamily(stored.familyId, 'reuse-detected');
      this.logger.warn(
        `Refresh token reuse detected for user ${stored.userId}; family ${stored.familyId} revoked`,
      );
      throw new UnauthorizedException('Your session has expired. Please sign in again.');
    }

    if (stored.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Your session has expired. Please sign in again.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user || !user.isActive || user.deletedAt) {
      await this.revokeFamily(stored.familyId, 'user-inactive');
      throw new UnauthorizedException('This account is no longer active.');
    }

    // Password changes, role changes and "sign out everywhere" bump
    // tokensValidFrom, which invalidates every token issued before it.
    if (isTokenRevoked(payload.iat, user.tokensValidFrom)) {
      await this.revokeFamily(stored.familyId, 'tokens-invalidated');
      throw new UnauthorizedException('Please sign in again.');
    }

    const issued = await this.issue(
      { id: user.id, tenantId: user.tenantId, email: user.email, roles: user.roles as RoleName[] },
      stored.familyId,
      context,
    );

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date(), replacedById: this.hash(issued.refreshToken) },
    });

    return issued;
  }

  async revokeFamily(familyId: string, _reason: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeToken(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.hash(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Ends every session for a user. Used on password change and by support. */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { tokensValidFrom: new Date() },
      }),
    ]);
  }

  /** Housekeeping: drop rows that can no longer authenticate anything. */
  async pruneExpired(): Promise<number> {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const result = await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: cutoff } },
    });
    return result.count;
  }

  private ttlToMs(ttl: string): number {
    const match = /^(\d+)([smhd])$/.exec(ttl.trim());
    if (!match) return 15 * 60 * 1000;
    const value = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return value * (multipliers[unit ?? 'm'] ?? 60 * 1000);
  }
}
