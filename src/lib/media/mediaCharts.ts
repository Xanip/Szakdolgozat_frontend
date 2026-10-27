import type {
  MediaArticle,
  MediaChartData,
  MediaChartSeries,
} from "@/types/api/display";
import type { MediaCrossSelection } from "@/types/filters";

/*
 * Chart data for the Media Analytics page, derived from the cached articles.
 *
 * Each chart shows two numbers per element: the total in the date range and
 * the part that matches the cross-filter (highlighted).
 */

/** Article fields a chart groups by. */
export type MediaGroupField = "CategoryName" | "SourceName";

/** Element names and their totals, ordered by the totals. */
export type MediaTotals = Pick<MediaChartSeries, "names" | "totals">;

const FIELD_BY_KIND: Readonly<Record<MediaCrossSelection["kind"], MediaGroupField>> = {
  category: "CategoryName",
  source: "SourceName",
};

function countBy(
  rows: readonly MediaArticle[],
  field: MediaGroupField,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const name = row[field];
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return counts;
}

/**
 * Articles per `field` value, ordered by count (descending), ties by name
 */
export function countTotals(
  rows: readonly MediaArticle[],
  field: MediaGroupField,
): MediaTotals {
  const entries = [...countBy(rows, field)].sort(
    ([nameA, countA], [nameB, countB]) =>
      countB - countA || (nameA < nameB ? -1 : nameA > nameB ? 1 : 0),
  );
  return {
    names: entries.map(([name]) => name),
    totals: entries.map(([, count]) => count),
  };
}

/** Whether an article belongs to the cross-filter's Source or Category. */
export function matchesCrossFilter(
  row: MediaArticle,
  crossFilter: MediaCrossSelection,
): boolean {
  return row[FIELD_BY_KIND[crossFilter.kind]] === crossFilter.value;
}

/**
 * Cross-filtered counts aligned with `names` (`0` where no article matches).
 * `null` when there is no cross-filter
 */
export function countHighlighted(
  rows: readonly MediaArticle[],
  field: MediaGroupField,
  names: readonly string[],
  crossFilter: MediaCrossSelection | null,
): number[] | null {
  if (crossFilter === null) return null;
  const counts = countBy(
    rows.filter((row) => matchesCrossFilter(row, crossFilter)),
    field,
  );
  return names.map((name) => counts.get(name) ?? 0);
}

/** Totals of both charts; depends on the articles only. */
export function buildMediaChartTotals(rows: readonly MediaArticle[]) {
  return {
    categories: countTotals(rows, "CategoryName"),
    sources: countTotals(rows, "SourceName"),
  };
}

/** Adds the cross-filter highlight to precomputed totals. */
export function withMediaHighlight(
  rows: readonly MediaArticle[],
  totals: { categories: MediaTotals; sources: MediaTotals },
  crossFilter: MediaCrossSelection | null,
): MediaChartData {
  return {
    categories: {
      ...totals.categories,
      highlighted: countHighlighted(
        rows,
        "CategoryName",
        totals.categories.names,
        crossFilter,
      ),
    },
    sources: {
      ...totals.sources,
      highlighted: countHighlighted(
        rows,
        "SourceName",
        totals.sources.names,
        crossFilter,
      ),
    },
  };
}

/** Both charts' data in one call (totals + highlight). */
export function buildMediaChartData(
  rows: readonly MediaArticle[],
  crossFilter: MediaCrossSelection | null,
): MediaChartData {
  return withMediaHighlight(rows, buildMediaChartTotals(rows), crossFilter);
}
