import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import type { AuthenticatedUser } from '@/auth/authenticated-user';
import { PrismaService } from '@/prisma/prisma.service';

import { DEFAULT_PRICING_CONFIG, type PricingConfig } from './default-pricing';

export interface PricingQuoteInput {
  distanceKm: number;
  vehicleType?: string | null;
  weightKg: number;
  goodsType: string;
  urgency?: string | null;
  extras?: string[];
}

export interface PricingQuote {
  estimatedPriceUsdCents: number;
  breakdown: {
    vehicleType: string;
    baseUsdCents: number;
    distanceUsdCents: number;
    weightUsdCents: number;
    extrasUsdCents: number;
    goodsMultiplierBps: number;
    urgencyMultiplierBps: number;
    distanceKm: number;
  };
}

@Injectable()
export class TransportPricingService {
  constructor(private readonly prisma: PrismaService) {}

  async quote(user: AuthenticatedUser, input: PricingQuoteInput): Promise<PricingQuote> {
    const config = await this.getConfig(user.tenantId);
    return this.calculate(config, input);
  }

  calculate(config: PricingConfig, input: PricingQuoteInput): PricingQuote {
    const vehicleType = input.vehicleType && config.vehicles[input.vehicleType]
      ? input.vehicleType
      : 'TRUCK';
    const vehicle = config.vehicles[vehicleType] ?? DEFAULT_PRICING_CONFIG.vehicles.TRUCK!;
    const distanceKm = Math.max(1, Math.round(input.distanceKm));

    const baseUsdCents = vehicle.baseUsdCents;
    const distanceUsdCents = vehicle.perKmUsdCents * distanceKm;

    const billableKg = Math.max(0, input.weightKg - config.weight.freeKg);
    const weightUsdCents = Math.ceil(billableKg / 10) * config.weight.per10KgUsdCents;

    const extrasUsdCents = (input.extras ?? []).reduce((sum, extra) => {
      return sum + (config.extras[extra]?.usdCents ?? 0);
    }, 0);

    const goodsMultiplierBps = config.goods[input.goodsType]?.multiplierBps ?? 10_000;
    const urgencyMultiplierBps =
      config.urgency[input.urgency ?? 'STANDARD']?.multiplierBps ?? 10_000;

    const subtotal = baseUsdCents + distanceUsdCents + weightUsdCents + extrasUsdCents;
    const estimatedPriceUsdCents = Math.max(
      100,
      Math.round((subtotal * goodsMultiplierBps * urgencyMultiplierBps) / 100_000_000),
    );

    return {
      estimatedPriceUsdCents,
      breakdown: {
        vehicleType,
        baseUsdCents,
        distanceUsdCents,
        weightUsdCents,
        extrasUsdCents,
        goodsMultiplierBps,
        urgencyMultiplierBps,
        distanceKm,
      },
    };
  }

  async getConfig(tenantId: string): Promise<PricingConfig> {
    const db = this.prisma.forTenant(tenantId);
    const existing = await db.transportPricingConfig.findFirst({
      where: { tenantId },
    });
    if (existing) {
      return existing.config as unknown as PricingConfig;
    }

    const created = await db.transportPricingConfig.create({
      data: {
        tenantId,
        currency: 'USD',
        config: DEFAULT_PRICING_CONFIG as unknown as Prisma.InputJsonValue,
      },
    });
    return created.config as unknown as PricingConfig;
  }
}
