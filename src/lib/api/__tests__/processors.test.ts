import { describe, expect, it } from "vitest";

import { processDailyHeatmap } from "@/lib/api/processors/dailyHeatmap";
import { processDimensions } from "@/lib/api/processors/dimensions";
import { processFxPerformance } from "@/lib/api/processors/fxPerformance";
import {
  processMediaAnalytics,
  processMediaDataset,
} from "@/lib/api/processors/mediaAnalytics";
import { MEDIA_TABLE_COLUMNS } from "@/types/api/display";

import {
  rawDimensions,
  rawFx,
  rawHeatmap,
  rawMediaDataset,
  rawMediaFiltered,
  rawMediaMain,
} from "./fixtures";

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
  it("splits group counts into element-aligned name/value arrays", () => {
    const data = processMediaDataset(rawMediaDataset());
    expect(data.charts.categoriesName).toEqual(["Economic Recession", "Inflation"]);
    expect(data.charts.categoriesData).toEqual([12, 3]);
    expect(data.charts.sourcesName).toEqual(["SYNTHETIC", "YAHOO ENTERTAINMENT"]);
    expect(data.charts.sourcesData).toEqual([15, 4]);
  });

  it("builds table rows in MEDIA_TABLE_COLUMNS order", () => {
    const raw = rawMediaDataset();
    const [row] = processMediaDataset(raw).charts.tableData;
    expect(row).toEqual(MEDIA_TABLE_COLUMNS.map((column) => raw.table[0][column]));
  });

  it("keeps empty datasets as empty arrays", () => {
    const data = processMediaDataset({ table: [], by_category: [], by_source: [] });
    expect(data.charts).toEqual({
      tableData: [],
      categoriesName: [],
      categoriesData: [],
      sourcesName: [],
      sourcesData: [],
    });
  });

  it("selects the dataset for the request mode", () => {
    expect(processMediaAnalytics(rawMediaMain("M"), "main").charts.sourcesName?.[0]).toBe(
      "M",
    );
    expect(
      processMediaAnalytics(rawMediaFiltered("F"), "filtered").charts.sourcesName?.[0],
    ).toBe("F");
    expect(() => processMediaAnalytics(rawMediaMain(), "filtered")).toThrow();
  });
});
