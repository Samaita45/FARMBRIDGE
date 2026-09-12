import { useCallback, useEffect, useState } from 'react';

import {
  describeRate,
  getExchangeRate,
  getFallbackRate,
  type ExchangeRate,
} from '@/services/exchangeRateService';

interface UseExchangeRate {
  rate: ExchangeRate;
  /** e.g. "Reference rate · not live" — show this next to any converted figure. */
  description: string;
  /** False once the real rate has resolved; until then `rate` is the fallback. */
  isLoading: boolean;
  /** True when the figure is not from a live source and should be labelled as such. */
  isIndicative: boolean;
  refresh: () => Promise<void>;
}

/**
 * The current USD/ZWG rate, with its provenance.
 *
 * Always returns a usable rate — the built-in reference until the real one
 * resolves — so screens never have to render a blank where a price should be.
 * Read `isIndicative` before presenting a converted number as authoritative.
 */
export function useExchangeRate(): UseExchangeRate {
  const [rate, setRate] = useState<ExchangeRate>(getFallbackRate);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setRate(await getExchangeRate());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    rate,
    description: describeRate(rate),
    isLoading,
    isIndicative: rate.source === 'fallback' || rate.source === 'cache',
    refresh: load,
  };
}
