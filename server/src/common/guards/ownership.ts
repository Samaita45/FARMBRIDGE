import { ForbiddenException, NotFoundException } from '@nestjs/common';

import type { AuthenticatedUser } from '@/auth/authenticated-user';
import { type Permission } from '@/rbac/permissions';

/**
 * Resource ownership.
 *
 * A permission says "this kind of user may update products". Ownership says
 * "this user may update *this* product". Both are required: without the second,
 * any farmer could edit any other farmer's listing, which is the classic broken
 * object-level authorisation failure.
 *
 * Callers pass an override permission (for example `products.moderate`) so a
 * moderator or support agent can act on someone else's resource deliberately,
 * rather than by an accidental gap in the check.
 */
export function assertOwnership(
  user: AuthenticatedUser,
  resource: { ownerId: string | null | undefined } | null,
  overridePermission?: Permission,
): void {
  // A resource in another tenant is already invisible via the scoped client, so
  // reaching here with null means it does not exist for this caller at all.
  if (!resource) throw new NotFoundException('Not found.');

  if (resource.ownerId === user.id) return;

  if (overridePermission && user.permissions.has(overridePermission)) return;

  // 404, not 403: confirming that a resource exists but belongs to someone else
  // is itself a disclosure. The caller learns only that they cannot see it.
  throw new NotFoundException('Not found.');
}
