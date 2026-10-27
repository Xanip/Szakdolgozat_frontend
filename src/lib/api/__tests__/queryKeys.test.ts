import { hashKey } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import { apiClient, ENDPOINTS, serializeQueryParams } from "@/lib/api/client";
import {
  buildDailyHeatmapParams,
  buildFxPerformanceParams,
  buildMediaAnalyticsParams,
  getResultRole,
  queryKeys,
} from "@/lib/api/queryKeys";

describe("query keys", () => {
  it("FX Performance key holds the requested params, including ToDate", () => {
    const params = buildFxPerformanceParams({
      baseCurrency: "USD",
      targetCurrency: "HUF",
      startDate: "2026-08-01",
      toDate: "2026-08-31",
    });
    expect(queryKeys.fxPerformance(params)).toEqual([
      "FX_performance",
      {
        BaseCurrency: "USD",
        TargetCurrency: "HUF",
        StartDate: "2026-08-01",
        ToDate: "2026-08-31",
      },
    ]);
  });

  it("FX Performance ToDate is null when no end date is selected", () => {
    const params = buildFxPerformanceParams({
      baseCurrency: "USD",
      targetCurrency: "HUF",
      startDate: "2026-08-01",
      toDate: null,
    });
    expect(params).toMatchObject({ StartDate: "2026-08-01", ToDate: null });
  });

  it("FX Performance params are null until both currencies are chosen", () => {
    expect(
      buildFxPerformanceParams({
        baseCurrency: "USD",
        targetCurrency: null,
        startDate: null,
        toDate: null,
      }),
    ).toBeNull();
  });

  it("different currency pairs produce different keys", () => {
    const usdHuf = queryKeys.fxPerformance(
      buildFxPerformanceParams({
        baseCurrency: "USD",
        targetCurrency: "HUF",
        startDate: null,
        toDate: null,
      }),
    );
    const eurHuf = queryKeys.fxPerformance(
      buildFxPerformanceParams({
        baseCurrency: "EUR",
        targetCurrency: "HUF",
        startDate: null,
        toDate: null,
      }),
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

  it("Media Analytics key holds only the date range", () => {
    const params = buildMediaAnalyticsParams({
      startDate: "2026-08-01",
      toDate: "2026-10-01",
    });
    expect(queryKeys.mediaAnalytics(params)).toEqual([
      "Media_analytics",
      { StartDate: "2026-08-01", ToDate: "2026-10-01" },
    ]);
  });

  it("Media Analytics params are null until both dates are set", () => {
    expect(buildMediaAnalyticsParams({ startDate: "2026-08-01", toDate: null })).toBeNull();
    expect(buildMediaAnalyticsParams({ startDate: null, toDate: "2026-10-01" })).toBeNull();
  });

  it("maps keys to roles; idle keys are untracked", () => {
    expect(getResultRole(queryKeys.fxPerformance(null))).toBeNull();
    expect(getResultRole(queryKeys.mediaAnalytics(null))).toBeNull();
    expect(getResultRole(queryKeys.dimensions())).toBeNull();
    expect(getResultRole(queryKeys.dailyHeatmap({ Currencies: null }))).toBe("dailyHeatmap");
    expect(
      getResultRole(queryKeys.mediaAnalytics({ StartDate: "2026-08-01", ToDate: "2026-10-01" })),
    ).toBe("mediaAnalytics");
    expect(getResultRole(["toString", {}])).toBeNull(); // no prototype lookups
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

  it("encodes booleans and values with spaces or slashes", () => {
    expect(serializeQueryParams({ Flag: false, Name: "YAHOO ENTERTAINMENT" })).toBe(
      "Flag=false&Name=YAHOO+ENTERTAINMENT",
    );
    expect(new URLSearchParams(serializeQueryParams({ Name: "/FILM" })).get("Name"))
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

  it("the Media Analytics request sends only StartDate and ToDate", () => {
    const params = buildMediaAnalyticsParams({
      startDate: "2026-08-01",
      toDate: "2026-10-01",
    });
    expect(apiClient.getUri({ url: ENDPOINTS.mediaAnalytics, params })).toBe(
      "/api/exchange-rates/pages/Media_analytics?StartDate=2026-08-01&ToDate=2026-10-01",
    );
  });
});
