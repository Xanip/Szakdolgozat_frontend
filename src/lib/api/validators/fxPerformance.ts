import type { RawFxPerformanceResponse } from "@/types/api/raw";

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

const decodeShape: Decoder<RawFxPerformanceResponse> = object({
  todaysRate: nullable(number),
  previousDayRate: nullable(number),
  firstRateInPeriod: nullable(number),
  changeSinceYesteray: nullable(number),
  changeSinceTheStartOfPeriod: nullable(number),
  exchangeRateChart: object({
    lineChart_X: arrayOf(string),
    lineChart_Y: arrayOf(number),
  }),
  waterfallVarianceChart: object({
    waterfallVarianceChart_X: arrayOf(string),
    waterfallVarianceChart_Y: arrayOf(number),
  }),
});

const decodeFxPerformance: Decoder<RawFxPerformanceResponse> = (
  value,
  path,
) => {
  const raw = decodeShape(value, path);
  // Each X value labels exactly one Y value.
  ensure(
    raw.exchangeRateChart.lineChart_X.length ===
      raw.exchangeRateChart.lineChart_Y.length,
    `${path}.exchangeRateChart`,
    "lineChart_X and lineChart_Y must have the same length",
  );
  ensure(
    raw.waterfallVarianceChart.waterfallVarianceChart_X.length ===
      raw.waterfallVarianceChart.waterfallVarianceChart_Y.length,
    `${path}.waterfallVarianceChart`,
    "waterfallVarianceChart_X and waterfallVarianceChart_Y must have the same length",
  );
  return raw;
};

/** Validates GET /exchange-rates/pages/FX_performance. */
export function validateFxPerformanceResponse(
  value: unknown,
): RawFxPerformanceResponse {
  return validateResponse(
    "/exchange-rates/pages/FX_performance",
    decodeFxPerformance,
    value,
  );
}
