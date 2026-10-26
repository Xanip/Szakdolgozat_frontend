import { useEffect, useState } from "react";

/**
 * Chart colors resolved from the `--chart-*` CSS variables in `index.css`.
 * ECharts draws on a canvas and cannot read CSS variables itself, so the
 * values are read with getComputedStyle and re-read whenever the `dark`
 * class on <html> changes.
 */
export type ChartTheme = {
  line: string;
  increase: string;
  decrease: string;
  text: string;
  axis: string;
  grid: string;
  tooltipBg: string;
  tooltipBorder: string;
};

const VARIABLES: Record<keyof ChartTheme, string> = {
  line: "--chart-line",
  increase: "--chart-increase",
  decrease: "--chart-decrease",
  text: "--chart-text",
  axis: "--chart-axis",
  grid: "--chart-grid",
  tooltipBg: "--chart-tooltip-bg",
  tooltipBorder: "--chart-tooltip-border",
};

function readChartTheme(): ChartTheme {
  const styles = getComputedStyle(document.documentElement);
  const entries = Object.entries(VARIABLES).map(([key, cssVar]) => [key, styles.getPropertyValue(cssVar).trim()]);
  return Object.fromEntries(entries) as ChartTheme;
}

export function useChartTheme(): ChartTheme {
  const [theme, setTheme] = useState<ChartTheme>(readChartTheme);

  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(readChartTheme()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return theme;
}
