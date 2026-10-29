import ReactECharts from "echarts-for-react";
import type { BarSeriesOption, EChartsOption } from "echarts";
import { useChartTheme } from "@/hooks/useChartTheme";
import {
  FADED_OPACITY,
  formatHighlightTooltip,
  getHighlight,
  type ChartSeriesInput,
} from "./chartHighlight";

interface MediaBarChartProps extends ChartSeriesInput {
  title?: string;
  onClick?: (name: string) => void;
}

/**
 * Horizontal bars, largest on top. Without a highlight one full-color series;
 * with a highlight the total is faded and the highlighted part is drawn in
 * front of it. The parent sets the height (and scrolling) for many bars.
 */
export function MediaBarChart({ names, totals, highlighted, title = "Articles per source", onClick }: MediaBarChartProps) {
  const colors = useChartTheme();
  const highlight = getHighlight({ names, totals, highlighted });

  const totalSeries: BarSeriesOption = {
    name: "Total",
    type: "bar",
    data: [...totals],
    barMaxWidth: 18,
    itemStyle: { color: colors.line, opacity: highlight ? FADED_OPACITY : 1 },
  };

  const series: BarSeriesOption[] = highlight
    ? [
        totalSeries,
        {
          name: "Highlighted",
          type: "bar",
          data: [...highlight],
          barGap: "-100%",
          barMaxWidth: 18,
          itemStyle: { color: colors.line },
        },
      ]
    : [totalSeries];

  const option: EChartsOption = {
    backgroundColor: "transparent",
    textStyle: { color: colors.text },
    title: { text: title, textStyle: { color: colors.text } },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: colors.tooltipBg,
      borderColor: colors.tooltipBorder,
      textStyle: { color: colors.text },
      formatter: (params: unknown) => {
        const first = (Array.isArray(params) ? params[0] : params) as { dataIndex: number };
        const i = first.dataIndex;
        return formatHighlightTooltip(names[i], totals[i], highlight ? highlight[i] : null);
      },
    },
    grid: { left: 24, right: 24, top: 50, bottom: 24, containLabel: true },
    xAxis: {
      type: "value",
      axisLabel: { color: colors.text },
      splitLine: { lineStyle: { color: colors.grid } },
    },
    yAxis: {
      type: "category",
      data: [...names],
      inverse: true,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: colors.axis } },
      axisLabel: { color: colors.text },
    },
    series,
  };

  const onEvents = {
    click: (params: { componentType: string; dataIndex: number }) => {
      if (params.componentType !== "series") return;
      const name = names[params.dataIndex];
      if (name !== undefined) onClick?.(name);
    },
  };

  return (
    <ReactECharts
      option={option}
      onEvents={onEvents}
      style={{ height: "100%", width: "100%" }}
      notMerge
      lazyUpdate
    />
  );
}
