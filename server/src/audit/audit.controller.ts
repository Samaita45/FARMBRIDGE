import { Controller, Get, Query } from '@nestjs/common';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

import type { AuthenticatedUser } from '@/auth/authenticated-user';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { PrismaService } from '@/prisma/prisma.service';
import { PERMISSIONS } from '@/rbac/permissions';

class QueryAuditDto {
  @IsOptional() @IsString() action?: string;
  @IsOptional() @IsString() actorId?: string;
  @IsOptional() @IsString() resourceType?: string;
  @IsOptional() @IsIn(['SUCCESS', 'FAILURE', 'DENIED']) result?: 'SUCCESS' | 'FAILURE' | 'DENIED';

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(200)
  limit?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  offset?: number;
}

/**
 * Reading the audit trail.
 *
 * Access is gated on `audit.read`, which is held by AUDITOR, ADMIN and
 * SUPER_ADMIN only — deliberately separate from the permissions that grant
 * access to ordinary business data, so someone who can manage orders cannot
 * automatically read the record of who touched them.
 *
 * There is no write endpoint. Entries are appended by services, and the
 * database refuses UPDATE and DELETE on the table regardless.
 */
@Controller({ path: 'audit', version: '1' })
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.AUDIT_READ)
  async list(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryAuditDto) {
    // Scoped client: an auditor sees their own tenant's trail, never another's.
    const db = this.prisma.forTenant(user.tenantId);

    const where = {
      ...(query.action ? { action: query.action } : {}),
      ...(query.actorId ? { actorId: query.actorId } : {}),
      ...(query.resourceType ? { resourceType: query.resourceType } : {}),
      ...(query.result ? { result: query.result } : {}),
    };

    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;

    const [entries, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.auditLog.count({ where }),
    ]);

    return { entries, total, limit, offset };
  }
}
