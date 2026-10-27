import type { MediaAnalyticsData } from "@/types/api/display";
import type { RawMediaAnalyticsResponse } from "@/types/api/raw";
import type { MediaDateRange } from "@/types/filters";

/**
 * Maps the validated Media Analytics response to the display structure.
 * Rows stay objects in backend order, so the table can address columns by
 * field name; chart data is derived from them (`lib/media/mediaCharts.ts`).
 * `range` is the requested date range (the response doesn't repeat it).
 */
export function processMediaAnalytics(
  raw: RawMediaAnalyticsResponse,
  range: MediaDateRange,
): MediaAnalyticsData {
  return { range, rows: raw.main.table };
}
