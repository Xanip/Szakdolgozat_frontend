import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { useChartTheme, type ChartTheme } from "@/hooks/useChartTheme";
import type { PredictionSeries } from "@/types/api/display";
import { zoomOptions, type ZoomRange } from "./chartZoom";

type HistorySeries = { date: string[]; rate: number[] };

/** Set the initial zoom window. */
const INITIAL_WINDOW_MONTHS = 1;

function shiftMonths(isoDate: string, months: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

/**
 * Initial zoom around the history/forecast boundary. ISO dates compare
 * correctly as strings.
 */
function initialZoomRange(
  axisDates: string[],
  lastHistDate: string | undefined,
): ZoomRange | undefined {
  if (lastHistDate === undefined) return undefined;
  const from = shiftMonths(lastHistDate, -INITIAL_WINDOW_MONTHS);
  const to = shiftMonths(lastHistDate, INITIAL_WINDOW_MONTHS);

  const startValue = axisDates.findIndex((date) => date >= from);
  let endValue = axisDates.length - 1;
  while (endValue > 0 && axisDates[endValue] > to) endValue -= 1;

  return { startValue: Math.max(startValue, 0), endValue };
}

interface PredictionLineChartProps {
  history: HistorySeries;
  prediction: PredictionSeries | null;
  title?: string;
}

type AxisTooltipParam = { dataIndex: number; axisValue?: string | number };

function formatRate(value: number | null | undefined): string {
  return typeof value === "number" ? value.toFixed(4) : "-";
}

function buildOption(history: HistorySeries, prediction: PredictionSeries | null, colors: ChartTheme, title: string,): EChartsOption {
  const historyColor = colors.line;
  const predictionColor = colors.palette[1] || colors.increase;

  const histDates = history.date;
  const histValues = history.rate;
  const lastIndex = histDates.length - 1;
  const lastHistValue = lastIndex >= 0 ? histValues[lastIndex] : null;

  // Shared timeline for history and forecast.
  const axisDates = prediction ? [...histDates, ...prediction.dates] : histDates;
  const futureNulls = prediction ? prediction.dates.map(() => null) : [];

  // Forecast series are empty over the history, except its last point.
  const pastNulls = histDates.slice(0, -1).map(() => null);

  const historyData: (number | null)[] = [...histValues, ...futureNulls];

  const forecastLine = prediction? [...pastNulls, lastHistValue, ...prediction.predictedRate]: [];
  const bandBase = prediction? [...pastNulls, lastHistValue, ...prediction.lowerBound]: [];
  const bandSpan = prediction
    ? [...pastNulls, lastHistValue === null ? null : 0, ...prediction.upperBound.map((upper, i) => upper - prediction.lowerBound[i]),]
    : [];

  const series: NonNullable<EChartsOption["series"]> = [
    {
      name: "History",
      type: "line",
      smooth: true,
      showSymbol: false,
      data: historyData,
      itemStyle: { color: historyColor },
      lineStyle: { color: historyColor, width: 2 },
      areaStyle: { color: historyColor, opacity: 0.12 },
      z: 3,
    },
  ];

  if (prediction) {
    series.push(
      {
        name: "Lower bound",
        type: "line",
        stack: "confidence",
        smooth: true,
        showSymbol: false,
        data: bandBase,
        lineStyle: { opacity: 0 },
        itemStyle: { color: predictionColor },
        silent: true,
        z: 1,
      },
      {
        name: "Uncertainty",
        type: "line",
        stack: "confidence",
        smooth: true,
        showSymbol: false,
        data: bandSpan,
        lineStyle: { opacity: 0 },
        itemStyle: { color: predictionColor },
        areaStyle: { color: predictionColor, opacity: 0.2 },
        silent: true,
        z: 1,
      },
      {
        name: "Forecast",
        type: "line",
        smooth: true,
        showSymbol: false,
        data: forecastLine,
        itemStyle: { color: predictionColor },
        lineStyle: { color: predictionColor, width: 2 },
        z: 2,
      },
    );
  }

  const historyCount = histDates.length;

  // One readable tooltip line per value instead of the raw stacked series.
  const tooltipFormatter = (raw: unknown): string => {
    const params = (Array.isArray(raw) ? raw : [raw]) as AxisTooltipParam[];
    const index = params[0]?.dataIndex;
    if (index === undefined) return "";
    const date = axisDates[index];

    if (index < historyCount) {
      return `${date}<br/>History: ${formatRate(histValues[index])}`;
    }
    if (!prediction) return String(date);
    const i = index - historyCount;
    return (
      `${date}<br/>` +
      `Forecast: ${formatRate(prediction.predictedRate[i])}<br/>` +
      `Range: ${formatRate(prediction.lowerBound[i])} - ${formatRate(prediction.upperBound[i])}`
    );
  };

  return {
    backgroundColor: "transparent",
    textStyle: { color: colors.text },
    title: { text: title, left: "center", top: 4, textStyle: { color: colors.text } },
    tooltip: {
      trigger: "axis",
      backgroundColor: colors.tooltipBg,
      borderColor: colors.tooltipBorder,
      textStyle: { color: colors.text },
      formatter: tooltipFormatter,
    },
    ...zoomOptions(colors, initialZoomRange(axisDates, histDates[lastIndex])),
    legend: {
      data: prediction ? ["History", "Forecast", "Uncertainty"] : ["History"],
      textStyle: { color: colors.text },
      left: "center",
      top: 44,
      itemGap: 24,
      selectedMode: false,
    },
    grid: { left: 55, right: 24, top: 96, bottom: 40 },
    xAxis: {
      type: "category",
      data: axisDates,
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
    series,
  };
}

/**
 * Exchange-rate chart with an optional forecast overlay.
 *
 * - History: one line over the full received period.
 * - Forecast: a second line in another color that starts as the continuation of the history.
 * - Uncertainty band: lowerBound and upperBound drawn as two stacked line series
 *   (an invisible base up to lowerBound, and a filled span of upperBound - lowerBound) in the forecast color.
 * - Zoom.
 */
export function PredictionLineChart({history, prediction, title = "Exchange rate forecast",}: PredictionLineChartProps) {
  const colors = useChartTheme();
  const option = useMemo(
    () => buildOption(history, prediction, colors, title),
    [history, prediction, colors, title],
  );

  return (
    <ReactECharts option={option} style={{ height: "100%", width: "100%" }} notMerge lazyUpdate/>
  );
}
