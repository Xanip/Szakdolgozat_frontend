import { describe, expect, it } from "vitest";

import {
  buildMediaChartData,
  buildMediaChartTotals,
  countHighlighted,
  countTotals,
  matchesCrossFilter,
  withMediaHighlight,
} from "@/lib/media/mediaCharts";
import type { MediaArticle } from "@/types/api/display";

function article(SourceName: string, CategoryName: string): MediaArticle {
  return {
    Date: "2026-08-01",
    SourceName,
    CategoryName,
    Title: `${SourceName} / ${CategoryName}`,
    URL: "https://synthetic-news.example/article",
  };
}

/*
 * 8 articles:
 *   YAHOO:  3 × Economic Recession, 1 × Inflation
 *   BBC:    1 × Economic Recession, 1 × Geopolitics
 *   NPR:    1 × Economic Recession
 *   AXIOS:  1 × Inflation
 * Categories: Economic Recession 5, Inflation 2, Geopolitics 1
 * Sources:    YAHOO 4, BBC 2, then AXIOS 1 and NPR 1 (tie → by name)
 */
const ROWS: MediaArticle[] = [
  article("YAHOO", "Economic Recession"),
  article("BBC", "Economic Recession"),
  article("YAHOO", "Inflation"),
  article("NPR", "Economic Recession"),
  article("YAHOO", "Economic Recession"),
  article("AXIOS", "Inflation"),
  article("BBC", "Geopolitics"),
  article("YAHOO", "Economic Recession"),
];

describe("countTotals", () => {
  it("orders by count descending, ties by name ascending", () => {
    expect(countTotals(ROWS, "CategoryName")).toEqual({
      names: ["Economic Recession", "Inflation", "Geopolitics"],
      totals: [5, 2, 1],
    });
    expect(countTotals(ROWS, "SourceName")).toEqual({
      names: ["YAHOO", "BBC", "AXIOS", "NPR"],
      totals: [4, 2, 1, 1],
    });
  });

  it("returns empty arrays for no articles", () => {
    expect(countTotals([], "SourceName")).toEqual({ names: [], totals: [] });
  });
});

describe("matchesCrossFilter", () => {
  it("compares the field that belongs to the filter kind", () => {
    const row = article("YAHOO", "Inflation");
    expect(matchesCrossFilter(row, { kind: "source", value: "YAHOO" })).toBe(true);
    expect(matchesCrossFilter(row, { kind: "category", value: "YAHOO" })).toBe(false);
    expect(matchesCrossFilter(row, { kind: "category", value: "Inflation" })).toBe(true);
  });
});

describe("countHighlighted", () => {
  it("is null without a cross-filter", () => {
    expect(countHighlighted(ROWS, "SourceName", ["YAHOO"], null)).toBeNull();
  });

  it("aligns counts with the given names and fills missing ones with 0", () => {
    expect(
      countHighlighted(ROWS, "SourceName", ["YAHOO", "BBC", "AXIOS", "NPR"], {
        kind: "category",
        value: "Inflation",
      }),
    ).toEqual([1, 0, 1, 0]);
  });
});

describe("buildMediaChartData", () => {
  it("without a cross-filter: totals only", () => {
    const data = buildMediaChartData(ROWS, null);
    expect(data.categories.highlighted).toBeNull();
    expect(data.sources.highlighted).toBeNull();
  });

  it("category filter (donut click): donut highlights one slice, bar chart shows that category per source", () => {
    const data = buildMediaChartData(ROWS, {
      kind: "category",
      value: "Economic Recession",
    });
    expect(data.categories).toEqual({
      names: ["Economic Recession", "Inflation", "Geopolitics"],
      totals: [5, 2, 1],
      highlighted: [5, 0, 0],
    });
    expect(data.sources).toEqual({
      names: ["YAHOO", "BBC", "AXIOS", "NPR"],
      totals: [4, 2, 1, 1],
      highlighted: [3, 1, 0, 1],
    });
  });

  it("source filter (bar click): bar chart highlights one bar, donut shows that source per category", () => {
    const data = buildMediaChartData(ROWS, { kind: "source", value: "YAHOO" });
    expect(data.sources.highlighted).toEqual([4, 0, 0, 0]);
    expect(data.categories.highlighted).toEqual([3, 1, 0]);
  });

  it("a cross-filter never changes names, totals or their order", () => {
    const plain = buildMediaChartData(ROWS, null);
    const filtered = buildMediaChartData(ROWS, { kind: "source", value: "NPR" });
    expect(filtered.categories.names).toEqual(plain.categories.names);
    expect(filtered.categories.totals).toEqual(plain.categories.totals);
    expect(filtered.sources.names).toEqual(plain.sources.names);
    expect(filtered.sources.totals).toEqual(plain.sources.totals);
    for (const series of [filtered.categories, filtered.sources]) {
      expect(series.totals).toHaveLength(series.names.length);
      expect(series.highlighted).toHaveLength(series.names.length);
    }
  });

  it("a value missing from the data highlights nothing", () => {
    const data = buildMediaChartData(ROWS, { kind: "source", value: "UNKNOWN" });
    expect(data.sources.highlighted).toEqual([0, 0, 0, 0]);
    expect(data.categories.highlighted).toEqual([0, 0, 0]);
  });

  it("no articles: empty series", () => {
    expect(buildMediaChartData([], { kind: "source", value: "YAHOO" })).toEqual({
      categories: { names: [], totals: [], highlighted: [] },
      sources: { names: [], totals: [], highlighted: [] },
    });
  });

  it("matches the split totals + highlight steps used by the page hook", () => {
    const crossFilter = { kind: "category" as const, value: "Inflation" };
    const totals = buildMediaChartTotals(ROWS);
    expect(withMediaHighlight(ROWS, totals, crossFilter)).toEqual(
      buildMediaChartData(ROWS, crossFilter),
    );
  });
});
