import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

interface SmoothLineChartProps {
  dates: string[] | null;
  values: number[] | null;
  title?: string;
  onClick: (date: string) => void;
}

export function SmoothLineChart({dates,values,title = "Exchange rate",onClick}: SmoothLineChartProps) {
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


  const onEvents = {
    click: (params: { componentType: string; dataIndex: number }) => {
      if (params.componentType !== "series") return;

      const date = safeDates[params.dataIndex];
      if (date !== undefined) {
        onClick(date);
      }
    },
  };

  return (
    <ReactECharts
      option={option}
      onEvents = {onEvents}
      style={{ height: 360, width: "100%" }}
      notMerge
      lazyUpdate
    />
  );
}
