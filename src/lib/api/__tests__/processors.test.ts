import { describe, expect, it } from "vitest";

import { processDailyHeatmap } from "@/lib/api/processors/dailyHeatmap";
import { processDimensions } from "@/lib/api/processors/dimensions";
import { processFxPerformance } from "@/lib/api/processors/fxPerformance";
import { processMediaAnalytics } from "@/lib/api/processors/mediaAnalytics";

import { rawDimensions, rawFx, rawHeatmap, rawMedia } from "./fixtures";

describe("processDimensions", () => {
  it("maps dimension tables to filter options", () => {
    const data = processDimensions(rawDimensions());
    expect(data.currencies).toEqual([
      { id: 1, code: "ADP", name: "Andorran Peseta", symbol: "ADP" },
      { id: 2, code: "XXX", name: null, symbol: null },
    ]);
    expect(data.sources).toEqual([{ id: 24, name: "/FILM" }]);
    expect(data.categories).toEqual([{ id: 19, name: "Artificial Intelligence" }]);
    expect(data.authors).toEqual([{ id: 1, name: "UNKNOWN" }]);
  });
});

describe("processFxPerformance", () => {
  it("renames the backend KPI fields to the Spec names", () => {
    const raw = rawFx();
    const data = processFxPerformance(raw);
    expect(data.kpi).toEqual({
      previousDayRate: raw.previousDayRate,
      changeSinceYesterday: raw.changeSinceYesteray,
      todaysRate: raw.todaysRate,
      firstRateInPeriod: raw.firstRateInPeriod,
      changeSincePeriod: raw.changeSinceTheStartOfPeriod,
    });
    expect(data.kpi).not.toHaveProperty("changeSinceYesteray");
  });

  it("maps chart arrays with equal X/Y lengths and keeps empty arrays empty", () => {
    const data = processFxPerformance(rawFx());
    expect(data.charts.lineChart_X).toEqual(["2026-08-01", "2026-08-02"]);
    expect(data.charts.lineChart_Y_data).toHaveLength(2);
    expect(data.charts.waterfallVarianceChart_X).toEqual(["2026-09", "2026-10"]);
    expect(data.charts.waterfallVarianceChart_Y_data).toHaveLength(2);

    const empty = rawFx();
    empty.exchangeRateChart = { lineChart_X: [], lineChart_Y: [] };
    expect(processFxPerformance(empty).charts.lineChart_X).toEqual([]);
    expect(processFxPerformance(empty).charts.lineChart_Y_data).toEqual([]);
  });

  it("keeps null KPIs as null", () => {
    const raw = rawFx();
    raw.previousDayRate = null;
    expect(processFxPerformance(raw).kpi.previousDayRate).toBeNull();
  });
});

describe("processDailyHeatmap", () => {
  it("keeps column order, row order, and cell positions", () => {
    const data = processDailyHeatmap(rawHeatmap(["EUR", "HUF", "USD"]));
    expect(data.kpi.currentDay).toBe("2026-10-25");
    expect(data.charts.X_FilterCurrencies).toEqual(["EUR", "HUF", "USD"]);
    expect(data.charts.Y_AllCurrencies).toEqual(["ADP", "AED", "HUF"]);

    // Cell (row "HUF" = 2, column "USD" = 2) holds 2 * 10 + 2.
    const row = data.charts.Y_AllCurrencies!.indexOf("HUF");
    const column = data.charts.X_FilterCurrencies!.indexOf("USD");
    expect(data.charts.matrics_data[row][column]).toBe(22);
    // Missing values stay null (not 0).
    expect(data.charts.matrics_data[0]).toEqual([null, null, null]);
  });
});

describe("processMediaAnalytics", () => {
  const range = { startDate: "2026-08-01", toDate: "2026-10-01" };

  it("keeps the article rows as objects, in backend order, with the requested range", () => {
    const raw = rawMedia();
    expect(processMediaAnalytics(raw, range)).toEqual({ range, rows: raw.main.table });
    expect(processMediaAnalytics(raw, range).rows.map((row) => row.Date)).toEqual([
      "2026-08-01",
      "2026-08-02",
    ]);
  });

  it("keeps an empty table as empty rows", () => {
    expect(processMediaAnalytics({ main: { table: [] } }, range)).toEqual({ range, rows: [] });
  });
});
