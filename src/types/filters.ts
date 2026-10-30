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
  /** ISO date (`YYYY-MM-DD`). */
  startDate: string | null;
  toDate: string | null;
};

export type DailyHeatmapFilters = {
  /** Column currencies in display order; `null` requests the full heatmap. */
  currencies: readonly string[] | null;
};

/** Media Analytics main filter: the only values sent to the backend. */
export type MediaAnalyticsFilters = {
  /** ISO dates (`YYYY-MM-DD`). */
  startDate: string | null;
  toDate: string | null;
};

/** Date range a Media Analytics result was loaded for (ISO dates). */
export type MediaDateRange = {
  startDate: string;
  toDate: string;
};

/** A chart element the user clicked: one Source or one Category. */
export type MediaCrossSelection = {
  kind: "source" | "category";
  value: string;
};

/**
 * Media Analytics cross-filter: Source and Category are mutually exclusive.
 * `range` is the date range of the data it was picked from: the filter only
 * applies to that data and is cleared when data for another range arrives.
 */
export type MediaCrossFilter = MediaCrossSelection & {
  range: MediaDateRange;
};

export type PredictionFilters = {
  baseCurrency: string | null;
  targetCurrency: string | null;
  /**
   * Internal, client-side filter: which prediction model the chart shows.
   */
  predictionMode: string | null;
};
