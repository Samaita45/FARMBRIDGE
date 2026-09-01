import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import type { AuthenticatedUser } from '@/auth/authenticated-user';
import {
  PERMISSIONS_KEY,
  PERMISSIONS_MODE_KEY,
} from '@/common/decorators/permissions.decorator';
import { hasPermission, type Permission } from '@/rbac/permissions';

/**
 * Action-based authorisation.
 *
 * A route declares what it needs — `@RequirePermissions(PERMISSIONS.ORDERS_CREATE)`
 * — and never inspects roles. Adding a role later is then a change to one map
 * rather than an audit of every handler.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) return true;

    const mode =
      this.reflector.getAllAndOverride<'all' | 'any'>(PERMISSIONS_MODE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 'all';

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const user = request.user;

    // No principal on a permissioned route means the auth guard did not run.
    // Refuse rather than assume.
    if (!user) throw new ForbiddenException('You do not have access to this action.');

    if (!hasPermission(user.permissions, required, mode)) {
      // The message deliberately does not name the missing permission: telling
      // a caller exactly which capability to look for maps out the API for them.
      throw new ForbiddenException('You do not have access to this action.');
    }

    return true;
  }
}
