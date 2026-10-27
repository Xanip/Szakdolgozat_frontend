import {notifyManager,QueryCache,QueryClient,type QueryKey,} from "@tanstack/react-query";

import {handleQueryError,handleQuerySuccess,type ActiveResultRegistry,} from "@/lib/api/activeResult";
import type { ResultRole } from "@/lib/api/queryKeys";

export type AppQueryClientOptions = {
  /**
   * Called when a successful result became the active one of its role.
   * Scheduled on TanStack Query's notification tick, after the observers
   * (pages) were notified of the new data, so a reaction to it (e.g. clearing
   * a stale cross-filter) never renders before the new data.
   */
  onActiveSuccess?: (role: ResultRole, queryKey: QueryKey) => void;
};

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
export function createAppQueryClient(registry: ActiveResultRegistry,options: AppQueryClientOptions = {},): QueryClient {
  const queryCache: QueryCache = new QueryCache({
    onSuccess: (_data, query) => {
      const role = handleQuerySuccess(queryCache, registry, query);
      const { onActiveSuccess } = options;
      if (role !== null && onActiveSuccess) {
        const queryKey = query.queryKey;
        notifyManager.schedule(() => onActiveSuccess(role, queryKey));
      }
    },
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
