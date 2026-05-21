export interface CategoryStat {
  category: string;
  percentage: number;
  valueUSD: number;
  color: string;
}

export const MONTHLY_CATEGORY_STATS: CategoryStat[] = [
  { category: 'Vegetables', percentage: 32, valueUSD: 1240000, color: '#22c55e' },
  { category: 'Grains', percentage: 28, valueUSD: 1085000, color: '#16a34a' },
  { category: 'Fruits', percentage: 18, valueUSD: 697500, color: '#86efac' },
  { category: 'Legumes', percentage: 12, valueUSD: 465000, color: '#4ade80' },
  { category: 'Cash Crops', percentage: 10, valueUSD: 387500, color: '#14532d' },
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

export const EXCHANGE_RATE = {
  usdToZwg: 100,
  changePercent: 0.3,
  lastUpdated: new Date().toISOString(),
};
