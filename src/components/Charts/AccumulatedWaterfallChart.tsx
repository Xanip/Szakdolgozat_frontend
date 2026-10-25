import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

interface WaterfallItem {
  name: string;
  value: number;
}

interface AccumulatedWaterfallProps {
  data: WaterfallItem[];
  title?: string;
}

export function AccumulatedWaterfallChart({
  data,
  title = "Accumulated change",
}: AccumulatedWaterfallProps) {
  let runningTotal = 0;

  const helper: number[] = [];
  const increases: (number | string)[] = [];
  const decreases: (number | string)[] = [];

  data.forEach((item, index) => {
    const previousTotal = runningTotal;
    runningTotal += item.value;

    if (index === 0) {
      helper.push(0);
    } else {
      helper.push(
        item.value >= 0 ? previousTotal : runningTotal
      );
    }

    if (item.value >= 0) {
      increases.push(item.value);
      decreases.push("-");
    } else {
      increases.push("-");
      decreases.push(-item.value);
    }
  });

  const option: EChartsOption = {
    title: { text: title },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
    },
    grid: {
      left: 24,
      right: 24,
      top: 60,
      bottom: 50,
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: data.map((item) => item.name),
      axisTick: { alignWithLabel: true },
    },
    yAxis: {
      type: "value",
      scale: true,
    },
    series: [
      {
        name: "Helper",
        type: "bar",
        stack: "total",
        itemStyle: {
          color: "transparent",
          borderColor: "transparent",
        },
        emphasis: {
          itemStyle: {
            color: "transparent",
            borderColor: "transparent",
          },
        },
        tooltip: { show: false },
        data: helper,
      },
      {
        name: "Increase",
        type: "bar",
        stack: "total",
        data: increases,
      },
      {
        name: "Decrease",
        type: "bar",
        stack: "total",
        data: decreases,
        itemStyle: {
          color: "#dc6464",
        },
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