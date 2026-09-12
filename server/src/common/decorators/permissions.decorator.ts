import { SetMetadata } from '@nestjs/common';

import type { Permission } from '@/rbac/permissions';

export const PERMISSIONS_KEY = 'requiredPermissions';
export const PERMISSIONS_MODE_KEY = 'requiredPermissionsMode';

/** Requires every listed permission. */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/** Requires at least one of the listed permissions. */
export function RequireAnyPermission(...permissions: Permission[]) {
  const setPermissions = SetMetadata(PERMISSIONS_KEY, permissions);
  const setMode = SetMetadata(PERMISSIONS_MODE_KEY, 'any');

  return (target: object, key?: string | symbol, descriptor?: PropertyDescriptor) => {
    if (key !== undefined && descriptor !== undefined) {
      setPermissions(target, key, descriptor);
      setMode(target, key, descriptor);
      return;
    }
    // Class-level usage: applies to every route in the controller.
    setPermissions(target as never);
    setMode(target as never);
  };
}
