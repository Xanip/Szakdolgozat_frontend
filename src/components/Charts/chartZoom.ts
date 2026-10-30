import type { EChartsOption } from "echarts";

import type { ChartTheme } from "@/hooks/useChartTheme";

/** Initial zoom window as x-axis category indexes (inclusive). */
export type ZoomRange = { startValue: number; endValue: number };

/**
 * Shared zoom for the line and waterfall charts.
 */
export function zoomOptions(
  colors: ChartTheme,
  initialRange?: ZoomRange,
): Pick<EChartsOption, "dataZoom" | "toolbox"> {
  return {
    dataZoom: [{ type: "inside", xAxisIndex: 0, ...initialRange }],
    toolbox: {
      right: 16,
      top: 0,
      itemSize: 14,
      iconStyle: { borderColor: colors.text },
      emphasis: { iconStyle: { borderColor: colors.line } },
      feature: {
        dataZoom: {
          yAxisIndex: "none",
          title: { zoom: "Zoom to area", back: "Undo zoom" },
        },
        restore: { title: "Reset zoom" },
      },
    },
  };
}
