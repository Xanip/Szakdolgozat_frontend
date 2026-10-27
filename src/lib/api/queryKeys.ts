import type { QueryKey } from "@tanstack/react-query";

import { isRecord } from "@/lib/api/validators/guards";
import type {
  DailyHeatmapFilters,
  FxPerformanceFilters,
  MediaAnalyticsFilters,
  MediaDateRange,
} from "@/types/filters";

/*
 * Request parameters exactly as sent to the backend. Query keys embed these
 * objects unchanged, so a key always describes the actually requested data.
 */

export type FxPerformanceParams = {
  BaseCurrency: string;
  TargetCurrency: string;
  StartDate: string | null;
  ToDate: string | null;
};

export type DailyHeatmapParams = {
  Currencies: readonly string[] | null;
};

export type MediaAnalyticsParams = {
  StartDate: string;
  ToDate: string;
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
    ToDate: filters.toDate,
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

/** Builds Media Analytics params; `null` until both dates are set. */
export function buildMediaAnalyticsParams(
  filters: MediaAnalyticsFilters,
): MediaAnalyticsParams | null {
  if (!filters.startDate || !filters.toDate) return null;
  return { StartDate: filters.startDate, ToDate: filters.toDate };
}

/** The date range of a (non-idle) Media Analytics key, else `null`. */
export function getMediaDateRange(queryKey: QueryKey): MediaDateRange | null {
  const [scope, params] = queryKey;
  if (scope !== "Media_analytics" || !isRecord(params)) return null;
  const { StartDate, ToDate } = params;
  return typeof StartDate === "string" && typeof ToDate === "string"
    ? { startDate: StartDate, toDate: ToDate }
    : null;
}

/** Display roles; each page keeps exactly one active result. */
export type ResultRole = "fxPerformance" | "dailyHeatmap" | "mediaAnalytics";

const ROLE_BY_SCOPE: Readonly<Record<string, ResultRole>> = {
  FX_performance: "fxPerformance",
  Daily_heatmap: "dailyHeatmap",
  Media_analytics: "mediaAnalytics",
};

/** Derives the role from a query key; `null` for untracked/idle keys. */
export function getResultRole(queryKey: QueryKey): ResultRole | null {
  const [scope, params] = queryKey;
  if (typeof scope !== "string" || !isRecord(params)) return null;
  return Object.hasOwn(ROLE_BY_SCOPE, scope) ? ROLE_BY_SCOPE[scope] : null;
}
