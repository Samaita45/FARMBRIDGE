/**
 * Per-hectare planning budgets for Zimbabwean smallholder production.
 *
 * WHY THIS EXISTS. Two different yield tables were in the codebase and they
 * disagreed: `taskGenerator` assumed maize at 3,500 kg/ha and tomatoes at
 * 25,000, while the profit calculator assumed 5,000 and 12,000. The same farm
 * therefore forecast different revenue depending on which screen you opened.
 * There is now one table.
 *
 * PROVENANCE. These are planning estimates for a reasonably managed smallholder
 * plot, not guarantees. Real yields vary widely with rainfall, variety, soil and
 * management. Every screen that uses them must say they are estimates — a
 * farmer making a planting decision on these numbers deserves to know how firm
 * they are. Confirm against current Agritex extension guidance before relying
 * on them for a loan application or a supply contract.
 *
 * When a crop is missing, callers fall back to `DEFAULT_BUDGET` rather than
 * inventing a figure.
 */

export interface CropBudget {
  /** Expected saleable kilograms per hectare in an average season. */
  yieldPerHectareKg: number;
  /** Typical per-hectare input costs in USD. */
  seedsPerHa: number;
  fertilizerPerHa: number;
  chemicalsPerHa: number;
  labourPerHa: number;
  /** Share typically lost to spoilage, pests or rejection before sale, 0–1. */
  lossRate: number;
}

export const DEFAULT_BUDGET: CropBudget = {
  yieldPerHectareKg: 5000,
  seedsPerHa: 100,
  fertilizerPerHa: 300,
  chemicalsPerHa: 80,
  labourPerHa: 200,
  lossRate: 0.1,
};

export const CROP_BUDGETS: Record<string, CropBudget> = {
  maize: {
    yieldPerHectareKg: 3500,
    seedsPerHa: 80,
    fertilizerPerHa: 300,
    chemicalsPerHa: 60,
    labourPerHa: 200,
    lossRate: 0.08,
  },
  tomatoes: {
    yieldPerHectareKg: 25000,
    seedsPerHa: 150,
    fertilizerPerHa: 400,
    chemicalsPerHa: 220,
    labourPerHa: 450,
    // Fresh produce with no cold chain spoils heavily on the way to market.
    lossRate: 0.18,
  },
  tobacco: {
    yieldPerHectareKg: 2200,
    seedsPerHa: 120,
    fertilizerPerHa: 520,
    chemicalsPerHa: 180,
    labourPerHa: 600,
    lossRate: 0.06,
  },
  onions: {
    yieldPerHectareKg: 18000,
    seedsPerHa: 180,
    fertilizerPerHa: 350,
    chemicalsPerHa: 120,
    labourPerHa: 380,
    lossRate: 0.12,
  },
  potatoes: {
    yieldPerHectareKg: 20000,
    seedsPerHa: 600,
    fertilizerPerHa: 420,
    chemicalsPerHa: 150,
    labourPerHa: 350,
    lossRate: 0.12,
  },
  beans: {
    yieldPerHectareKg: 1200,
    seedsPerHa: 110,
    fertilizerPerHa: 180,
    chemicalsPerHa: 70,
    labourPerHa: 220,
    lossRate: 0.08,
  },
  groundnuts: {
    yieldPerHectareKg: 1500,
    seedsPerHa: 130,
    fertilizerPerHa: 150,
    chemicalsPerHa: 60,
    labourPerHa: 260,
    lossRate: 0.09,
  },
  cabbage: {
    yieldPerHectareKg: 30000,
    seedsPerHa: 140,
    fertilizerPerHa: 380,
    chemicalsPerHa: 160,
    labourPerHa: 400,
    lossRate: 0.15,
  },
  soyabeans: {
    yieldPerHectareKg: 2200,
    seedsPerHa: 140,
    fertilizerPerHa: 220,
    chemicalsPerHa: 90,
    labourPerHa: 200,
    lossRate: 0.07,
  },
  wheat: {
    yieldPerHectareKg: 4500,
    seedsPerHa: 160,
    fertilizerPerHa: 400,
    chemicalsPerHa: 110,
    labourPerHa: 230,
    lossRate: 0.06,
  },
};

export function getCropBudget(cropId: string): CropBudget {
  return CROP_BUDGETS[cropId] ?? DEFAULT_BUDGET;
}

/** Shown wherever these figures drive a number the user might act on. */
export const BUDGET_DISCLAIMER =
  'Planning estimates for an average season. Actual yields and costs vary with rainfall, variety and management.';
