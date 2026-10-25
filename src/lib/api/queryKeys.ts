import type { QueryKey } from "@tanstack/react-query";

import { isRecord } from "@/lib/api/validators/guards";
import type {
  DailyHeatmapFilters,
  FxPerformanceFilters,
  MediaAnalyticsFilters,
} from "@/types/filters";

/*
 * Request parameters exactly as sent to the backend. Query keys embed these
 * objects unchanged, so a key always describes the actually requested data.
 */

export type FxPerformanceParams = {
  BaseCurrency: string;
  TargetCurrency: string;
  StartDate: string | null;
  /** Always `null` for the FX Performance page (see Spec). */
  ToDate: null;
};

export type DailyHeatmapParams = {
  Currencies: readonly string[] | null;
};

export type MediaAnalyticsParams = {
  StartDate: string;
  ToDate: string;
  SourceFilter: string | null;
  CategoryFilter: string | null;
  IncludeMain: boolean;
};

/**
 * Query keys. A `null` params slot is an idle placeholder used while a page
 * cannot build a request yet (e.g. no currency pair chosen); it is never
 * fetched and is not tracked by the active-result lifecycle.
 */
export const queryKeys = {
  dimensions: () => ["Dimensions"] as const,
  fxPerformance: (params: FxPerformanceParams | null) =>
    ["FX_performance", params] as const,
  dailyHeatmap: (params: DailyHeatmapParams | null) =>
    ["Daily_heatmap", params] as const,
  mediaAnalytics: (params: MediaAnalyticsParams | null) =>
    ["Media_analytics", params] as const,
};

/** Builds FX params; `null` until both currencies are selected. */
export function buildFxPerformanceParams(
  filters: FxPerformanceFilters,
): FxPerformanceParams | null {
  if (!filters.baseCurrency || !filters.targetCurrency) return null;
  return {
    BaseCurrency: filters.baseCurrency,
    TargetCurrency: filters.targetCurrency,
    StartDate: filters.startDate,
    ToDate: null,
  };
}

/**
 * Builds Daily Heatmap params. The page passes either selected currency codes
 * or nothing; an empty selection is normalized to `null` (full heatmap) so the
 * key matches what is actually requested.
 */
export function buildDailyHeatmapParams(
  filters: DailyHeatmapFilters,
): DailyHeatmapParams {
  const currencies = filters.currencies;
  return {
    Currencies: currencies && currencies.length > 0 ? [...currencies] : null,
  };
}

/** Main Media Analytics request: dates only, `IncludeMain=true`. */
export function buildMediaMainParams(
  filters: MediaAnalyticsFilters,
): MediaAnalyticsParams | null {
  if (!filters.startDate || !filters.toDate) return null;
  return {
    StartDate: filters.startDate,
    ToDate: filters.toDate,
    SourceFilter: null,
    CategoryFilter: null,
    IncludeMain: true,
  };
}

/**
 * Cross-filtered Media Analytics request: exactly one of Source/Category,
 * `IncludeMain=false`. `null` when there is no cross-filter.
 */
export function buildMediaFilteredParams(
  filters: MediaAnalyticsFilters,
): MediaAnalyticsParams | null {
  const crossFilter = filters.crossFilter;
  if (!filters.startDate || !filters.toDate || !crossFilter) return null;
  return {
    StartDate: filters.startDate,
    ToDate: filters.toDate,
    SourceFilter: crossFilter.kind === "source" ? crossFilter.value : null,
    CategoryFilter: crossFilter.kind === "category" ? crossFilter.value : null,
    IncludeMain: false,
  };
}

/**
 * Display roles that keep exactly one active result each. Media Analytics has
 * two roles (main + filtered), so the page keeps at most two results.
 */
export type ResultRole =
  | "fxPerformance"
  | "dailyHeatmap"
  | "mediaMain"
  | "mediaFiltered";

/** Derives the role from a query key; `null` for untracked/idle keys. */
export function getResultRole(queryKey: QueryKey): ResultRole | null {
  const [scope, params] = queryKey;
  if (!isRecord(params)) return null;
  switch (scope) {
    case "FX_performance":
      return "fxPerformance";
    case "Daily_heatmap":
      return "dailyHeatmap";
    case "Media_analytics":
      return params.IncludeMain === true ? "mediaMain" : "mediaFiltered";
    default:
      return null;
  }
}

/** Returns the `[StartDate, ToDate]` of a Media Analytics key, if any. */
export function getMediaDateRange(
  queryKey: QueryKey,
): readonly [unknown, unknown] | null {
  const params = queryKey[1];
  if (queryKey[0] !== "Media_analytics" || !isRecord(params)) return null;
  return [params.StartDate, params.ToDate];
}
