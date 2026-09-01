/**
 * Farm financial calculations.
 *
 * Pure functions, no I/O, no formatting. Screens were computing profit and
 * margins inline, which meant the same figure could be derived two different
 * ways on two different screens. Everything derived from money lives here so
 * there is one definition of each term.
 *
 * All amounts are USD unless a function says otherwise. Callers convert ZWG
 * first, using the rate stored on the record — see `exchangeRateService`.
 */

export interface ProfitSummary {
  revenueUSD: number;
  expensesUSD: number;
  netProfitUSD: number;
  /** Net profit as a percentage of revenue. Null when there is no revenue. */
  marginPercent: number | null;
  isProfitable: boolean;
}

export interface CropProfitability {
  cropName: string;
  revenueUSD: number;
  expensesUSD: number;
  netProfitUSD: number;
  marginPercent: number | null;
  /** Profit per hectare, when the planted area is known. */
  profitPerHectareUSD: number | null;
}

export interface ProductionCostInput {
  /** Total area planted. */
  hectares: number;
  /** Per-hectare input costs. */
  seedsPerHa: number;
  fertilizerPerHa: number;
  chemicalsPerHa: number;
  labourPerHa: number;
  /** Costs that do not scale with area. */
  fixedCosts: number;
}

export interface ProductionCostBreakdown {
  seeds: number;
  fertilizer: number;
  chemicals: number;
  labour: number;
  fixed: number;
  totalUSD: number;
  perHectareUSD: number;
}

export interface YieldForecastInput {
  hectares: number;
  /** Expected kilograms per hectare. */
  yieldPerHectareKg: number;
  pricePerKgUSD: number;
  /** Share of the crop expected to be lost before sale, 0–1. */
  lossRate?: number;
}

export interface YieldForecast {
  grossYieldKg: number;
  saleableYieldKg: number;
  expectedRevenueUSD: number;
}

// ─── Rounding ────────────────────────────────────────────────────────────────

/** Money is rounded to cents at the boundary, never mid-calculation. */
export function toMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

function toPercent(value: number): number {
  return Math.round(value * 10) / 10;
}

// ─── Core ────────────────────────────────────────────────────────────────────

export function calculateProfit(revenueUSD: number, expensesUSD: number): ProfitSummary {
  const revenue = Number.isFinite(revenueUSD) ? revenueUSD : 0;
  const expenses = Number.isFinite(expensesUSD) ? expensesUSD : 0;
  const net = revenue - expenses;

  return {
    revenueUSD: toMoney(revenue),
    expensesUSD: toMoney(expenses),
    netProfitUSD: toMoney(net),
    // Undefined rather than zero: a farm with no sales has no margin, and
    // showing "0%" would read as break-even.
    marginPercent: revenue > 0 ? toPercent((net / revenue) * 100) : null,
    isProfitable: net > 0,
  };
}

export function calculateProductionCost(input: ProductionCostInput): ProductionCostBreakdown {
  const ha = Math.max(0, input.hectares);
  const seeds = toMoney(input.seedsPerHa * ha);
  const fertilizer = toMoney(input.fertilizerPerHa * ha);
  const chemicals = toMoney(input.chemicalsPerHa * ha);
  const labour = toMoney(input.labourPerHa * ha);
  const fixed = toMoney(input.fixedCosts);
  const total = toMoney(seeds + fertilizer + chemicals + labour + fixed);

  return {
    seeds,
    fertilizer,
    chemicals,
    labour,
    fixed,
    totalUSD: total,
    perHectareUSD: ha > 0 ? toMoney(total / ha) : 0,
  };
}

export function forecastYield(input: YieldForecastInput): YieldForecast {
  const ha = Math.max(0, input.hectares);
  const gross = Math.max(0, input.yieldPerHectareKg) * ha;
  const loss = Math.min(Math.max(input.lossRate ?? 0, 0), 1);
  const saleable = gross * (1 - loss);

  return {
    grossYieldKg: Math.round(gross),
    saleableYieldKg: Math.round(saleable),
    expectedRevenueUSD: toMoney(saleable * Math.max(0, input.pricePerKgUSD)),
  };
}

/**
 * The price per kilogram at which a crop covers its costs. Below this, the
 * farmer loses money on every kilo sold.
 */
export function breakEvenPricePerKg(totalCostUSD: number, saleableYieldKg: number): number | null {
  if (saleableYieldKg <= 0) return null;
  return toMoney(totalCostUSD / saleableYieldKg);
}

/** The yield needed to cover costs at a given price. */
export function breakEvenYieldKg(totalCostUSD: number, pricePerKgUSD: number): number | null {
  if (pricePerKgUSD <= 0) return null;
  return Math.ceil(totalCostUSD / pricePerKgUSD);
}

/** Return on the money spent, as a percentage. */
export function returnOnInvestment(netProfitUSD: number, totalCostUSD: number): number | null {
  if (totalCostUSD <= 0) return null;
  return toPercent((netProfitUSD / totalCostUSD) * 100);
}

// ─── Grouping ────────────────────────────────────────────────────────────────

export interface CropLine {
  cropName: string;
  revenueUSD: number;
  expensesUSD: number;
  hectares?: number;
}

/**
 * Profitability per crop, most profitable first, so a farmer can see which
 * crop actually paid rather than only the farm-wide total.
 */
export function rankCropProfitability(lines: CropLine[]): CropProfitability[] {
  return lines
    .map((line) => {
      const summary = calculateProfit(line.revenueUSD, line.expensesUSD);
      return {
        cropName: line.cropName,
        revenueUSD: summary.revenueUSD,
        expensesUSD: summary.expensesUSD,
        netProfitUSD: summary.netProfitUSD,
        marginPercent: summary.marginPercent,
        profitPerHectareUSD:
          line.hectares && line.hectares > 0
            ? toMoney(summary.netProfitUSD / line.hectares)
            : null,
      };
    })
    .sort((a, b) => b.netProfitUSD - a.netProfitUSD);
}

/** Share of total spend per expense category, for the breakdown chart. */
export function expenseShares<T extends string>(
  totals: Record<T, number>
): { category: T; amountUSD: number; percent: number }[] {
  const entries = Object.entries(totals) as [T, number][];
  const total = entries.reduce((sum, [, v]) => sum + Math.max(0, v), 0);

  return entries
    .map(([category, amount]) => ({
      category,
      amountUSD: toMoney(Math.max(0, amount)),
      percent: total > 0 ? toPercent((Math.max(0, amount) / total) * 100) : 0,
    }))
    .filter((e) => e.amountUSD > 0)
    .sort((a, b) => b.amountUSD - a.amountUSD);
}
