import type {
  RawMediaAnalyticsResponse,
  RawMediaDataset,
} from "@/types/api/raw";

import {
  arrayOf,
  ensure,
  integer,
  nullable,
  object,
  string,
  validateResponse,
  type Decoder,
} from "./guards";

const decodeGroupCount = object({ Name: string, Count: integer });

const decodeDataset: Decoder<RawMediaDataset> = object({
  table: arrayOf(
    object({
      Date: string,
      SourceName: string,
      CategoryName: string,
      Title: string,
      URL: string,
    }),
  ),
  by_category: arrayOf(decodeGroupCount),
  by_source: arrayOf(decodeGroupCount),
});

const decodeShape: Decoder<RawMediaAnalyticsResponse> = object({
  main: nullable(decodeDataset),
  filtered: nullable(decodeDataset),
});

/**
 * Which dataset the request asked for:
 * - `main`: `IncludeMain=true` without cross-filter → `main` set, `filtered` null.
 * - `filtered`: `IncludeMain=false` with one cross-filter → `main` null,
 *   `filtered` set.
 */
export type MediaAnalyticsMode = "main" | "filtered";

function decoderFor(
  mode: MediaAnalyticsMode,
): Decoder<RawMediaAnalyticsResponse> {
  return (value, path) => {
    const raw = decodeShape(value, path);
    if (mode === "main") {
      ensure(raw.main !== null, `${path}.main`, "expected main dataset");
      ensure(raw.filtered === null, `${path}.filtered`, "expected null");
    } else {
      ensure(raw.main === null, `${path}.main`, "expected null");
      ensure(
        raw.filtered !== null,
        `${path}.filtered`,
        "expected filtered dataset",
      );
    }
    return raw;
  };
}

/** Validates GET /exchange-rates/pages/Media_analytics for the given mode. */
export function validateMediaAnalyticsResponse(
  value: unknown,
  mode: MediaAnalyticsMode,
): RawMediaAnalyticsResponse {
  return validateResponse(
    "/exchange-rates/pages/Media_analytics",
    decoderFor(mode),
    value,
  );
}
