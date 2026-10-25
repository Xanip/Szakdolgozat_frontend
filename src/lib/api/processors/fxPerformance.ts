import type { FxPerformanceData } from "@/types/api/display";
import type { RawFxPerformanceResponse } from "@/types/api/raw";

/**
 * Maps the validated FX Performance response to the display structure.
 * Renames the backend's `changeSinceYesteray` / `changeSinceTheStartOfPeriod`
 * to the Spec's `changeSinceYesterday` / `changeSincePeriod`.
 */
export function processFxPerformance(
  raw: RawFxPerformanceResponse,
): FxPerformanceData {
  return {
    kpi: {
      previousDayRate: raw.previousDayRate,
      changeSinceYesterday: raw.changeSinceYesteray,
      todaysRate: raw.todaysRate,
      firstRateInPeriod: raw.firstRateInPeriod,
      changeSincePeriod: raw.changeSinceTheStartOfPeriod,
    },
    charts: {
      lineChart_X: raw.exchangeRateChart.lineChart_X,
      lineChart_Y_data: raw.exchangeRateChart.lineChart_Y,
      waterfallVarianceChart_X:
        raw.waterfallVarianceChart.waterfallVarianceChart_X,
      waterfallVarianceChart_Y_data:
        raw.waterfallVarianceChart.waterfallVarianceChart_Y,
    },
  };
}
