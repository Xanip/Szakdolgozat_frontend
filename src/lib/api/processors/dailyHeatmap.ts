import type { DailyHeatmapData } from "@/types/api/display";
import type { RawDailyHeatmapResponse } from "@/types/api/raw";

/**
 * Maps the validated Daily Heatmap response to the display structure.
 * Axis order is preserved exactly: columns follow `x_data`, rows follow
 * `y_data`, and `matrics_data[row][column]` is the backend matrix unchanged.
 */
export function processDailyHeatmap(
  raw: RawDailyHeatmapResponse,
): DailyHeatmapData {
  return {
    kpi: {
      currentDay: raw.calculation_date,
    },
    charts: {
      X_FilterCurrencies: raw.x_data,
      Y_AllCurrencies: raw.y_data,
      matrics_data: raw.data,
    },
  };
}
