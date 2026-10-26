import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { useChartTheme } from "@/hooks/useChartTheme";

function getMonthDateRange(yearMonth: string) {
  const [year, month] = yearMonth.split("-").map(Number);

  const startDate =
    `${yearMonth}-01`;

  // A JavaScript Date hónapindexe 0-tól indul.
  // A következő hónap 0. napja az aktuális hónap utolsó napja.
  const lastDay = new Date(year, month, 0).getDate();

  const toDate =
    `${yearMonth}-${String(lastDay).padStart(2, "0")}`;

  return {
    startDate,
    toDate,
  };
}

interface WaterfallItem {
  name: string;
  value: number;
}

interface AccumulatedWaterfallProps {
  data: WaterfallItem[];
  title?: string;
  onClick?: (startDate: string, endDate:string) => void;
}

export function AccumulatedWaterfallChart({
  data,
  title = "Accumulated change",
  onClick
}: AccumulatedWaterfallProps) {
  const colors = useChartTheme();
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
    backgroundColor: "transparent",
    textStyle: { color: colors.text },
    title: { text: title, textStyle: { color: colors.text } },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: colors.tooltipBg,
      borderColor: colors.tooltipBorder,
      textStyle: { color: colors.text },
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
        itemStyle: {
          color: colors.increase,
        },
      },
      {
        name: "Decrease",
        type: "bar",
        stack: "total",
        data: decreases,
        itemStyle: {
          color: colors.decrease,
        },
      },
    ],
  };


    const onEvents = {

        click: (params: { componentType: string; dataIndex: number }) => {
          if (params.componentType !== "series") return;

          const chosenWaterfallItem = data[params.dataIndex];
          const dates = getMonthDateRange(chosenWaterfallItem.name)
          if (dates !== undefined) {
            onClick?.(dates.startDate, dates.toDate);
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