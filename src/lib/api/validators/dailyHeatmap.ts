import type { RawDailyHeatmapResponse } from "@/types/api/raw";

import {
  arrayOf,
  ensure,
  nullable,
  number,
  object,
  string,
  validateResponse,
  type Decoder,
} from "./guards";

const decodeShape: Decoder<RawDailyHeatmapResponse> = object({
  calculation_date: nullable(string),
  x_data: arrayOf(string),
  y_data: arrayOf(string),
  data: arrayOf(arrayOf(nullable(number))),
});

const decodeDailyHeatmap: Decoder<RawDailyHeatmapResponse> = (value, path) => {
  const raw = decodeShape(value, path);
  // Rows follow y_data, columns follow x_data.
  ensure(
    raw.data.length === raw.y_data.length,
    `${path}.data`,
    `expected ${raw.y_data.length} rows (y_data length), got ${raw.data.length}`,
  );
  raw.data.forEach((row, rowIndex) =>
    ensure(
      row.length === raw.x_data.length,
      `${path}.data[${rowIndex}]`,
      `expected ${raw.x_data.length} columns (x_data length), got ${row.length}`,
    ),
  );
  return raw;
};

/** Validates GET /exchange-rates/pages/Daily_heatmap. */
export function validateDailyHeatmapResponse(
  value: unknown,
): RawDailyHeatmapResponse {
  return validateResponse(
    "/exchange-rates/pages/Daily_heatmap",
    decodeDailyHeatmap,
    value,
  );
}
