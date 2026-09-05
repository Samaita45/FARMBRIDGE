import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AuditModule } from '@/audit/audit.module';
import { AuthModule } from '@/auth/auth.module';
import { validateEnv } from '@/config/env.validation';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { HealthController } from '@/health/health.controller';
import { MapsModule } from '@/maps/maps.module';
import { PaymentsModule } from '@/payments/payments.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { TransportModule } from '@/transport/transport.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Refuses to boot on missing or weak configuration rather than failing
      // on the first request that needs it.
      validate: validateEnv,
      envFilePath: ['.env'],
    }),

    // Rate limiting (brief part 16). Two windows: a burst allowance and a
    // sustained one, so a normal user's quick succession of taps is fine while
    // a scripted flood is not.
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: () => ({
        throttlers: [
          { name: 'burst', ttl: 1_000, limit: 10 },
          { name: 'sustained', ttl: 60_000, limit: 120 },
        ],
      }),
    }),

    PrismaModule,
    AuditModule,
    AuthModule,
    PaymentsModule,
    MapsModule,
    TransportModule,
  ],
  controllers: [HealthController],
  providers: [
    // Order matters. Throttling first (cheapest, sheds load before any work),
    // then authentication, then authorisation.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
