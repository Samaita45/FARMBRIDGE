import { useCallback, useEffect, useState } from 'react';

import { getStaleCached } from '@/services/cacheService';
import { getWeather, type WeatherBundle } from '@/services/weatherService';

import type { AppLocation } from './useLocation';

/** Local weather state (no @tanstack/react-query — avoids missing module when deps are incomplete). */
export function useWeather(location: AppLocation | null) {
  const [data, setData] = useState<WeatherBundle | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!location) {
      setData(undefined);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const cacheKey = `weather:${location.latitude.toFixed(2)}:${location.longitude.toFixed(2)}`;
    const stale = await getStaleCached<WeatherBundle>(cacheKey);
    if (stale) setData(stale);
    const fresh = await getWeather(location.latitude, location.longitude);
    setData(fresh);
    setIsLoading(false);
  }, [location]);

  useEffect(() => {
    void load();
  }, [load]);

  const refetch = useCallback(async () => {
    if (!location) return;
    setIsLoading(true);
    const fresh = await getWeather(location.latitude, location.longitude);
    setData(fresh);
    setIsLoading(false);
    return { data: fresh };
  }, [location]);

  return { data, isLoading, refetch };
}
