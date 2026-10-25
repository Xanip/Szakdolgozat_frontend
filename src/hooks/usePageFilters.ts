import { useCallback, useContext, useSyncExternalStore } from "react";

import { AppDataContext, type AppData } from "@/lib/appData";
import type { DebouncedState } from "@/lib/filters/debouncedState";
import {
  withMediaCrossFilter,
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

export function useMediaAnalyticsFilters() {
  const store = useAppData().filters.mediaAnalytics;
  const filters = useDraftFilters(store);
  const setDateRange = useCallback(
    (startDate: string | null, toDate: string | null) =>
      store.update((current) => withMediaDateRange(current, startDate, toDate)),
    [store],
  );
  const setCrossFilter = useCallback(
    (crossFilter: MediaCrossFilter | null) =>
      store.update((current) => withMediaCrossFilter(current, crossFilter)),
    [store],
  );
  return { filters, setDateRange, setCrossFilter };
}
