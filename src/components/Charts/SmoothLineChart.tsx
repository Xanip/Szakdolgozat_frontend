import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

interface SmoothLineChartProps {
  dates: string[] | null;
  values: number[] | null;
  title?: string;
}

export function SmoothLineChart({dates,values,title = "Exchange rate",}: SmoothLineChartProps) {
const safeDates = dates ?? [];
const safeValues = values ?? [];

  const option: EChartsOption = {
    title: {
      text: title,
    },
    tooltip: {
      trigger: "axis",
    },
    grid: {
      left: 55,
      right: 24,
      top: 60,
      bottom: 40,
    },
    xAxis: {
      type: "category",
      data: safeDates,
      boundaryGap: false,
    },
    yAxis: {
      type: "value",
      scale: true,
    },
    series: [
      {
        name: title,
        type: "line",
        smooth: true,
        showSymbol: false,
        data: safeValues,
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: 360, width: "100%" }}
      notMerge
      lazyUpdate
    />
  );
}
