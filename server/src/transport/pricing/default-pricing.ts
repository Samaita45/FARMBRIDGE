export interface VehicleRate {
  baseUsdCents: number;
  perKmUsdCents: number;
}

export interface PricingConfig {
  vehicles: Record<string, VehicleRate>;
  weight: {
    freeKg: number;
    per10KgUsdCents: number;
  };
  goods: Record<string, { multiplierBps: number }>;
  urgency: Record<string, { multiplierBps: number }>;
  extras: Record<string, { usdCents: number }>;
}

/**
 * Seed rate card. Tenants override this row; nothing in the app assumes a
 * single haul price.
 */
export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  vehicles: {
    BAKKIE: { baseUsdCents: 800, perKmUsdCents: 45 },
    TRUCK: { baseUsdCents: 1500, perKmUsdCents: 70 },
    LORRY: { baseUsdCents: 2500, perKmUsdCents: 95 },
    TRACTOR: { baseUsdCents: 600, perKmUsdCents: 35 },
  },
  weight: {
    freeKg: 200,
    per10KgUsdCents: 8,
  },
  goods: {
    'Fresh Produce': { multiplierBps: 11000 },
    Grain: { multiplierBps: 10000 },
    Equipment: { multiplierBps: 10500 },
    Livestock: { multiplierBps: 12500 },
    Other: { multiplierBps: 10000 },
  },
  urgency: {
    STANDARD: { multiplierBps: 10000 },
    SAME_DAY: { multiplierBps: 13000 },
    EXPRESS: { multiplierBps: 16000 },
  },
  extras: {
    Refrigerated: { usdCents: 2000 },
    Covered: { usdCents: 400 },
    Open: { usdCents: 0 },
    'Livestock cage': { usdCents: 2500 },
  },
};
