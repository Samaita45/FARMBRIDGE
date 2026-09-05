import { plainToInstance } from 'class-transformer';
import { IsIn, IsNotEmpty, IsOptional, IsString, MinLength, validateSync } from 'class-validator';

/**
 * Environment validation.
 *
 * The process refuses to start with missing or weak configuration, rather than
 * failing later on the first request that needs it. A JWT secret that is absent
 * in production is not a runtime error to recover from — it is a reason not to
 * be running.
 */
class EnvironmentVariables {
  @IsIn(['development', 'test', 'production'])
  NODE_ENV!: string;

  @IsString() @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString() @IsNotEmpty()
  REDIS_URL!: string;

  // 32 characters is the floor for an HS256 secret worth having.
  @IsString() @MinLength(32, { message: 'JWT_ACCESS_SECRET must be at least 32 characters' })
  JWT_ACCESS_SECRET!: string;

  @IsString() @MinLength(32, { message: 'JWT_REFRESH_SECRET must be at least 32 characters' })
  JWT_REFRESH_SECRET!: string;

  @IsOptional() @IsString() JWT_ACCESS_TTL?: string;
  @IsOptional() @IsString() JWT_REFRESH_TTL?: string;
  @IsOptional() @IsString() CORS_ORIGINS?: string;
  @IsOptional() @IsString() PORT?: string;

  @IsOptional() @IsIn(['mock', 'paynow'])
  PAYMENT_PROVIDER?: string;

  /// Places, Routes and Geocoding. Optional so local API still boots.
  /// Maps endpoints fail closed when this is empty. Never put this in the app.
  @IsOptional() @IsString()
  GOOGLE_MAPS_SERVER_API_KEY?: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    const detail = errors
      .map((e) => Object.values(e.constraints ?? {}).join(', '))
      .join('\n  - ');
    throw new Error(`Invalid environment configuration:\n  - ${detail}`);
  }

  if (validated.JWT_ACCESS_SECRET === validated.JWT_REFRESH_SECRET) {
    throw new Error(
      'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must differ, so a leaked access ' +
        'secret cannot be used to mint refresh tokens.',
    );
  }

  if (validated.NODE_ENV === 'production' && validated.PAYMENT_PROVIDER !== 'paynow') {
    throw new Error('PAYMENT_PROVIDER must be "paynow" in production.');
  }

  return validated;
}
