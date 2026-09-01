import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';

import { AUDIT_ACTIONS, AuditService, type AuditContext } from '@/audit/audit.service';
import { PrismaService } from '@/prisma/prisma.service';
import type { RoleName } from '@/rbac/permissions';

import type { IssuedTokens } from './token.service';
import { TokenService } from './token.service';
import type { LoginDto, RegisterDto } from './dto/auth.dto';

/**
 * Argon2id parameters.
 *
 * Argon2id is the current recommendation for password storage: memory-hard, so
 * GPU and ASIC attacks lose most of their advantage. 64 MiB with 3 passes is
 * the OWASP baseline and takes roughly 50-100ms on a modest server — slow
 * enough to matter to an attacker, fast enough not to be a login bottleneck.
 */
const ARGON_OPTIONS: argon2.HashOptions = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
};

const MAX_FAILED_LOGINS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

/**
 * A precomputed hash of a random value, used to equalise timing when no
 * account matches. Without it, a missing email returns measurably faster than
 * a wrong password, which enumerates registered users.
 */
let decoyHash: string | null = null;

export interface AuthResult extends IssuedTokens {
  user: {
    id: string;
    email: string;
    name: string;
    phone: string;
    roles: RoleName[];
    tenantId: string;
    province: string | null;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
  ) {}

  private async getDecoyHash(): Promise<string> {
    decoyHash ??= await argon2.hash('decoy-value-not-a-real-password', ARGON_OPTIONS);
    return decoyHash;
  }

  async register(dto: RegisterDto, context: AuditContext): Promise<AuthResult> {
    const email = dto.email.trim().toLowerCase();
    const phone = normalizePhone(dto.phone);

    const existing = await this.prisma.user.findFirst({
      where: { tenantId: dto.tenantId, OR: [{ email }, { phone }] },
      select: { id: true },
    });

    if (existing) {
      await this.audit.record({
        action: AUDIT_ACTIONS.REGISTERED,
        tenantId: dto.tenantId,
        result: 'FAILURE',
        metadata: { email, reason: 'already-exists' },
        context,
      });
      // Generic on purpose: naming which field collided confirms whether an
      // email or a phone number is already registered.
      throw new ConflictException('An account with those details already exists.');
    }

    const user = await this.prisma.user.create({
      data: {
        tenantId: dto.tenantId,
        email,
        phone,
        name: dto.name.trim(),
        passwordHash: await argon2.hash(dto.password, ARGON_OPTIONS),
        roles: [dto.role ?? 'FARMER'],
        province: dto.province ?? null,
      },
    });

    await this.audit.record({
      action: AUDIT_ACTIONS.REGISTERED,
      actor: {
        id: user.id,
        email: user.email,
        roles: user.roles as RoleName[],
        tenantId: user.tenantId,
      },
      resourceType: 'User',
      resourceId: user.id,
      context,
    });

    const issued = await this.tokens.issue(
      { id: user.id, tenantId: user.tenantId, email: user.email, roles: user.roles as RoleName[] },
      null,
      { ip: context.ipAddress ?? undefined, userAgent: context.userAgent ?? undefined },
    );

    return { ...issued, user: toPublicUser(user) };
  }

  async login(dto: LoginDto, context: AuditContext): Promise<AuthResult> {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findFirst({
      where: { tenantId: dto.tenantId, email },
    });

    // Verify against a decoy when no user matched, so both paths cost the same.
    if (!user) {
      await argon2.verify(await this.getDecoyHash(), dto.password).catch(() => false);
      await this.audit.record({
        action: AUDIT_ACTIONS.FAILED_LOGIN,
        tenantId: dto.tenantId,
        result: 'FAILURE',
        metadata: { email, reason: 'no-such-user' },
        context,
      });
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      await this.audit.record({
        action: AUDIT_ACTIONS.FAILED_LOGIN,
        tenantId: user.tenantId,
        actor: {
          id: user.id,
          email: user.email,
          roles: user.roles as RoleName[],
          tenantId: user.tenantId,
        },
        result: 'DENIED',
        metadata: { reason: 'locked' },
        context,
      });
      throw new UnauthorizedException(
        'Too many failed attempts. Try again in a few minutes.',
      );
    }

    const valid = await argon2.verify(user.passwordHash, dto.password).catch(() => false);

    if (!valid) {
      const failedCount = user.failedLoginCount + 1;
      const shouldLock = failedCount >= MAX_FAILED_LOGINS;

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: shouldLock ? 0 : failedCount,
          lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_MS) : null,
        },
      });

      await this.audit.record({
        action: shouldLock ? AUDIT_ACTIONS.ACCOUNT_LOCKED : AUDIT_ACTIONS.FAILED_LOGIN,
        tenantId: user.tenantId,
        actor: {
          id: user.id,
          email: user.email,
          roles: user.roles as RoleName[],
          tenantId: user.tenantId,
        },
        result: 'FAILURE',
        metadata: { attempts: failedCount },
        context,
      });

      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!user.isActive || user.deletedAt) {
      throw new UnauthorizedException('This account is no longer active.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    await this.audit.record({
      action: AUDIT_ACTIONS.LOGIN,
      actor: {
        id: user.id,
        email: user.email,
        roles: user.roles as RoleName[],
        tenantId: user.tenantId,
      },
      context,
    });

    const issued = await this.tokens.issue(
      { id: user.id, tenantId: user.tenantId, email: user.email, roles: user.roles as RoleName[] },
      null,
      { ip: context.ipAddress ?? undefined, userAgent: context.userAgent ?? undefined },
    );

    return { ...issued, user: toPublicUser(user) };
  }

  async refresh(refreshToken: string, context: AuditContext): Promise<IssuedTokens> {
    const issued = await this.tokens.rotate(refreshToken, {
      ip: context.ipAddress ?? undefined,
      userAgent: context.userAgent ?? undefined,
    });
    await this.audit.record({ action: AUDIT_ACTIONS.TOKEN_REFRESHED, context });
    return issued;
  }

  async logout(
    refreshToken: string | undefined,
    actor: { id: string; email: string; roles: RoleName[]; tenantId: string } | null,
    context: AuditContext,
  ): Promise<void> {
    if (refreshToken) await this.tokens.revokeToken(refreshToken);
    await this.audit.record({ action: AUDIT_ACTIONS.LOGOUT, actor, context });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    context: AuditContext,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Authentication failed.');

    const valid = await argon2.verify(user.passwordHash, currentPassword).catch(() => false);
    if (!valid) {
      await this.audit.record({
        action: AUDIT_ACTIONS.PASSWORD_CHANGED,
        actor: {
          id: user.id,
          email: user.email,
          roles: user.roles as RoleName[],
          tenantId: user.tenantId,
        },
        result: 'FAILURE',
        context,
      });
      throw new UnauthorizedException('Your current password is not correct.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await argon2.hash(newPassword, ARGON_OPTIONS) },
    });

    // Every existing session dies with the old password. A password change is
    // usually a response to suspected compromise, so leaving other devices
    // signed in would defeat the point.
    await this.tokens.revokeAllForUser(userId);

    await this.audit.record({
      action: AUDIT_ACTIONS.PASSWORD_CHANGED,
      actor: {
        id: user.id,
        email: user.email,
        roles: user.roles as RoleName[],
        tenantId: user.tenantId,
      },
      context,
    });
  }
}

function toPublicUser(user: {
  id: string;
  email: string;
  name: string;
  phone: string;
  roles: string[];
  tenantId: string;
  province: string | null;
}): AuthResult['user'] {
  // passwordHash is never in this shape, so it cannot leak into a response by
  // someone spreading the record.
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    roles: user.roles as RoleName[],
    tenantId: user.tenantId,
    province: user.province,
  };
}

/** Zimbabwe numbers, normalised to E.164 so lookups are consistent. */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('263')) return `+${digits}`;
  if (digits.startsWith('0')) return `+263${digits.slice(1)}`;
  if (digits.length === 9) return `+263${digits}`;
  return `+${digits}`;
}
