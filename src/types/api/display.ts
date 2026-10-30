/**
 * Processed, display-ready structures stored in the TanStack Query cache.
 *
 * The page-data shapes are defined by `docs/API_communication_spec.md`
 * ("Megjelnítendő adatok"). Pages read these directly and never re-run the
 * full response processing.
 */

import type { MediaDateRange } from "@/types/filters";

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

/** One news article; `Date` is an ISO date (`YYYY-MM-DD`). */
export type MediaArticle = {
  Date: string;
  SourceName: string;
  CategoryName: string;
  Title: string;
  URL: string;
};

/**
 * Cached Media Analytics result: the articles of the date range, and the
 * range itself. With `keepPreviousData` the page may show this result while
 * another range loads, so the data must say which range it belongs to.
 */
export type MediaAnalyticsData = {
  range: MediaDateRange;
  rows: MediaArticle[];
};

/**
 * Data of one Media Analytics chart, derived on the frontend.
 * The three arrays are element-aligned: `names[i]` has `totals[i]` articles in
 * the date range and `highlighted[i]` of them match the active cross-filter.
 * Order follows `totals` (descending, ties by name), so it does not change
 * when a cross-filter is set. `highlighted` is `null` without a cross-filter.
 */
export type MediaChartSeries = {
  names: string[];
  totals: number[];
  highlighted: number[] | null;
};

export type MediaChartData = {
  /** articles per category. */
  categories: MediaChartSeries;
  /** articles per source. */
  sources: MediaChartSeries;
};

//**Data for one prediction series */
export type PredictionSeries = {
  dates: string[];
  predictedRate: number[];
  lowerBound: number[];
  upperBound: number[];
};

//**Data for one prediction API data with full history and all predictions */
export type PredictionsData = {
  baseCurrency: string;
  targetCurrency: string;
  history: {date: string[], rate:number[]};
  modes: string[];
  byMode: Record<string, PredictionSeries>;
}

