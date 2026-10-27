import { describe, expect, it } from "vitest";

import { validateDailyHeatmapResponse } from "@/lib/api/validators/dailyHeatmap";
import { validateDimensionsResponse } from "@/lib/api/validators/dimensions";
import { validateFxPerformanceResponse } from "@/lib/api/validators/fxPerformance";
import {
  arrayOf,
  nullable,
  number,
  object,
  ResponseValidationError,
  string,
  validateResponse,
} from "@/lib/api/validators/guards";
import { validateMediaAnalyticsResponse } from "@/lib/api/validators/mediaAnalytics";

import {
  rawDimensions,
  rawFx,
  rawHeatmap,
  rawMedia,
} from "./fixtures";

/** Asserts a ResponseValidationError reported at `path`. */
function expectInvalid(run: () => unknown, path: string) {
  try {
    run();
  } catch (error) {
    expect(error).toBeInstanceOf(ResponseValidationError);
    expect((error as ResponseValidationError).path).toBe(path);
    return;
  }
  throw new Error("Expected a ResponseValidationError");
}

const clone = <T>(value: T): T => structuredClone(value);

describe("reusable guards", () => {
  const decoder = object({
    name: string,
    values: arrayOf(nullable(number)),
  });

  it("accepts a valid value and drops unknown fields", () => {
    expect(
      validateResponse("test", decoder, { name: "a", values: [1, null], extra: true }),
    ).toEqual({ name: "a", values: [1, null] });
  });

  it("reports the failing path", () => {
    expectInvalid(() => validateResponse("test", decoder, null), "$");
    expectInvalid(() => validateResponse("test", decoder, { values: [] }), "$.name");
    expectInvalid(
      () => validateResponse("test", decoder, { name: "a", values: [1, "2"] }),
      "$.values[1]",
    );
  });

  it("does not treat a missing field as null", () => {
    expectInvalid(
      () => validateResponse("test", object({ v: nullable(number) }), {}),
      "$.v",
    );
  });

  it("rejects non-finite numbers", () => {
    expectInvalid(() => validateResponse("test", number, Number.NaN), "$");
  });
});

describe("dimensions validator", () => {
  it("accepts the documented shape, including nullable currency names", () => {
    expect(validateDimensionsResponse(rawDimensions())).toEqual(rawDimensions());
  });

  it("rejects a missing table and wrong field types", () => {
    const missing: Record<string, unknown> = clone(rawDimensions());
    delete missing.DimSources;
    expectInvalid(() => validateDimensionsResponse(missing), "$.DimSources");

    const wrongType = clone(rawDimensions()) as unknown as {
      DimCurrencies: { CurrencyCode: unknown }[];
    };
    wrongType.DimCurrencies[0].CurrencyCode = null;
    expectInvalid(
      () => validateDimensionsResponse(wrongType),
      "$.DimCurrencies[0].CurrencyCode",
    );
  });

  it("rejects a non-JSON body (e.g. an HTML error page)", () => {
    expectInvalid(() => validateDimensionsResponse("<html></html>"), "$");
  });
});

describe("FX Performance validator", () => {
  it("accepts the documented shape and null KPIs", () => {
    const raw = rawFx();
    raw.todaysRate = null;
    raw.changeSinceYesteray = null;
    expect(validateFxPerformanceResponse(raw)).toEqual(raw);
  });

  it("requires the backend field name changeSinceYesteray", () => {
    const raw: Record<string, unknown> = clone(rawFx());
    raw.changeSinceYesterday = raw.changeSinceYesteray;
    delete raw.changeSinceYesteray;
    expectInvalid(() => validateFxPerformanceResponse(raw), "$.changeSinceYesteray");
  });

  it("rejects wrong types", () => {
    const raw = clone(rawFx()) as unknown as { previousDayRate: unknown };
    raw.previousDayRate = "322.8";
    expectInvalid(() => validateFxPerformanceResponse(raw), "$.previousDayRate");
  });

  it("rejects X/Y arrays of different length", () => {
    const line = clone(rawFx());
    line.exchangeRateChart.lineChart_Y.pop();
    expectInvalid(() => validateFxPerformanceResponse(line), "$.exchangeRateChart");

    const waterfall = clone(rawFx());
    waterfall.waterfallVarianceChart.waterfallVarianceChart_X.push("2026-11");
    expectInvalid(
      () => validateFxPerformanceResponse(waterfall),
      "$.waterfallVarianceChart",
    );
  });
});

describe("Daily Heatmap validator", () => {
  it("accepts the documented shape and an empty heatmap", () => {
    expect(validateDailyHeatmapResponse(rawHeatmap())).toEqual(rawHeatmap());
    const empty = { calculation_date: null, x_data: [], y_data: [], data: [] };
    expect(validateDailyHeatmapResponse(empty)).toEqual(empty);
  });

  it("rejects a matrix that does not match the axes", () => {
    const rows = clone(rawHeatmap());
    rows.data.pop();
    expectInvalid(() => validateDailyHeatmapResponse(rows), "$.data");

    const columns = clone(rawHeatmap());
    columns.data[1].push(1);
    expectInvalid(() => validateDailyHeatmapResponse(columns), "$.data[1]");
  });

  it("rejects non-numeric cells", () => {
    const raw = clone(rawHeatmap()) as unknown as { data: unknown[][] };
    raw.data[1][0] = "0.1";
    expectInvalid(() => validateDailyHeatmapResponse(raw), "$.data[1][0]");
  });
});

describe("Media Analytics validator", () => {
  it("accepts the documented { main: { table } } shape and an empty table", () => {
    expect(validateMediaAnalyticsResponse(rawMedia())).toEqual(rawMedia());
    const empty = { main: { table: [] } };
    expect(validateMediaAnalyticsResponse(empty)).toEqual(empty);
  });

  it("rejects a missing main or table", () => {
    expectInvalid(() => validateMediaAnalyticsResponse({}), "$.main");
    expectInvalid(() => validateMediaAnalyticsResponse({ main: null }), "$.main");
    expectInvalid(() => validateMediaAnalyticsResponse({ main: {} }), "$.main.table");
  });

  it("rejects missing and null row fields", () => {
    const missing = clone(rawMedia()) as unknown as {
      main: { table: Record<string, unknown>[] };
    };
    delete missing.main.table[0].URL;
    expectInvalid(() => validateMediaAnalyticsResponse(missing), "$.main.table[0].URL");

    const nullSource = clone(rawMedia()) as unknown as {
      main: { table: Record<string, unknown>[] };
    };
    nullSource.main.table[1].SourceName = null;
    expectInvalid(
      () => validateMediaAnalyticsResponse(nullSource),
      "$.main.table[1].SourceName",
    );
  });
});
