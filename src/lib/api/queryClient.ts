import { QueryCache, QueryClient } from "@tanstack/react-query";

import {
  handleQueryError,
  handleQuerySuccess,
  type ActiveResultRegistry,
} from "@/lib/api/activeResult";

/**
 * Creates the application QueryClient.
 *
 * Retention is explicit (see `activeResult.ts`), so time-based behavior is
 * turned off:
 * - `gcTime: Infinity` – unobserved results (user is on another page) are not
 *   garbage-collected; they stay until replaced by a newer active result.
 * - `staleTime: Infinity` + no focus/reconnect refetch – returning to a page
 *   shows cached data immediately without refetching.
 * - `retry: false` – errors surface at once; the user retries explicitly
 *   (Retry button / F5). Invalid responses would fail identically on retry.
 */
export function createAppQueryClient(registry: ActiveResultRegistry): QueryClient {
  const queryCache: QueryCache = new QueryCache({
    onSuccess: (_data, query) => handleQuerySuccess(queryCache, registry, query),
    onError: (_error, query) => handleQueryError(queryCache, registry, query),
  });

  return new QueryClient({
    queryCache,
    defaultOptions: {
      queries: {
        staleTime: Infinity,
        gcTime: Infinity,
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
    },
  });
}
