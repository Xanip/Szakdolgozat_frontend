import ReactECharts from "echarts-for-react";
import type { CustomSeriesOption, EChartsOption, PieSeriesOption } from "echarts";
import { useChartTheme } from "@/hooks/useChartTheme";
import {
  FADED_OPACITY,
  formatHighlightTooltip,
  getHighlight,
  highlightRadius,
  paletteColor,
  pieSliceAngles,
  type ChartSeriesInput,
} from "./chartHighlight";

interface DonutChartProps extends ChartSeriesInput {
  title?: string;
  onClick?: (name: string) => void;
}

/** Ring position as fractions of the chart, the pie and the highlight both use these. */
const CENTER_X = 0.5;
const CENTER_Y = 0.55;
const INNER_RADIUS = 0.45;
const OUTER_RADIUS = 0.72;
const BORDER_WIDTH = 2;


export function DonutChart({ names, totals, highlighted, title = "Articles per category", onClick }: DonutChartProps) {
  const colors = useChartTheme();
  const highlight = getHighlight({ names, totals, highlighted });

  const pie: PieSeriesOption = {
    name: "Total",
    type: "pie",
    center: [`${CENTER_X * 100}%`, `${CENTER_Y * 100}%`],
    radius: [`${INNER_RADIUS * 100}%`, `${OUTER_RADIUS * 100}%`],
    itemStyle: { borderColor: colors.tooltipBg, borderWidth: BORDER_WIDTH },
    label: { show: false },
    labelLine: { show: false },
    emphasis: { scale: !highlight },
    data: names.map((name, i) => ({
      name,
      value: totals[i],
      itemStyle: { color: paletteColor(colors.palette, i), opacity: highlight ? FADED_OPACITY : 1 },
    })),
  };

  const angles = pieSliceAngles(totals);
  const highlightSeries: CustomSeriesOption | null = highlight && {
    name: "Highlighted",
    type: "custom",
    coordinateSystem: "none",
    data: names.map((_, i) => i),

    renderItem: (params, api) => {
      const i = params.dataIndex;
      const slice = angles[i];
      if (!slice || highlight[i] <= 0) return null;
      const width = api.getWidth();
      const height = api.getHeight();
      const half = Math.min(width, height) / 2;
      const r0 = half * INNER_RADIUS;
      return {
        type: "sector",
        shape: {
          cx: width * CENTER_X,
          cy: height * CENTER_Y,
          r0,
          r: highlightRadius(r0, half * OUTER_RADIUS, totals[i], highlight[i]),
          startAngle: slice.startAngle,
          endAngle: slice.endAngle,
          clockwise: true,
        },
        style: {
          fill: paletteColor(colors.palette, i),
          stroke: colors.tooltipBg,
          lineWidth: BORDER_WIDTH,
        },
      };
    },
  };

  const option: EChartsOption = {
    backgroundColor: "transparent",
    textStyle: { color: colors.text },
    title: { text: title, textStyle: { color: colors.text } },
    tooltip: {
      trigger: "item",
      backgroundColor: colors.tooltipBg,
      borderColor: colors.tooltipBorder,
      textStyle: { color: colors.text },

      formatter: (params: unknown) => {
        const i = (params as { dataIndex: number }).dataIndex;
        return formatHighlightTooltip(names[i], totals[i], highlight ? highlight[i] : null);
      },
    },

    series: highlightSeries ? [pie, highlightSeries] : [pie],
  };

  const onEvents = {
    click: (params: { componentType: string; dataIndex: number }) => {
      if (params.componentType !== "series") return;
      const name = names[params.dataIndex];
      if (name !== undefined) onClick?.(name);
    },
  };

  return (
    <div className="donut-chart">
      <div className="donut-chart-canvas">
        <ReactECharts
          option={option}
          onEvents={onEvents}
          style={{ height: "100%", width: "100%" }}
          notMerge
          lazyUpdate
        />
      </div>
      {/* Categories wrap into rows; above the max height the list scrolls. */}
      <div className="donut-legend">
        {names.map((name, i) => (
          <button
            key={name}
            type="button"
            className="donut-legend-item"
            title={formatHighlightTooltip(names[i], totals[i], highlight ? highlight[i] : null)}
            onClick={() => onClick?.(name)}
          >
            <span className="donut-legend-swatch" style={{ background: paletteColor(colors.palette, i) }} />
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
