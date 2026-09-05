import { Module } from '@nestjs/common';

import { AuditModule } from '@/audit/audit.module';
import { AuthModule } from '@/auth/auth.module';
import { MapsModule } from '@/maps/maps.module';

import { TransportPricingService } from './pricing/transport-pricing.service';
import { TransportController } from './transport.controller';
import { TransportGateway } from './transport.gateway';
import { TransportService } from './transport.service';

@Module({
  imports: [AuditModule, AuthModule, MapsModule],
  controllers: [TransportController],
  providers: [TransportPricingService, TransportGateway, TransportService],
  exports: [TransportService, TransportPricingService],
})
export class TransportModule {}
