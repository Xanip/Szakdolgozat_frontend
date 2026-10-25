import { createContext } from "react";
import type { QueryClient } from "@tanstack/react-query";

import {
  createActiveResultRegistry,
  type ActiveResultRegistry,
} from "@/lib/api/activeResult";
import { createAppQueryClient } from "@/lib/api/queryClient";
import {
  createPageFilterStores,
  type PageFilterOptions,
  type PageFilterStores,
} from "@/lib/filters/pageFilters";

/**
 * App-wide data state that lives above the routed pages: the query cache and
 * the per-page filters. Pages only read from it, so unmounting a page never
 * loses its filters or results.
 */
export type AppData = {
  queryClient: QueryClient;
  registry: ActiveResultRegistry;
  filters: PageFilterStores;
};

export function createAppData(options?: PageFilterOptions): AppData {
  const registry = createActiveResultRegistry();
  return {
    registry,
    queryClient: createAppQueryClient(registry),
    filters: createPageFilterStores(registry, options),
  };
}

export const AppDataContext = createContext<AppData | null>(null);
