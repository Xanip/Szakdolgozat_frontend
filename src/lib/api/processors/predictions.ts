import type { PredictionSeries, PredictionsData } from "@/types/api/display";
import type { RawPredictionPoint, RawPredictionResponse } from "@/types/api/raw";

function toPredictionSeries(points: RawPredictionPoint[]): PredictionSeries {
  return {
    dates: points.map((p) => p.date),
    predictedRate: points.map((p) => p.predictedRate),
    lowerBound: points.map((p) => p.lowerBound),
    upperBound: points.map((p) => p.upperBound),
  };
}

export function processPrediction(
  raw: RawPredictionResponse,
): PredictionsData {
  const byMode: Record<string, PredictionSeries> = {};
  for (const [mode, points] of Object.entries(raw.predictions)) {
    byMode[mode] = toPredictionSeries(points);
  }

  return {
    baseCurrency: raw.baseCurrency,
    targetCurrency: raw.targetCurrency,
    history: {
      date: raw.history.map((p) => p.date),
      rate: raw.history.map((p) => p.rate),
    },
    modes: Object.keys(raw.predictions),
    byMode,
  };
}
