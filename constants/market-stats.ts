export interface CategoryStat {
  category: string;
  percentage: number;
  valueUSD: number;
}

/**
 * Share of market value by category, ranked.
 *
 * Colour is no longer stored here. Each row carried its own hex, and the five
 * were a scrambled green ramp — 500, 600, 200, 400, 900 — so the shading
 * implied an order the data did not have. Ranked shares are a magnitude, so the
 * chart applies one sequential ramp by position instead.
 */
export const MONTHLY_CATEGORY_STATS: CategoryStat[] = [
  { category: 'Vegetables', percentage: 32, valueUSD: 1240000 },
  { category: 'Grains', percentage: 28, valueUSD: 1085000 },
  { category: 'Fruits', percentage: 18, valueUSD: 697500 },
  { category: 'Legumes', percentage: 12, valueUSD: 465000 },
  { category: 'Cash Crops', percentage: 10, valueUSD: 387500 },
];

export const MARKET_SUMMARY = {
  activeFarms: 48200,
  totalTransactions: 156800,
  mostSoldCrop: 'Tomatoes',
  totalValueUSD: 3875000,
};

export interface ProvinceDemand {
  province: string;
  demandIndex: number;
}

export const PROVINCE_DEMAND: ProvinceDemand[] = [
  { province: 'Harare', demandIndex: 95 },
  { province: 'Bulawayo', demandIndex: 78 },
  { province: 'Manicaland', demandIndex: 82 },
  { province: 'Mashonaland Central', demandIndex: 88 },
  { province: 'Mashonaland East', demandIndex: 91 },
  { province: 'Mashonaland West', demandIndex: 85 },
  { province: 'Masvingo', demandIndex: 72 },
  { province: 'Matabeleland North', demandIndex: 65 },
  { province: 'Matabeleland South', demandIndex: 58 },
  { province: 'Midlands', demandIndex: 76 },
];

/**
 * @deprecated Use `getExchangeRate()` from `@/services/exchangeRateService`.
 *
 * `lastUpdated` was `new Date().toISOString()`, evaluated when the bundle
 * loaded -- so a hardcoded rate always claimed to have just been refreshed.
 * Nothing should present a number as live unless the service says it is.
 */
