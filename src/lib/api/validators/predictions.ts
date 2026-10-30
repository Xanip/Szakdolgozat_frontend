import type { RawPredictionResponse } from "@/types/api/raw";
import {arrayOf,ensure,number,object,record,string,validateResponse,type Decoder,} from "./guards";

const decodeHistoryPoint = object({
  date: string,
  rate: number,
});

const decodePredictionPoint = object({
  date: string,
  predictedRate: number,
  lowerBound: number,
  upperBound: number,
});

const decodeShape: Decoder<RawPredictionResponse> = object({
  baseCurrency: string,
  targetCurrency: string,
  history: arrayOf(decodeHistoryPoint),
  predictions: record(arrayOf(decodePredictionPoint)),
});

const decodePrediction: Decoder<RawPredictionResponse> = (value, path) => {
  const raw = decodeShape(value, path);

  ensure(
    Object.keys(raw.predictions).length > 0,
    `${path}.predictions`,
    "no up-to-date prediction is available for this currency pair",
  );

  return raw;
};

/** Validates GET /exchange-rates/pages/Prediction. */
export function validatePredictionResponse(
  value: unknown,
): RawPredictionResponse {
  return validateResponse(
    "/exchange-rates/pages/Prediction",
    decodePrediction,
    value,
  );
}
