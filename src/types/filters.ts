/**
 * Per-page filter values (the data used for filtering, not filter
 * components). Pages never share filters, even for the same kind of data.
 *
 * `null` means "not selected yet"; default values are left to the individual
 * page specifications.
 */

export type FxPerformanceFilters = {
  baseCurrency: string | null;
  targetCurrency: string | null;
  /** ISO date (`YYYY-MM-DD`). `ToDate` is always `null` for this page. */
  startDate: string | null;
};

export type DailyHeatmapFilters = {
  /** Column currencies in display order; `null` requests the full heatmap. */
  currencies: readonly string[] | null;
};

/** Media Analytics cross-filter: Source and Category are mutually exclusive. */
export type MediaCrossFilter = {
  kind: "source" | "category";
  value: string;
};

export type MediaAnalyticsFilters = {
  /** ISO dates (`YYYY-MM-DD`). */
  startDate: string | null;
  toDate: string | null;
  crossFilter: MediaCrossFilter | null;
};
