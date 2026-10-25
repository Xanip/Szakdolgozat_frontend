import { hashKey } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import { apiClient, ENDPOINTS, serializeQueryParams } from "@/lib/api/client";
import {
  buildDailyHeatmapParams,
  buildFxPerformanceParams,
  buildMediaFilteredParams,
  buildMediaMainParams,
  getResultRole,
  queryKeys,
} from "@/lib/api/queryKeys";

describe("query keys", () => {
  it("FX Performance key holds the requested params with ToDate always null", () => {
    const params = buildFxPerformanceParams({
      baseCurrency: "USD",
      targetCurrency: "HUF",
      startDate: "2026-08-01",
    });
    expect(queryKeys.fxPerformance(params)).toEqual([
      "FX_performance",
      {
        BaseCurrency: "USD",
        TargetCurrency: "HUF",
        StartDate: "2026-08-01",
        ToDate: null,
      },
    ]);
  });

  it("FX Performance params are null until both currencies are chosen", () => {
    expect(
      buildFxPerformanceParams({ baseCurrency: "USD", targetCurrency: null, startDate: null }),
    ).toBeNull();
  });

  it("different currency pairs produce different keys", () => {
    const usdHuf = queryKeys.fxPerformance(
      buildFxPerformanceParams({ baseCurrency: "USD", targetCurrency: "HUF", startDate: null }),
    );
    const eurHuf = queryKeys.fxPerformance(
      buildFxPerformanceParams({ baseCurrency: "EUR", targetCurrency: "HUF", startDate: null }),
    );
    expect(hashKey(usdHuf)).not.toBe(hashKey(eurHuf));
  });

  it("Daily Heatmap key keeps currency order; empty selection means full heatmap", () => {
    expect(queryKeys.dailyHeatmap(buildDailyHeatmapParams({ currencies: ["HUF", "USD", "EUR"] })))
      .toEqual(["Daily_heatmap", { Currencies: ["HUF", "USD", "EUR"] }]);
    expect(buildDailyHeatmapParams({ currencies: null })).toEqual({ Currencies: null });
    expect(buildDailyHeatmapParams({ currencies: [] })).toEqual({ Currencies: null });
    expect(
      hashKey(queryKeys.dailyHeatmap({ Currencies: ["HUF", "USD"] })),
    ).not.toBe(hashKey(queryKeys.dailyHeatmap({ Currencies: ["USD", "HUF"] })));
  });

  it("Media Analytics main and cross-filtered requests use separate keys", () => {
    const filters = {
      startDate: "2026-08-01",
      toDate: "2026-10-01",
      crossFilter: { kind: "source" as const, value: "YAHOO ENTERTAINMENT" },
    };
    const main = queryKeys.mediaAnalytics(buildMediaMainParams(filters));
    const filtered = queryKeys.mediaAnalytics(buildMediaFilteredParams(filters));

    expect(main).toEqual([
      "Media_analytics",
      {
        StartDate: "2026-08-01",
        ToDate: "2026-10-01",
        SourceFilter: null,
        CategoryFilter: null,
        IncludeMain: true,
      },
    ]);
    expect(filtered).toEqual([
      "Media_analytics",
      {
        StartDate: "2026-08-01",
        ToDate: "2026-10-01",
        SourceFilter: "YAHOO ENTERTAINMENT",
        CategoryFilter: null,
        IncludeMain: false,
      },
    ]);
    expect(getResultRole(main)).toBe("mediaMain");
    expect(getResultRole(filtered)).toBe("mediaFiltered");
  });

  it("a category cross-filter sets only CategoryFilter", () => {
    const params = buildMediaFilteredParams({
      startDate: "2026-08-01",
      toDate: "2026-10-01",
      crossFilter: { kind: "category", value: "Inflation" },
    });
    expect(params).toMatchObject({ SourceFilter: null, CategoryFilter: "Inflation" });
    expect(
      buildMediaFilteredParams({ startDate: "2026-08-01", toDate: "2026-10-01", crossFilter: null }),
    ).toBeNull();
  });

  it("maps keys to roles; idle keys are untracked", () => {
    expect(getResultRole(queryKeys.fxPerformance(null))).toBeNull();
    expect(getResultRole(queryKeys.dimensions())).toBeNull();
    expect(getResultRole(queryKeys.dailyHeatmap({ Currencies: null }))).toBe("dailyHeatmap");
  });
});

describe("request serialization", () => {
  it("repeats array params and omits null values", () => {
    expect(serializeQueryParams({ Currencies: ["HUF", "USD", "EUR"] })).toBe(
      "Currencies=HUF&Currencies=USD&Currencies=EUR",
    );
    expect(serializeQueryParams({ Currencies: null })).toBe("");
    expect(
      serializeQueryParams({
        BaseCurrency: "USD",
        TargetCurrency: "HUF",
        StartDate: "2026-08-01",
        ToDate: null,
      }),
    ).toBe("BaseCurrency=USD&TargetCurrency=HUF&StartDate=2026-08-01");
  });

  it("encodes booleans and names with spaces or slashes", () => {
    expect(
      serializeQueryParams({
        StartDate: "2026-08-01",
        ToDate: "2026-10-01",
        SourceFilter: "YAHOO ENTERTAINMENT",
        CategoryFilter: null,
        IncludeMain: false,
      }),
    ).toBe(
      "StartDate=2026-08-01&ToDate=2026-10-01&SourceFilter=YAHOO+ENTERTAINMENT&IncludeMain=false",
    );
    expect(new URLSearchParams(serializeQueryParams({ SourceFilter: "/FILM" })).get("SourceFilter"))
      .toBe("/FILM");
  });

  it("the Axios client prefixes /api and uses the central serializer", () => {
    expect(
      apiClient.getUri({
        url: ENDPOINTS.dailyHeatmap,
        params: { Currencies: ["HUF", "USD"] },
      }),
    ).toBe("/api/exchange-rates/pages/Daily_heatmap?Currencies=HUF&Currencies=USD");
    expect(apiClient.getUri({ url: ENDPOINTS.dimensions })).toBe("/api/exchange-rates/pages");
  });
});
