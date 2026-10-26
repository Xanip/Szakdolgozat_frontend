import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { useChartTheme } from "@/hooks/useChartTheme";

interface SmoothLineChartProps {
  dates: string[] | null;
  values: number[] | null;
  title?: string;
  onClick?: (date: string) => void;
}

export function SmoothLineChart({dates,values,title = "Exchange rate",onClick}: SmoothLineChartProps) {
const safeDates = dates ?? [];
const safeValues = values ?? [];
const colors = useChartTheme();

  const option: EChartsOption = {
    backgroundColor: "transparent",
    textStyle: { color: colors.text },
    title: {
      text: title,
      textStyle: { color: colors.text },
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: colors.tooltipBg,
      borderColor: colors.tooltipBorder,
      textStyle: { color: colors.text },
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
      axisLine: { lineStyle: { color: colors.axis } },
      axisLabel: { color: colors.text },
    },
    yAxis: {
      type: "value",
      scale: true,
      axisLabel: { color: colors.text },
      splitLine: { lineStyle: { color: colors.grid } },
    },
    series: [
      {
        name: title,
        type: "line",
        smooth: true,
        showSymbol: false,
        data: safeValues,
        itemStyle: { color: colors.line },
        lineStyle: { color: colors.line, width: 2 },
        areaStyle: { color: colors.line, opacity: 0.12 },
      },
    ],
  };


  const onEvents = {
    click: (params: { componentType: string; dataIndex: number }) => {
      if (params.componentType !== "series") return;

      const date = safeDates[params.dataIndex];
      if (date !== undefined) {
        onClick?.(date);
      }
    },
  };

  return (
    <ReactECharts
      option={option}
      onEvents = {onEvents}
      style={{ height: "100%", width: "100%" }}
      notMerge
      lazyUpdate
    />
  );
}
