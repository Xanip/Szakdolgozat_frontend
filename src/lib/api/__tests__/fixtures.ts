import type { HttpGet, QueryParams } from "@/lib/api/client";
import type {
  RawDailyHeatmapResponse,
  RawDimensionsResponse,
  RawFxPerformanceResponse,
  RawMediaAnalyticsResponse,
  RawMediaDataset,
} from "@/types/api/raw";

/* Valid payloads shaped like the documented backend responses (docs/*_JSON.md). */

export function rawDimensions(): RawDimensionsResponse {
  return {
    DimAuthors: [{ AuthorID: 1, AuthorName: "UNKNOWN" }],
    DimCategories: [{ CategoryID: 19, CategoryName: "Artificial Intelligence" }],
    DimCurrencies: [
      {
        CurrencyID: 1,
        CurrencyCode: "ADP",
        CurrencyName: "Andorran Peseta",
        CurrencySymbol: "ADP",
      },
      { CurrencyID: 2, CurrencyCode: "XXX", CurrencyName: null, CurrencySymbol: null },
    ],
    DimSources: [{ SourceID: 24, SourceName: "/FILM" }],
  };
}

/** `seed` makes payloads for different requests distinguishable. */
export function rawFx(seed = 1): RawFxPerformanceResponse {
  return {
    todaysRate: 324.3 * seed,
    previousDayRate: 322.8 * seed,
    firstRateInPeriod: 316.3 * seed,
    changeSinceYesteray: 0.0045 * seed,
    changeSinceTheStartOfPeriod: 0.025 * seed,
    exchangeRateChart: {
      lineChart_X: ["2026-08-01", "2026-08-02"],
      lineChart_Y: [316.3 * seed, 316.2 * seed],
    },
    waterfallVarianceChart: {
      waterfallVarianceChart_X: ["2026-09", "2026-10"],
      waterfallVarianceChart_Y: [2.86 * seed, 7.62 * seed],
    },
  };
}

export function rawHeatmap(
  columns: string[] = ["HUF", "USD", "EUR"],
): RawDailyHeatmapResponse {
  const rows = ["ADP", "AED", "HUF"];
  return {
    calculation_date: "2026-10-25",
    x_data: columns,
    y_data: rows,
    // Cell value encodes its position: row * 10 + column.
    data: rows.map((_, row) =>
      columns.map((_, column) => (row === 0 ? null : row * 10 + column)),
    ),
  };
}

export function rawMediaDataset(label = "SYNTHETIC"): RawMediaDataset {
  return {
    table: [
      {
        Date: "2026-08-01",
        SourceName: label,
        CategoryName: "Inflation",
        Title: `${label} title`,
        URL: "https://synthetic-news.example/2026/08/01/article-0001",
      },
    ],
    by_category: [
      { Name: "Economic Recession", Count: 12 },
      { Name: "Inflation", Count: 3 },
    ],
    by_source: [
      { Name: label, Count: 15 },
      { Name: "YAHOO ENTERTAINMENT", Count: 4 },
    ],
  };
}

export function rawMediaMain(label = "MAIN"): RawMediaAnalyticsResponse {
  return { main: rawMediaDataset(label), filtered: null };
}

export function rawMediaFiltered(label = "FILTERED"): RawMediaAnalyticsResponse {
  return { main: null, filtered: rawMediaDataset(label) };
}

export type PendingRequest = {
  path: string;
  params: QueryParams | undefined;
  resolve: (body: unknown) => void;
  reject: (error: unknown) => void;
};

/**
 * Transport whose responses are resolved manually by the test, to control
 * the order in which concurrent requests finish.
 */
export function createControlledHttp() {
  const requests: PendingRequest[] = [];
  const http: HttpGet = (path, params) =>
    new Promise((resolve, reject) => {
      requests.push({ path, params, resolve, reject });
    });

  /** Finds the latest request whose params contain `match`. */
  const find = (match: Record<string, unknown>): PendingRequest => {
    const found = [...requests]
      .reverse()
      .find((request) =>
        Object.entries(match).every(
          ([name, value]) =>
            JSON.stringify(request.params?.[name]) === JSON.stringify(value),
        ),
      );
    if (!found) throw new Error(`No request matching ${JSON.stringify(match)}`);
    return found;
  };

  return { http, requests, find };
}

/** Lets pending promise chains and TanStack Query's notify tick run. */
export async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}
