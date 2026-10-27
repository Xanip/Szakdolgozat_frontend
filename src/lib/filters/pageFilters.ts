import type { ActiveResultRegistry } from "@/lib/api/activeResult";
import {
  buildDailyHeatmapParams,
  buildFxPerformanceParams,
  buildMediaAnalyticsParams,
  queryKeys,
} from "@/lib/api/queryKeys";
import {
  createDebouncedState,
  type DebouncedState,
} from "@/lib/filters/debouncedState";
import {
  createImmediateState,
  type ImmediateState,
} from "@/lib/filters/immediateState";
import type {
  DailyHeatmapFilters,
  FxPerformanceFilters,
  MediaAnalyticsFilters,
  MediaCrossFilter,
  MediaDateRange,
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
};

export type PageFilterStores = {
  fxPerformance: DebouncedState<FxPerformanceFilters>;
  dailyHeatmap: DebouncedState<DailyHeatmapFilters>;
  /** Date range: debounced, drives the Media Analytics request. */
  mediaAnalytics: DebouncedState<MediaAnalyticsFilters>;
  /** Cross-filter: applies immediately, never starts a request. */
  mediaCrossFilter: ImmediateState<MediaCrossFilter | null>;
};

export type PageFilterOptions = {
  delayMs?: number;
  initial?: {
    fxPerformance?: FxPerformanceFilters;
    dailyHeatmap?: DailyHeatmapFilters;
    mediaAnalytics?: MediaAnalyticsFilters;
    mediaCrossFilter?: MediaCrossFilter | null;
  };
};

/**
 * Creates the per-page filter state, owned by the app-level provider (not by
 * the pages). Each commit of a debounced store marks the matching query key
 * as the active result of its role, so a late response for older filters can
 * never become active. The cross-filter store has no commit hook: it is not
 * part of any query key. It is cleared only when data for another date range
 * arrives (`clearStaleMediaCrossFilter`, wired in `createAppData`).
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
    const params = buildMediaAnalyticsParams(filters);
    registry.setActive(
      "mediaAnalytics",
      params ? queryKeys.mediaAnalytics(params) : null,
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
    mediaCrossFilter: createImmediateState(
      options.initial?.mediaCrossFilter ?? null,
    ),
  };
}

/** New Media Analytics date range; unchanged dates keep the same object. */
export function withMediaDateRange(
  filters: MediaAnalyticsFilters,
  startDate: string | null,
  toDate: string | null,
): MediaAnalyticsFilters {
  if (filters.startDate === startDate && filters.toDate === toDate) {
    return filters;
  }
  return { startDate, toDate };
}

export function sameMediaRange(a: MediaDateRange, b: MediaDateRange): boolean {
  return a.startDate === b.startDate && a.toDate === b.toDate;
}

function sameCrossFilter(a: MediaCrossFilter, b: MediaCrossFilter): boolean {
  return (
    a.kind === b.kind && a.value === b.value && sameMediaRange(a.range, b.range)
  );
}

/**
 * Chart click: selecting the active element again clears the cross-filter,
 * any other element replaces it (Source and Category exclude each other).
 */
export function toggleMediaCrossFilter(
  current: MediaCrossFilter | null,
  clicked: MediaCrossFilter,
): MediaCrossFilter | null {
  return current !== null && sameCrossFilter(current, clicked) ? null : clicked;
}

/**
 * The cross-filter that applies to the displayed data: only one picked from
 * this very data (same date range). Display never depends on when a stale
 * filter is removed from the store.
 */
export function effectiveMediaCrossFilter(
  stored: MediaCrossFilter | null,
  dataRange: MediaDateRange | null,
): MediaCrossFilter | null {
  return stored !== null && dataRange !== null && sameMediaRange(stored.range, dataRange)
    ? stored
    : null;
}

/**
 * New Media Analytics data became the active result: a cross-filter picked
 * from data of another date range no longer applies and is removed. Changing
 * the date controls alone (e.g. changing and reverting them within the
 * debounce) never clears it; a refetch of the same range keeps it.
 */
export function clearStaleMediaCrossFilter(
  store: ImmediateState<MediaCrossFilter | null>,
  newDataRange: MediaDateRange,
): void {
  store.update((current) =>
    current !== null && !sameMediaRange(current.range, newDataRange) ? null : current,
  );
}
