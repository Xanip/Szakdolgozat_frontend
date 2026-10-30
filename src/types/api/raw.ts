/**
 * Raw backend response types.
 *
 * These mirror the JSON actually produced by the FastAPI backend
 * (`src/szakdolgozat_backend/api/pagesData.py` and `response_models/*`).
 * They are only ever assigned after runtime validation; network data is
 * `unknown` until then. Do not "fix" field names here: the backend contract is
 * the source of truth (e.g. `changeSinceYesteray` is intentionally misspelled).
 */

/** GET /exchange-rates/pages */
export type RawDimAuthor = {
  AuthorID: number;
  AuthorName: string;
};

export type RawDimCategory = {
  CategoryID: number;
  CategoryName: string;
};

/** `CurrencyName` and `CurrencySymbol` are nullable columns in DimCurrency. */
export type RawDimCurrency = {
  CurrencyID: number;
  CurrencyCode: string;
  CurrencyName: string | null;
  CurrencySymbol: string | null;
};

export type RawDimSource = {
  SourceID: number;
  SourceName: string;
};

export type RawDimensionsResponse = {
  DimAuthors: RawDimAuthor[];
  DimCategories: RawDimCategory[];
  DimCurrencies: RawDimCurrency[];
  DimSources: RawDimSource[];
};

/** GET /exchange-rates/pages/FX_performance */
export type RawFxPerformanceResponse = {
  todaysRate: number | null;
  previousDayRate: number | null;
  firstRateInPeriod: number | null;
  /** Misspelled in the backend contract; mapped to `changeSinceYesterday`. */
  changeSinceYesteray: number | null;
  changeSinceTheStartOfPeriod: number | null;
  exchangeRateChart: {
    lineChart_X: string[];
    lineChart_Y: number[];
  };
  waterfallVarianceChart: {
    waterfallVarianceChart_X: string[];
    waterfallVarianceChart_Y: number[];
  };
};

/** GET "/exchange-rates/pages/Prediction" */
export type RawPredictionResponse = {
  baseCurrency: string;
  targetCurrency: string;
  history: RawHistoryPoint[];
  predictions: Record<string, RawPredictionPoint[]>;
};

export type RawHistoryPoint ={
  date: string,
  rate: number,
}

export type RawPredictionPoint ={
  date: string;
  predictedRate: number;
  lowerBound: number;
  upperBound: number;
}

/** GET /exchange-rates/pages/Daily_heatmap */
export type RawDailyHeatmapResponse = {
  calculation_date: string | null;
  /** Column currencies (the requested `Currencies`, in column order). */
  x_data: string[];
  /** Row currencies (all currencies, in row order). */
  y_data: string[];
  /** Row-major matrix: `data[row][column]`, `y_data.length` x `x_data.length`. */
  data: (number | null)[][];
};

/**
 * GET /exchange-rates/pages/Media_analytics?StartDate=…&ToDate=…
 *
 * One news article. Every field is a required string (`MediaTableRow` in
 * `response_models/mediaResponses.py`); `Date` is an ISO date (`YYYY-MM-DD`).
 */
export type RawMediaTableRow = {
  Date: string;
  SourceName: string;
  CategoryName: string;
  Title: string;
  URL: string;
};

/**
 * The backend returns only the articles of the date range; chart data is
 * computed on the frontend (`lib/media/mediaCharts.ts`).
 */
export type RawMediaAnalyticsResponse = {main: {table: RawMediaTableRow[];};};