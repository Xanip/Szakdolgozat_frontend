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
  /** Categorical colors from `--chart-1..5`. */
  palette: string[];
};

const PALETTE_VARIABLES = ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5"];

const VARIABLES: Record<Exclude<keyof ChartTheme, "palette">, string> = {
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
  const palette = PALETTE_VARIABLES.map((cssVar) => styles.getPropertyValue(cssVar).trim());
  return { ...Object.fromEntries(entries), palette } as ChartTheme;
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
