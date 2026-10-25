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

/** GET /exchange-rates/pages/Media_analytics */
export type RawMediaTableRow = {
  Date: string;
  SourceName: string;
  CategoryName: string;
  Title: string;
  URL: string;
};

export type RawMediaGroupCount = {
  Name: string;
  Count: number;
};

export type RawMediaDataset = {
  table: RawMediaTableRow[];
  by_category: RawMediaGroupCount[];
  by_source: RawMediaGroupCount[];
};

export type RawMediaAnalyticsResponse = {
  main: RawMediaDataset | null;
  filtered: RawMediaDataset | null;
};
