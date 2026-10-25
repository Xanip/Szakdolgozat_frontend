import type { MediaAnalyticsData } from "@/types/api/display";
import type {
  RawMediaAnalyticsResponse,
  RawMediaDataset,
} from "@/types/api/raw";
import type { MediaAnalyticsMode } from "@/lib/api/validators/mediaAnalytics";

/**
 * Maps one validated media dataset to the display structure.
 * `by_category` / `by_source` (`{ Name, Count }[]`) are split into
 * element-aligned name/value arrays, preserving the backend order.
 */
export function processMediaDataset(
  dataset: RawMediaDataset,
): MediaAnalyticsData {
  return {
    charts: {
      tableData: dataset.table.map((row) => [
        row.Date,
        row.SourceName,
        row.CategoryName,
        row.Title,
        row.URL,
      ]),
      categoriesName: dataset.by_category.map((group) => group.Name),
      categoriesData: dataset.by_category.map((group) => group.Count),
      sourcesName: dataset.by_source.map((group) => group.Name),
      sourcesData: dataset.by_source.map((group) => group.Count),
    },
  };
}

/** Selects the dataset requested by `mode` and processes it. */
export function processMediaAnalytics(
  raw: RawMediaAnalyticsResponse,
  mode: MediaAnalyticsMode,
): MediaAnalyticsData {
  const dataset = mode === "main" ? raw.main : raw.filtered;
  if (dataset === null) {
    throw new Error(`Media Analytics response has no ${mode} dataset.`);
  }
  return processMediaDataset(dataset);
}
