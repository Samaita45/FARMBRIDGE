import type {
  ExpenseEntry,
  ExpenseCategory,
  FinanceCurrency,
  IncomeEntry,
  MonthlyFinanceSummary,
  PriceAlert,
  SeasonTotals,
} from '@/types/financials';

import { getDatabase } from './database';
import { getExchangeRate, zwgToUsd } from './exchangeRateService';

/**
 * The rate every pre-migration ZWG row was written under.
 *
 * The ledger used a hardcoded 280 while the rest of the app used 100. Those
 * rows meant something specific when they were entered, so the migration
 * backfills this value rather than restating them at today's rate -- a
 * farmer's books must not change because we shipped a release.
 */
const LEGACY_LEDGER_RATE = 280;

/** Converts using the rate stored on the row, falling back to the legacy rate. */
export function toUSD(
  amount: number,
  currency: FinanceCurrency,
  rateUsed?: number | null
): number {
  if (currency === 'USD') return amount;
  return zwgToUsd(amount, rateUsed && rateUsed > 0 ? rateUsed : LEGACY_LEDGER_RATE);
}

/** The rate to stamp on a new row. */
async function currentRate(): Promise<number> {
  return (await getExchangeRate()).usdToZwg;
}

async function initTables(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS financials_income (
      id TEXT PRIMARY KEY NOT NULL,
      userId TEXT NOT NULL,
      cropName TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      pricePerUnit REAL NOT NULL,
      currency TEXT NOT NULL,
      buyer TEXT NOT NULL,
      date TEXT NOT NULL,
      notes TEXT,
      rateUsed REAL,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS financials_expense (
      id TEXT PRIMARY KEY NOT NULL,
      userId TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      date TEXT NOT NULL,
      notes TEXT,
      rateUsed REAL,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS price_alerts (
      id TEXT PRIMARY KEY NOT NULL,
      userId TEXT NOT NULL,
      cropName TEXT NOT NULL,
      targetPriceUSD REAL NOT NULL,
      triggered INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    );
  `);

  await migrateRateColumns();
}

/**
 * Adds `rateUsed` to installs created before it existed and stamps the rate
 * those rows were actually written under, so their USD values do not move.
 */
async function migrateRateColumns(): Promise<void> {
  const db = await getDatabase();
  for (const table of ['financials_income', 'financials_expense']) {
    try {
      const cols = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
      if (!cols.some((c) => c.name === 'rateUsed')) {
        await db.execAsync(`ALTER TABLE ${table} ADD COLUMN rateUsed REAL`);
        await db.runAsync(
          `UPDATE ${table} SET rateUsed = ? WHERE currency = 'ZWG' AND rateUsed IS NULL`,
          LEGACY_LEDGER_RATE
        );
      }
    } catch {
      // A missing table on a fresh install is fine; it is created above.
    }
  }
}

export async function insertIncome(entry: IncomeEntry): Promise<void> {
  await initTables();
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO financials_income (id, userId, cropName, quantity, unit, pricePerUnit, currency, buyer, date, notes, rateUsed, createdAt)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    entry.id,
    entry.userId,
    entry.cropName,
    entry.quantity,
    entry.unit,
    entry.pricePerUnit,
    entry.currency,
    entry.buyer,
    entry.date,
    entry.notes ?? null,
    entry.rateUsed ?? (entry.currency === 'ZWG' ? await currentRate() : null),
    entry.createdAt
  );
}

export async function getIncome(userId: string): Promise<IncomeEntry[]> {
  await initTables();
  const db = await getDatabase();
  const rows = (await db.getAllAsync(
    `SELECT * FROM financials_income WHERE userId = ? ORDER BY date DESC`,
    userId
  )) as Record<string, unknown>[];
  return rows.map((r: Record<string, unknown>) => ({
    id: String(r.id),
    userId: String(r.userId),
    cropName: String(r.cropName),
    quantity: Number(r.quantity),
    unit: String(r.unit),
    pricePerUnit: Number(r.pricePerUnit),
    currency: r.currency as FinanceCurrency,
    buyer: String(r.buyer),
    date: String(r.date),
    notes: r.notes ? String(r.notes) : undefined,
    rateUsed: r.rateUsed != null ? Number(r.rateUsed) : undefined,
    createdAt: String(r.createdAt),
  }));
}

export async function deleteIncome(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM financials_income WHERE id = ?`, id);
}

export async function insertExpense(entry: ExpenseEntry): Promise<void> {
  await initTables();
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO financials_expense (id, userId, category, amount, currency, date, notes, rateUsed, createdAt)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    entry.id,
    entry.userId,
    entry.category,
    entry.amount,
    entry.currency,
    entry.date,
    entry.notes ?? null,
    entry.rateUsed ?? (entry.currency === 'ZWG' ? await currentRate() : null),
    entry.createdAt
  );
}

export async function getExpenses(userId: string): Promise<ExpenseEntry[]> {
  await initTables();
  const db = await getDatabase();
  const rows = (await db.getAllAsync(
    `SELECT * FROM financials_expense WHERE userId = ? ORDER BY date DESC`,
    userId
  )) as Record<string, unknown>[];
  return rows.map((r: Record<string, unknown>) => ({
    id: String(r.id),
    userId: String(r.userId),
    category: r.category as ExpenseCategory,
    amount: Number(r.amount),
    currency: r.currency as FinanceCurrency,
    date: String(r.date),
    notes: r.notes ? String(r.notes) : undefined,
    rateUsed: r.rateUsed != null ? Number(r.rateUsed) : undefined,
    createdAt: String(r.createdAt),
  }));
}

export async function insertPriceAlert(alert: PriceAlert): Promise<void> {
  await initTables();
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO price_alerts (id, userId, cropName, targetPriceUSD, triggered, createdAt) VALUES (?,?,?,?,?,?)`,
    alert.id,
    alert.userId,
    alert.cropName,
    alert.targetPriceUSD,
    alert.triggered ? 1 : 0,
    alert.createdAt
  );
}

export async function getPriceAlerts(userId: string): Promise<PriceAlert[]> {
  await initTables();
  const db = await getDatabase();
  const rows = (await db.getAllAsync(
    `SELECT * FROM price_alerts WHERE userId = ? ORDER BY createdAt DESC`,
    userId
  )) as Record<string, unknown>[];
  return rows.map((r: Record<string, unknown>) => ({
    id: String(r.id),
    userId: String(r.userId),
    cropName: String(r.cropName),
    targetPriceUSD: Number(r.targetPriceUSD),
    triggered: Boolean(r.triggered),
    createdAt: String(r.createdAt),
  }));
}

export function incomeTotalUSD(entries: IncomeEntry[]): number {
  return entries.reduce(
    (sum, e) => sum + toUSD(e.quantity * e.pricePerUnit, e.currency, e.rateUsed),
    0
  );
}

export function expenseTotalUSD(entries: ExpenseEntry[]): number {
  return entries.reduce((sum, e) => sum + toUSD(e.amount, e.currency, e.rateUsed), 0);
}

export async function getSeasonTotals(userId: string): Promise<SeasonTotals> {
  const [income, expenses] = await Promise.all([getIncome(userId), getExpenses(userId)]);
  const revenueUSD = incomeTotalUSD(income);
  const expensesUSD = expenseTotalUSD(expenses);
  return {
    revenueUSD,
    expensesUSD,
    netProfitUSD: revenueUSD - expensesUSD,
  };
}

export async function getMonthlySummaries(userId: string): Promise<MonthlyFinanceSummary[]> {
  const [income, expenses] = await Promise.all([getIncome(userId), getExpenses(userId)]);
  const map = new Map<string, { revenueUSD: number; expensesUSD: number }>();

  for (const e of income) {
    const month = e.date.slice(0, 7);
    const cur = map.get(month) ?? { revenueUSD: 0, expensesUSD: 0 };
    cur.revenueUSD += toUSD(e.quantity * e.pricePerUnit, e.currency, e.rateUsed);
    map.set(month, cur);
  }
  for (const e of expenses) {
    const month = e.date.slice(0, 7);
    const cur = map.get(month) ?? { revenueUSD: 0, expensesUSD: 0 };
    cur.expensesUSD += toUSD(e.amount, e.currency, e.rateUsed);
    map.set(month, cur);
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, v]) => ({ month, ...v }));
}

export async function seedDemoFinancials(userId: string): Promise<void> {
  const existing = await getIncome(userId);
  if (existing.length > 0) return;

  const now = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  await insertIncome({
    id: `inc_${Date.now()}_1`,
    userId,
    cropName: 'Tomatoes',
    quantity: 120,
    unit: 'kg',
    pricePerUnit: 0.85,
    currency: 'USD',
    buyer: 'Harare Restaurant',
    date: iso(now),
    createdAt: now.toISOString(),
  });
  await insertExpense({
    id: `exp_${Date.now()}_1`,
    userId,
    category: 'fertilizer',
    amount: 180,
    currency: 'USD',
    date: iso(new Date(now.getTime() - 7 * 86400000)),
    notes: 'Compound D + AN',
    createdAt: now.toISOString(),
  });
  await insertExpense({
    id: `exp_${Date.now()}_2`,
    userId,
    category: 'labor',
    amount: 45000,
    currency: 'ZWG',
    date: iso(new Date(now.getTime() - 14 * 86400000)),
    notes: 'Planting week',
    createdAt: now.toISOString(),
  });
}
