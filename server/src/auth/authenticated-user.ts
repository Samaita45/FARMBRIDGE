import type { Permission, RoleName } from '@/rbac/permissions';

/**
 * What the API knows about the caller after the token is verified.
 *
 * `permissions` is resolved once per request from roles plus per-user grants
 * and denials, so guards never re-derive it and can never disagree.
 */
export interface AuthenticatedUser {
  id: string;
  tenantId: string;
  email: string;
  roles: RoleName[];
  permissions: Set<Permission>;
  /** The refresh-token family this session belongs to, for revocation. */
  sessionFamilyId?: string;
}

/**
 * Claims we set when signing. Deliberately free of `iat` and `exp` -- those are
 * added by the signer from `expiresIn`, and declaring them here makes
 * jsonwebtoken reject the options as contradictory.
 */
export interface AccessTokenClaims {
  /** Subject — the user id. */
  sub: string;
  tid: string;
  email: string;
  roles: RoleName[];
}

export interface RefreshTokenClaims {
  sub: string;
  tid: string;
  /** Rotation family, so reuse of any token revokes the whole chain. */
  fam: string;
  /** Unique per token, so a specific token can be matched to its stored hash. */
  jti: string;
}

/** What comes back from verification: the claims plus the registered fields. */
export type AccessTokenPayload = AccessTokenClaims & { iat: number; exp: number };
export type RefreshTokenPayload = RefreshTokenClaims & { iat: number; exp: number };
