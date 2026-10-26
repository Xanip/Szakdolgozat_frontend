import type { ActiveResultRegistry } from "@/lib/api/activeResult";
import {
  buildDailyHeatmapParams,
  buildFxPerformanceParams,
  buildMediaFilteredParams,
  buildMediaMainParams,
  queryKeys,
} from "@/lib/api/queryKeys";
import {
  createDebouncedState,
  type DebouncedState,
} from "@/lib/filters/debouncedState";
import type {
  DailyHeatmapFilters,
  FxPerformanceFilters,
  MediaAnalyticsFilters,
  MediaCrossFilter,
} from "@/types/filters";

/**
 * Initial debounce for filter changes before a request starts. Not final per
 * the Spec; tune it after usability checks.
 */
export const DEFAULT_FILTER_DEBOUNCE_MS = 300;

export const INITIAL_FX_PERFORMANCE_FILTERS: FxPerformanceFilters = {
  baseCurrency: null,
  targetCurrency: null,
  startDate: null,
  toDate: null,
};

export const INITIAL_DAILY_HEATMAP_FILTERS: DailyHeatmapFilters = {
  currencies: null,
};

export const INITIAL_MEDIA_ANALYTICS_FILTERS: MediaAnalyticsFilters = {
  startDate: null,
  toDate: null,
  crossFilter: null,
};

export type PageFilterStores = {
  fxPerformance: DebouncedState<FxPerformanceFilters>;
  dailyHeatmap: DebouncedState<DailyHeatmapFilters>;
  mediaAnalytics: DebouncedState<MediaAnalyticsFilters>;
};

export type PageFilterOptions = {
  delayMs?: number;
  initial?: {
    fxPerformance?: FxPerformanceFilters;
    dailyHeatmap?: DailyHeatmapFilters;
    mediaAnalytics?: MediaAnalyticsFilters;
  };
};

/**
 * Creates the per-page filter state, owned by the app-level provider (not by
 * the pages). Each commit marks the matching query key as the active result
 * of its role, so a late response for older filters can never become active.
 */
export function createPageFilterStores(
  registry: ActiveResultRegistry,
  options: PageFilterOptions = {},
): PageFilterStores {
  const delayMs = options.delayMs ?? DEFAULT_FILTER_DEBOUNCE_MS;

  const activateFx = (filters: FxPerformanceFilters) => {
    const params = buildFxPerformanceParams(filters);
    registry.setActive(
      "fxPerformance",
      params ? queryKeys.fxPerformance(params) : null,
    );
  };

  const activateHeatmap = (filters: DailyHeatmapFilters) => {
    registry.setActive(
      "dailyHeatmap",
      queryKeys.dailyHeatmap(buildDailyHeatmapParams(filters)),
    );
  };

  const activateMedia = (filters: MediaAnalyticsFilters) => {
    const main = buildMediaMainParams(filters);
    const filtered = buildMediaFilteredParams(filters);
    registry.setActive("mediaMain", main ? queryKeys.mediaAnalytics(main) : null);
    registry.setActive(
      "mediaFiltered",
      filtered ? queryKeys.mediaAnalytics(filtered) : null,
    );
  };

  const fxInitial = options.initial?.fxPerformance ?? INITIAL_FX_PERFORMANCE_FILTERS;
  const heatmapInitial =
    options.initial?.dailyHeatmap ?? INITIAL_DAILY_HEATMAP_FILTERS;
  const mediaInitial =
    options.initial?.mediaAnalytics ?? INITIAL_MEDIA_ANALYTICS_FILTERS;

  activateFx(fxInitial);
  activateHeatmap(heatmapInitial);
  activateMedia(mediaInitial);

  return {
    fxPerformance: createDebouncedState(fxInitial, {
      delayMs,
      onCommit: activateFx,
    }),
    dailyHeatmap: createDebouncedState(heatmapInitial, {
      delayMs,
      onCommit: activateHeatmap,
    }),
    mediaAnalytics: createDebouncedState(mediaInitial, {
      delayMs,
      onCommit: activateMedia,
    }),
  };
}

/**
 * New Media Analytics date range. A cross-filter always refers to the main
 * data it was picked from, so changing the dates clears it.
 */
export function withMediaDateRange(
  filters: MediaAnalyticsFilters,
  startDate: string | null,
  toDate: string | null,
): MediaAnalyticsFilters {
  if (filters.startDate === startDate && filters.toDate === toDate) {
    return filters;
  }
  return { startDate, toDate, crossFilter: null };
}

/** Sets (or clears) the single Source-or-Category cross-filter. */
export function withMediaCrossFilter(
  filters: MediaAnalyticsFilters,
  crossFilter: MediaCrossFilter | null,
): MediaAnalyticsFilters {
  const current = filters.crossFilter;
  if (
    current === crossFilter ||
    (current !== null &&
      crossFilter !== null &&
      current.kind === crossFilter.kind &&
      current.value === crossFilter.value)
  ) {
    return filters;
  }
  return { ...filters, crossFilter };
}
