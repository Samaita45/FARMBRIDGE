/**
 * USD/ZWG exchange rates.
 *
 * WHY THIS EXISTS. The app previously carried three separate hardcoded rates:
 * `USD_TO_ZWG_RATE = 100` priced the marketplace, `EXCHANGE_RATE.usdToZwg = 100`
 * drove the dashboard, and `EXCHANGE = 280` converted the financial ledger. The
 * same ZWG amount was therefore worth 2.8x more in one module than another, so a
 * farmer's recorded ZWG income could not reconcile with the ZWG prices they were
 * shown. There is now one rate, from one place.
 *
 * DESIGN. The rate is a *dated fact*, not a constant. Every rate carries the
 * source it came from and the moment it took effect, and past rates are kept so
 * a historical record can be converted at the rate that applied when it was
 * written rather than at today's. The source is behind an interface so a live
 * feed (RBZ, a bank, or our own API) can replace the built-in fallback without
 * touching a single call site.
 */
import { getCached, getStaleCached, setCached } from './cacheService';
import { getJSON, setJSON } from './storage';

export type RateSource = 'fallback' | 'cache' | 'remote' | 'manual';

export interface ExchangeRate {
  /** ZWG per 1 USD. */
  usdToZwg: number;
  source: RateSource;
  /** ISO timestamp at which this rate took effect. */
  effectiveAt: string;
  /** Where it came from, for display: "RBZ interbank", "Entered manually". */
  label: string;
}

/**
 * Last-resort rate, used only when nothing has ever been fetched or stored.
 *
 * It is deliberately NOT presented as live anywhere in the UI. Update it when
 * cutting a release, but treat it as a floor, not a source of truth.
 */
const FALLBACK: ExchangeRate = {
  usdToZwg: 26.5,
  source: 'fallback',
  effectiveAt: '2026-01-01T00:00:00.000Z',
  label: 'Built-in reference rate',
};

const CACHE_KEY = 'exchange_rate:usd_zwg';
const HISTORY_KEY = 'exchange_rate_history:usd_zwg';
const MANUAL_KEY = 'exchange_rate_manual:usd_zwg';

/** Rates go stale quickly in this market; six hours is generous. */
const TTL_MS = 1000 * 60 * 60 * 6;
const MAX_HISTORY = 60;

/** A source of rates. Implement this to plug in a live feed. */
export interface ExchangeRateProvider {
  readonly id: string;
  readonly label: string;
  fetchRate(): Promise<Pick<ExchangeRate, 'usdToZwg' | 'effectiveAt'>>;
}

let provider: ExchangeRateProvider | null = null;

/**
 * Registers the live source. Call once at startup when one exists; until then
 * the service serves the manual rate, then cache, then the fallback.
 */
export function setExchangeRateProvider(next: ExchangeRateProvider | null): void {
  provider = next;
}

// ─── History ─────────────────────────────────────────────────────────────────

export async function getRateHistory(): Promise<ExchangeRate[]> {
  return (await getJSON<ExchangeRate[]>(HISTORY_KEY)) ?? [];
}

async function recordRate(rate: ExchangeRate): Promise<void> {
  const history = await getRateHistory();
  // Same rate on the same day is not a new fact.
  const last = history[0];
  if (last && last.usdToZwg === rate.usdToZwg && last.source === rate.source) return;
  await setJSON(HISTORY_KEY, [rate, ...history].slice(0, MAX_HISTORY));
}

/**
 * The rate that applied at a given moment, for converting historical records.
 * Falls back to the oldest rate we know about rather than to today's.
 */
export async function getRateAt(isoTimestamp: string): Promise<ExchangeRate> {
  const history = await getRateHistory();
  if (history.length === 0) return getExchangeRate();
  const target = new Date(isoTimestamp).getTime();
  const applicable = history.find((r) => new Date(r.effectiveAt).getTime() <= target);
  return applicable ?? history[history.length - 1];
}

// ─── Manual override ─────────────────────────────────────────────────────────

/**
 * Lets a user record the rate they are actually trading at. Zimbabwean farmers
 * frequently transact away from any published rate, and forcing an official
 * number onto their books would make the books wrong.
 */
export async function setManualRate(usdToZwg: number): Promise<ExchangeRate> {
  if (!Number.isFinite(usdToZwg) || usdToZwg <= 0) {
    throw new Error('Enter a rate greater than zero.');
  }
  const rate: ExchangeRate = {
    usdToZwg,
    source: 'manual',
    effectiveAt: new Date().toISOString(),
    label: 'Entered manually',
  };
  await setJSON(MANUAL_KEY, rate);
  await setCached(CACHE_KEY, rate);
  await recordRate(rate);
  return rate;
}

export async function clearManualRate(): Promise<void> {
  await setJSON(MANUAL_KEY, null);
}

async function getManualRate(): Promise<ExchangeRate | null> {
  return getJSON<ExchangeRate>(MANUAL_KEY);
}

// ─── Reading the rate ────────────────────────────────────────────────────────

/**
 * The current rate. Never throws — it degrades from live, to a manual entry,
 * to cache, to stale cache, to the built-in reference, so callers always get a
 * usable number and can show `source` to say how trustworthy it is.
 */
export async function getExchangeRate(): Promise<ExchangeRate> {
  const manual = await getManualRate();
  if (manual) return manual;

  const cached = await getCached<ExchangeRate>(CACHE_KEY, TTL_MS);
  if (cached) return { ...cached, source: 'cache' };

  if (provider) {
    try {
      const fresh = await provider.fetchRate();
      const rate: ExchangeRate = {
        usdToZwg: fresh.usdToZwg,
        effectiveAt: fresh.effectiveAt,
        source: 'remote',
        label: provider.label,
      };
      await setCached(CACHE_KEY, rate);
      await recordRate(rate);
      return rate;
    } catch {
      // fall through to stale, then fallback
    }
  }

  const stale = await getStaleCached<ExchangeRate>(CACHE_KEY);
  if (stale) return { ...stale, source: 'cache' };

  return FALLBACK;
}

/** Synchronous default for render paths that cannot await. Prefer `getExchangeRate`. */
export function getFallbackRate(): ExchangeRate {
  return FALLBACK;
}

// ─── Conversion ──────────────────────────────────────────────────────────────

export function usdToZwg(amountUSD: number, rate: number): number {
  return Math.round(amountUSD * rate * 100) / 100;
}

export function zwgToUsd(amountZWG: number, rate: number): number {
  if (rate <= 0) return 0;
  return Math.round((amountZWG / rate) * 100) / 100;
}

/**
 * Converts to USD using the rate that applied when the record was written.
 *
 * Records store `rateUsed`, so re-reading the ledger after the rate moves does
 * not silently restate history. Rows written before `rateUsed` existed fall
 * back to the rate in effect at their timestamp.
 */
export async function toUsdAtRecordRate(
  amount: number,
  currency: 'USD' | 'ZWG',
  rateUsed: number | null | undefined,
  writtenAt: string
): Promise<number> {
  if (currency === 'USD') return amount;
  if (rateUsed && rateUsed > 0) return zwgToUsd(amount, rateUsed);
  const historical = await getRateAt(writtenAt);
  return zwgToUsd(amount, historical.usdToZwg);
}

/** Human-readable freshness, e.g. "Reference rate · not live". */
export function describeRate(rate: ExchangeRate): string {
  switch (rate.source) {
    case 'remote':
      return `${rate.label} · updated ${formatAge(rate.effectiveAt)}`;
    case 'manual':
      return `Your rate · set ${formatAge(rate.effectiveAt)}`;
    case 'cache':
      return `${rate.label} · updated ${formatAge(rate.effectiveAt)}`;
    default:
      return 'Reference rate · not live';
  }
}

function formatAge(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toISOString().slice(0, 10);
}
