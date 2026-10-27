import type { RawMediaAnalyticsResponse } from "@/types/api/raw";

import {
  arrayOf,
  object,
  string,
  validateResponse,
  type Decoder,
} from "./guards";

const decodeShape: Decoder<RawMediaAnalyticsResponse> = object({
  main: object({
    table: arrayOf(
      object({
        Date: string,
        SourceName: string,
        CategoryName: string,
        Title: string,
        URL: string,
      }),
    ),
  }),
});

/**
 * Validates GET /exchange-rates/pages/Media_analytics: `{ main: { table } }`,
 * every row field a required string. An empty `table` is valid (no articles
 * in the date range).
 */
export function validateMediaAnalyticsResponse(
  value: unknown,
): RawMediaAnalyticsResponse {
  return validateResponse(
    "/exchange-rates/pages/Media_analytics",
    decodeShape,
    value,
  );
}
