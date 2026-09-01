import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request } from 'express';

import type { AuthenticatedUser } from '@/auth/authenticated-user';
import { PrismaService } from '@/prisma/prisma.service';

/**
 * Canonical audit actions.
 *
 * A closed list, not free text: querying "every failed login last week" only
 * works if every caller spells it the same way.
 */
export const AUDIT_ACTIONS = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  FAILED_LOGIN: 'FAILED_LOGIN',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  REGISTERED: 'REGISTERED',
  TOKEN_REFRESHED: 'TOKEN_REFRESHED',
  TOKEN_REUSE_DETECTED: 'TOKEN_REUSE_DETECTED',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',

  PRODUCT_CREATED: 'PRODUCT_CREATED',
  PRODUCT_UPDATED: 'PRODUCT_UPDATED',
  PRODUCT_DELETED: 'PRODUCT_DELETED',

  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_UPDATED: 'ORDER_UPDATED',
  ORDER_CANCELLED: 'ORDER_CANCELLED',

  PAYMENT_CREATED: 'PAYMENT_CREATED',
  PAYMENT_SUCCEEDED: 'PAYMENT_SUCCEEDED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_REFUNDED: 'PAYMENT_REFUNDED',

  ROLE_CHANGED: 'ROLE_CHANGED',
  PERMISSION_CHANGED: 'PERMISSION_CHANGED',
  USER_SUSPENDED: 'USER_SUSPENDED',
  ACCOUNT_DELETED: 'ACCOUNT_DELETED',

  TRANSPORT_ACCEPTED: 'TRANSPORT_ACCEPTED',
  TRANSPORT_COMPLETED: 'TRANSPORT_COMPLETED',

  PERMISSION_DENIED: 'PERMISSION_DENIED',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export interface AuditContext {
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
}

export interface RecordAuditInput {
  action: AuditAction;
  actor?: Pick<AuthenticatedUser, 'id' | 'email' | 'roles' | 'tenantId'> | null;
  tenantId?: string | null;
  resourceType?: string;
  resourceId?: string;
  result?: 'SUCCESS' | 'FAILURE' | 'DENIED';
  metadata?: Record<string, unknown>;
  context?: AuditContext;
}

/** Keys whose values must never reach the audit table. */
const REDACTED_KEYS = new Set([
  'password',
  'newPassword',
  'currentPassword',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'integrationKey',
  'secret',
  'otp',
]);

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Appends an audit entry.
   *
   * Deliberately never throws. An audit write failing must not roll back the
   * business action that succeeded, or a full disk becomes an outage. Failures
   * are logged loudly instead — that is the signal to investigate.
   */
  async record(input: RecordAuditInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId: input.tenantId ?? input.actor?.tenantId ?? null,
          actorId: input.actor?.id ?? null,
          actorEmail: input.actor?.email ?? null,
          actorRoles: input.actor?.roles ?? [],
          action: input.action,
          resourceType: input.resourceType ?? null,
          resourceId: input.resourceId ?? null,
          result: input.result ?? 'SUCCESS',
          ipAddress: input.context?.ipAddress ?? null,
          userAgent: input.context?.userAgent ?? null,
          requestId: input.context?.requestId ?? null,
          metadata: input.metadata
            ? (this.redact(input.metadata) as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to write audit entry ${input.action}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }

  /** Strips credential material before anything is persisted. */
  private redact(value: Record<string, unknown>): Record<string, unknown> {
    const output: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      if (REDACTED_KEYS.has(key)) {
        output[key] = '[redacted]';
      } else if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
        output[key] = this.redact(entry as Record<string, unknown>);
      } else {
        output[key] = entry;
      }
    }
    return output;
  }

  /** Pulls request metadata off an Express request for the context field. */
  static contextFrom(request: Request): AuditContext {
    const forwarded = request.headers['x-forwarded-for'];
    const ip = Array.isArray(forwarded)
      ? forwarded[0]
      : typeof forwarded === 'string'
        ? forwarded.split(',')[0]?.trim()
        : request.ip;

    return {
      ipAddress: ip ?? null,
      userAgent: request.headers['user-agent'] ?? null,
      requestId: (request.headers['x-request-id'] as string | undefined) ?? null,
    };
  }
}
