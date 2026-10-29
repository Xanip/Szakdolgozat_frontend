/*
 * Shared helpers of the charts that show a total and, optionally, a
 * highlighted part of it. The highlight helpers run only when a second,
 * highlighted array actually arrives (see `getHighlight`).
 */

/** Element-aligned input: `names[i]` has `totals[i]`, of which `highlighted[i]` is highlighted. */
export type ChartSeriesInput = {
  names: readonly string[];
  totals: readonly number[];
  highlighted?: readonly number[] | null;
};

/** Opacity of the total when a highlighted part is drawn in front of it. */
export const FADED_OPACITY = 0.25;

/**
 * The highlighted array, or `null` when there is none to show
 */
export function getHighlight(series: ChartSeriesInput): readonly number[] | null {
  const { highlighted, names } = series;
  if (!highlighted || highlighted.length !== names.length) return null;
  return highlighted;
}

/** Tooltip text: "Name: total" or, with a highlight, "Name: h / t (p%)". */
export function formatHighlightTooltip(
  name: string,
  total: number,
  highlighted: number | null,
): string {
  if (highlighted === null) return `${name}: ${total}`;
  const percent = total === 0 ? 0 : Math.round((highlighted / total) * 100);
  return `${name}: ${highlighted} / ${total} (${percent}%)`;
}

/** Palette color of the element at `index`, cycling through the palette. */
export function paletteColor(palette: readonly string[], index: number): string {
  return palette.length === 0 ? "" : palette[index % palette.length];
}

/** Angles of one pie slice in radians (zrender convention: 0 = 3 o'clock, growing clockwise). */
export type SliceAngles = { startAngle: number; endAngle: number };

/**
 * Slice angles as an ECharts pie lays them out with the defaults
 * (`startAngle: 90`, `clockwise: true`) and without `padAngle` / `minAngle`:
 * each slice gets `value / sum` of the full circle. Empty when the sum is 0.
 */
export function pieSliceAngles(totals: readonly number[]): SliceAngles[] {
  const sum = totals.reduce((a, b) => a + b, 0);
  if (sum <= 0) return [];
  let current = -Math.PI / 2;
  return totals.map((total) => {
    const startAngle = current;
    current += (total / sum) * Math.PI * 2;
    return { startAngle, endAngle: current };
  });
}

/**
 * Outer radius of a highlight drawn on a ring from `r0` to `r`: it starts at
 * `r0` and fills `highlighted / total` of the ring's thickness (clamped to 0..1).
 */
export function highlightRadius(r0: number, r: number, total: number, highlighted: number): number {
  const ratio = total <= 0 ? 0 : Math.min(Math.max(highlighted / total, 0), 1);
  return r0 + (r - r0) * ratio;
}
