export type ExpenseCategory =
  | 'seeds'
  | 'fertilizer'
  | 'labor'
  | 'transport'
  | 'equipment'
  | 'other';

export type FinanceCurrency = 'USD' | 'ZWG';

export interface IncomeEntry {
  id: string;
  userId: string;
  cropName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  currency: FinanceCurrency;
  buyer: string;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface ExpenseEntry {
  id: string;
  userId: string;
  category: ExpenseCategory;
  amount: number;
  currency: FinanceCurrency;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface PriceAlert {
  id: string;
  userId: string;
  cropName: string;
  targetPriceUSD: number;
  triggered: boolean;
  createdAt: string;
}

export interface MonthlyFinanceSummary {
  month: string;
  revenueUSD: number;
  expensesUSD: number;
}

export interface SeasonTotals {
  revenueUSD: number;
  expensesUSD: number;
  netProfitUSD: number;
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  seeds: 'Seeds',
  fertilizer: 'Fertilizer',
  labor: 'Labor',
  transport: 'Transport',
  equipment: 'Equipment',
  other: 'Other',
};
