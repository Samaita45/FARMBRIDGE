import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import type { RoleName } from '@/rbac/permissions';

/**
 * Roles a person may self-assign at registration.
 *
 * Deliberately excludes MODERATOR, SUPPORT_AGENT, ADMIN, AUDITOR and
 * SUPER_ADMIN — privileged roles are granted, never claimed, or registration
 * becomes a privilege-escalation endpoint.
 */
const SELF_ASSIGNABLE_ROLES = ['FARMER', 'BUYER', 'FARMER_BUYER', 'TRANSPORTER'] as const;

export class RegisterDto {
  @IsUUID()
  tenantId!: string;

  @IsString() @MinLength(2) @MaxLength(120)
  name!: string;

  @IsEmail({}, { message: 'Enter a valid email address' })
  @MaxLength(255)
  email!: string;

  @Matches(/^(\+?263|0)?7[1-9]\d{7}$/, { message: 'Enter a valid Zimbabwe mobile number' })
  phone!: string;

  /**
   * 12 characters minimum with no composition rules — length beats forced
   * symbols, which mostly produce "Password1!" and a sticky note.
   */
  @IsString()
  @MinLength(12, { message: 'Use at least 12 characters' })
  @MaxLength(200)
  password!: string;

  @IsOptional() @IsIn(SELF_ASSIGNABLE_ROLES)
  role?: Extract<RoleName, 'FARMER' | 'BUYER' | 'FARMER_BUYER' | 'TRANSPORTER'>;

  @IsOptional() @IsString() @MaxLength(80)
  province?: string;
}

export class LoginDto {
  @IsUUID()
  tenantId!: string;

  @IsEmail() @MaxLength(255)
  email!: string;

  @IsString() @MaxLength(200)
  password!: string;
}

export class RefreshDto {
  @IsString()
  refreshToken!: string;
}

export class ChangePasswordDto {
  @IsString() @MaxLength(200)
  currentPassword!: string;

  @IsString() @MinLength(12) @MaxLength(200)
  newPassword!: string;
}
