/**
 * Processed, display-ready structures stored in the TanStack Query cache.
 *
 * The page-data shapes are defined by `docs/API_communication_spec.md`
 * ("Megjelnítendő adatok"). Pages read these directly and never re-run the
 * full response processing.
 */

/** Filter option data derived from GET /exchange-rates/pages. */
export type DimensionData = {
  currencies: {
    id: number;
    code: string;
    name: string | null;
    symbol: string | null;
  }[];
  sources: { id: number; name: string }[];
  categories: { id: number; name: string }[];
  authors: { id: number; name: string }[];
};

export type FxPerformanceData = {
  kpi: {
    previousDayRate: number | null;
    changeSinceYesterday: number | null;
    todaysRate: number | null;
    firstRateInPeriod: number | null;
    changeSincePeriod: number | null;
  };
  charts: {
    lineChart_X: string[] | null;
    lineChart_Y_data: number[] | null;
    waterfallVarianceChart_X: string[] | null;
    waterfallVarianceChart_Y_data: number[] | null;
  };
};

export type DailyHeatmapData = {
  kpi: {
    currentDay: string | null;
  };
  charts: {
    /** Column order of `matrics_data`. */
    X_FilterCurrencies: string[] | null;
    /** Row order of `matrics_data`. */
    Y_AllCurrencies: string[] | null;
    /** `matrics_data[row][column]`, rows follow `Y_AllCurrencies`. */
    matrics_data: (number | null)[][];
  };
};

/** Column order of each `MediaAnalyticsData.charts.tableData` row. */
export const MEDIA_TABLE_COLUMNS = [
  "Date",
  "SourceName",
  "CategoryName",
  "Title",
  "URL",
] as const;

export type MediaAnalyticsData = {
  charts: {
    /** Rows ordered as `MEDIA_TABLE_COLUMNS`. */
    tableData: (string | null)[][];
    categoriesName: string[] | null;
    categoriesData: number[] | null;
    sourcesName: string[] | null;
    sourcesData: number[] | null;
  };
};
