import { useCallback, useContext, useSyncExternalStore } from "react";

import { AppDataContext, type AppData } from "@/lib/appData";
import type { DebouncedState } from "@/lib/filters/debouncedState";
import type { ImmediateState } from "@/lib/filters/immediateState";
import {
  toggleMediaCrossFilter,
  withMediaDateRange,
} from "@/lib/filters/pageFilters";
import type { FxPerformanceFilters, MediaCrossFilter } from "@/types/filters";

export function useAppData(): AppData {
  const appData = useContext(AppDataContext);
  if (!appData) {
    throw new Error("useAppData must be used inside <AppDataProvider>.");
  }
  return appData;
}

/** Latest (not yet debounced) filter values, for the filter controls. */
export function useDraftFilters<T>(state: DebouncedState<T>): T {
  return useSyncExternalStore(state.subscribe, state.getDraft);
}

/** Debounced filter values that the page's API request is built from. */
export function useCommittedFilters<T>(state: DebouncedState<T>): T {
  return useSyncExternalStore(state.subscribe, state.getCommitted);
}

export function useFxPerformanceFilters() {
  const store = useAppData().filters.fxPerformance;
  const filters = useDraftFilters(store);
  const setFilters = useCallback(
    (patch: Partial<FxPerformanceFilters>) =>
      store.update((current) => ({ ...current, ...patch })),
    [store],
  );
  return { filters, setFilters };
}

export function useDailyHeatmapFilters() {
  const store = useAppData().filters.dailyHeatmap;
  const filters = useDraftFilters(store);
  const setCurrencies = useCallback(
    (currencies: readonly string[] | null) =>
      store.update((current) => ({ ...current, currencies })),
    [store],
  );
  return { filters, setCurrencies };
}

/** Current value of an immediate (non-debounced) filter store. */
export function useImmediateFilter<T>(state: ImmediateState<T>): T {
  return useSyncExternalStore(state.subscribe, state.get);
}

/**
 * Media Analytics filters: the debounced date range (draft, for the date
 * controls) and the stored immediate cross-filter. Pages should use
 * `useMediaAnalyticsView`, which applies the cross-filter only to the data it
 * was picked from.
 */
export function useMediaAnalyticsFilters() {
  const stores = useAppData().filters;
  const filters = useDraftFilters(stores.mediaAnalytics);
  const crossFilter = useImmediateFilter(stores.mediaCrossFilter);
  const setDateRange = useCallback(
    (startDate: string | null, toDate: string | null) =>
      stores.mediaAnalytics.update((current) =>
        withMediaDateRange(current, startDate, toDate),
      ),
    [stores],
  );
  const toggleCrossFilter = useCallback(
    (clicked: MediaCrossFilter) =>
      stores.mediaCrossFilter.update((current) =>
        toggleMediaCrossFilter(current, clicked),
      ),
    [stores],
  );
  return { filters, setDateRange, crossFilter, toggleCrossFilter };
}
