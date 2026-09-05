/**
 * Action-based permissions.
 *
 * The brief asks for permissions expressed as actions ("products.create"),
 * not as role checks scattered through handlers. The difference matters: with
 * `if (user.role === 'ADMIN')` in a controller, adding a support-agent role
 * later means auditing every endpoint. With actions, it means editing one map.
 *
 * Two rules:
 *   - A permission is a capability, never a job title.
 *   - Deny beats grant, always. `deniedPermissions` on a user overrides both
 *     their role and any extra grant, so revoking access is immediate and
 *     unambiguous during an incident.
 */

export const PERMISSIONS = {
  // Products
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_READ: 'products.read',
  PRODUCTS_UPDATE: 'products.update',
  PRODUCTS_DELETE: 'products.delete',
  /// Acting on someone else's listing — moderation, not ownership.
  PRODUCTS_MODERATE: 'products.moderate',

  // Orders
  ORDERS_CREATE: 'orders.create',
  ORDERS_READ: 'orders.read',
  ORDERS_UPDATE: 'orders.update',
  ORDERS_CANCEL: 'orders.cancel',
  ORDERS_READ_ANY: 'orders.read_any',

  // Transport
  TRANSPORT_REQUEST: 'transport.request',
  TRANSPORT_BID: 'transport.bid',
  TRANSPORT_ACCEPT: 'transport.accept',
  TRANSPORT_COMPLETE: 'transport.complete',
  TRANSPORT_LOCATE: 'transport.locate',

  // Community
  COMMUNITY_CREATE: 'community.create',
  COMMUNITY_READ: 'community.read',
  COMMUNITY_MODERATE: 'community.moderate',

  // Payments
  PAYMENTS_CREATE: 'payments.create',
  PAYMENTS_READ: 'payments.read',
  PAYMENTS_REFUND: 'payments.refund',
  PAYMENTS_READ_ANY: 'payments.read_any',

  // Users
  USERS_READ: 'users.read',
  USERS_UPDATE: 'users.update',
  USERS_SUSPEND: 'users.suspend',
  USERS_DELETE: 'users.delete',
  /// Granting roles is separate from editing a user: it is privilege
  /// escalation, and only a very small number of roles should hold it.
  USERS_ASSIGN_ROLES: 'users.assign_roles',

  // Audit
  AUDIT_READ: 'audit.read',
  AUDIT_EXPORT: 'audit.export',

  // Tenants
  TENANTS_READ: 'tenants.read',
  TENANTS_MANAGE: 'tenants.manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS = Object.values(PERMISSIONS) as Permission[];

/** Mirrors the Prisma `Role` enum. Kept as a plain union so this file has no imports. */
export type RoleName =
  | 'FARMER'
  | 'BUYER'
  | 'FARMER_BUYER'
  | 'TRANSPORTER'
  | 'MODERATOR'
  | 'SUPPORT_AGENT'
  | 'ADMIN'
  | 'AUDITOR'
  | 'SUPER_ADMIN';

const FARMER: Permission[] = [
  PERMISSIONS.PRODUCTS_CREATE,
  PERMISSIONS.PRODUCTS_READ,
  PERMISSIONS.PRODUCTS_UPDATE,
  PERMISSIONS.PRODUCTS_DELETE,
  PERMISSIONS.ORDERS_READ,
  PERMISSIONS.ORDERS_UPDATE,
  PERMISSIONS.TRANSPORT_REQUEST,
  PERMISSIONS.TRANSPORT_ACCEPT,
  PERMISSIONS.COMMUNITY_CREATE,
  PERMISSIONS.COMMUNITY_READ,
  PERMISSIONS.PAYMENTS_READ,
];

const BUYER: Permission[] = [
  PERMISSIONS.PRODUCTS_READ,
  PERMISSIONS.ORDERS_CREATE,
  PERMISSIONS.ORDERS_READ,
  PERMISSIONS.ORDERS_CANCEL,
  PERMISSIONS.TRANSPORT_REQUEST,
  PERMISSIONS.COMMUNITY_CREATE,
  PERMISSIONS.COMMUNITY_READ,
  PERMISSIONS.PAYMENTS_CREATE,
  PERMISSIONS.PAYMENTS_READ,
];

const TRANSPORTER: Permission[] = [
  PERMISSIONS.PRODUCTS_READ,
  PERMISSIONS.TRANSPORT_BID,
  PERMISSIONS.TRANSPORT_COMPLETE,
  PERMISSIONS.TRANSPORT_LOCATE,
  PERMISSIONS.COMMUNITY_READ,
  PERMISSIONS.PAYMENTS_READ,
];

const MODERATOR: Permission[] = [
  PERMISSIONS.PRODUCTS_READ,
  PERMISSIONS.PRODUCTS_MODERATE,
  PERMISSIONS.COMMUNITY_READ,
  PERMISSIONS.COMMUNITY_MODERATE,
  PERMISSIONS.USERS_READ,
  PERMISSIONS.USERS_SUSPEND,
];

const SUPPORT_AGENT: Permission[] = [
  PERMISSIONS.PRODUCTS_READ,
  PERMISSIONS.ORDERS_READ_ANY,
  PERMISSIONS.ORDERS_UPDATE,
  PERMISSIONS.USERS_READ,
  PERMISSIONS.PAYMENTS_READ_ANY,
  PERMISSIONS.COMMUNITY_READ,
];

/**
 * Read-only by design. An auditor can see everything that happened and change
 * nothing — the whole point of the role is that its account cannot be used to
 * alter what it is meant to be checking.
 */
const AUDITOR: Permission[] = [
  PERMISSIONS.AUDIT_READ,
  PERMISSIONS.AUDIT_EXPORT,
  PERMISSIONS.ORDERS_READ_ANY,
  PERMISSIONS.PAYMENTS_READ_ANY,
  PERMISSIONS.USERS_READ,
  PERMISSIONS.PRODUCTS_READ,
  PERMISSIONS.TENANTS_READ,
];

const ADMIN: Permission[] = [
  ...new Set([
    ...FARMER,
    ...BUYER,
    ...MODERATOR,
    ...SUPPORT_AGENT,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_DELETE,
    PERMISSIONS.PAYMENTS_REFUND,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.TENANTS_READ,
  ]),
];

export const ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
  FARMER,
  BUYER,
  FARMER_BUYER: [...new Set([...FARMER, ...BUYER])],
  TRANSPORTER,
  MODERATOR,
  SUPPORT_AGENT,
  AUDITOR,
  ADMIN,
  // Deliberately not spread from ADMIN: a new permission should not silently
  // become a super-admin capability without someone deciding it should.
  SUPER_ADMIN: ALL_PERMISSIONS,
};

/**
 * Everything a user may do. Deny wins over role grants and extra grants alike.
 */
export function resolvePermissions(
  roles: RoleName[],
  extraPermissions: string[] = [],
  deniedPermissions: string[] = [],
): Set<Permission> {
  const granted = new Set<Permission>();

  for (const role of roles) {
    for (const permission of ROLE_PERMISSIONS[role] ?? []) {
      granted.add(permission);
    }
  }

  for (const extra of extraPermissions) {
    if ((ALL_PERMISSIONS as string[]).includes(extra)) {
      granted.add(extra as Permission);
    }
  }

  for (const denied of deniedPermissions) {
    granted.delete(denied as Permission);
  }

  return granted;
}

export function hasPermission(
  granted: Set<Permission>,
  required: Permission[],
  mode: 'all' | 'any' = 'all',
): boolean {
  if (required.length === 0) return true;
  return mode === 'all'
    ? required.every((p) => granted.has(p))
    : required.some((p) => granted.has(p));
}
