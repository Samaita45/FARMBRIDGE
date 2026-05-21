import type { Crop, CropCategory, DemandLevel } from '@/types';

const REGIONS = [
  'Harare',
  'Bulawayo',
  'Manicaland',
  'Mashonaland',
  'Midlands',
  'Masvingo',
  'Matabeleland',
] as const;

export function monthlyDemand(base: number, peakMonths: number[]): number[] {
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return peakMonths.includes(month) ? Math.min(100, base + 25) : base;
  });
}

export function crop(
  partial: Omit<Crop, 'monthlyDemandData' | 'region'> & {
    monthlyDemandData?: number[];
    region?: string[];
  }
): Crop {
  return {
    region: partial.region ?? [...REGIONS],
    monthlyDemandData:
      partial.monthlyDemandData ??
      monthlyDemand(
        partial.demandLevel === 'very_high' ? 85 : partial.demandLevel === 'high' ? 70 : 50,
        partial.bestPlantingMonths
      ),
    ...partial,
  };
}

export { REGIONS };
