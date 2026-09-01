import { QueryClient } from '@tanstack/react-query';

import { isApiError } from './errors';

/**
 * Server-state defaults, tuned for rural Zimbabwean connectivity.
 *
 * The assumptions behind the library's defaults — cheap, fast, always-on
 * network — do not hold here. Data is kept longer, refetched less eagerly, and
 * retried only when retrying could actually help.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data stays usable for a minute before a refetch is considered.
        staleTime: 60_000,
        // And stays in cache for a day, so reopening the app on a train shows
        // the last known state instead of a spinner.
        gcTime: 24 * 60 * 60 * 1000,

        retry: (failureCount, error) => {
          // Retrying a 403 or a validation failure just burns a metered
          // connection: the answer will not change.
          if (isApiError(error) && !error.retryable) return false;
          return failureCount < 2;
        },
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),

        // Refetching on every focus is expensive on mobile data; the staleTime
        // above already covers genuinely old data.
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        // Mutations are never retried automatically. A retried payment or order
        // is a duplicate, and only the caller knows whether that is safe.
        retry: false,
      },
    },
  });
}
