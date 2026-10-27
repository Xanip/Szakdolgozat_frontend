import { useMemo, useRef, type CSSProperties } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

/*
 * Daily percent-change heatmap.
 *
 *      Virtualized grid instead of an ECharts canvas, for better user experiance:
 *      - only the visible cells exist, so it stay fast even with large data.
 *      - the currency labels live in headers, that follow scrolling.
 *      - colors come from the index.css, so the color themes work.
 */

const CELL_HEIGHT = 30;
const CELL_WIDTH = 50;
const ROW_HEADER_WIDTH = 60;
const COLUMN_HEADER_HEIGHT = 40;

// Share of cells (by |change|) that fit inside the color scale; the rest saturate. 
// This is for keeping a few outlier values from affecting the cell coloring too much.
const SCALE_QUANTILE = 0.95;

// Magnitude that maps to full color intensity.
export function colorScale(matrix: (number | null)[][]): number {
  const magnitudes: number[] = [];
  for (const row of matrix) {
    for (const value of row) {
      if (value !== null && value !== 0) magnitudes.push(Math.abs(value));
    }
  }
  if (magnitudes.length === 0) return 0.0001;
  magnitudes.sort((a, b) => a - b);
  const index = Math.min(magnitudes.length - 1, Math.floor(magnitudes.length * SCALE_QUANTILE));
  return Math.max(magnitudes[index], 0.0001);
}

export function formatPercent(fraction: number): string {
  return `${fraction > 0 ? "+" : ""}${(fraction * 100).toFixed(2)}%`;
}

interface HeatmapChartProps {
  x_currencies_target: string[] | null;
  y_currencies_base: string[] | null;
  data: (number | null)[][] | null;
  title?: string;
  calculationDate?: string | null;
}

// Background coloring for a cell, which mixes the colors toward red/green by intensity.
function cellStyle(value: number, scale: number): CSSProperties {
  const intensity = Math.min(1, Math.abs(value) / scale);
  const tone = value < 0 ? "var(--heatmap-negative)" : "var(--heatmap-positive)";
  return {
    background: `color-mix(in oklab, ${tone} ${Math.round(intensity * 100)}%, var(--heatmap-neutral))`,
    color: intensity > 0.55 ? "var(--heatmap-text-strong)" : "var(--heatmap-text)",
  };
}

export default function HeatmapChart({
  x_currencies_target,
  y_currencies_base,
  data,
  title = "Daily Exchange Rate Changes",
  calculationDate,
}: HeatmapChartProps) {
  const columns = x_currencies_target ?? [];
  const rows = y_currencies_base ?? [];
  const matrix = data ?? [];

  const scrollRef = useRef<HTMLDivElement>(null);
  const scale = useMemo(() => colorScale(matrix), [matrix]);

  // scrollMargin = space taken by the sticky header in front of the cells.
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => CELL_HEIGHT,
    scrollMargin: COLUMN_HEADER_HEIGHT,
    overscan: 6,
  });
  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: columns.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => CELL_WIDTH,
    scrollMargin: ROW_HEADER_WIDTH,
    overscan: 4,
  });

  if (columns.length === 0 || rows.length === 0 || matrix.length === 0) {
    return <p className="heatmap-empty">No heatmap data available.</p>;
  }

  const visibleRows = rowVirtualizer.getVirtualItems();
  const visibleColumns = columnVirtualizer.getVirtualItems();

  // Virtual item positions include scrollMargin; convert to body-relative offsets.
  const rowTop = (start: number) => start - COLUMN_HEADER_HEIGHT;
  const columnLeft = (start: number) => start - ROW_HEADER_WIDTH;

  const bodyWidth = columns.length * CELL_WIDTH;
  const bodyHeight = rows.length * CELL_HEIGHT;

  return (
    <figure className="heatmap">
      <figcaption className="heatmap-head">
        <div>
          <h2 className="heatmap-title">{title}</h2>
          {calculationDate ? <p className="heatmap-subtitle">Calculated for {calculationDate.replaceAll("-",". ")}</p> : null}
        </div>
        <div className="heatmap-legend" aria-label={`Color scale from ${formatPercent(-scale)} to ${formatPercent(scale)}`}>
          <span>≤ {formatPercent(-scale)}</span>
          <span className="heatmap-legend-bar" aria-hidden="true" />
          <span>≥ {formatPercent(scale)}</span>
        </div>
      </figcaption>

      <div
        ref={scrollRef}
        className="heatmap-scroll"
        tabIndex={0}
        aria-label={`${title}: ${rows.length} base currencies by ${columns.length} target currencies`}
      >
        <div style={{ width: ROW_HEADER_WIDTH + bodyWidth, height: COLUMN_HEADER_HEIGHT + bodyHeight }}>

          {/* Sticky column header */}
          <div className="heatmap-col-header" style={{ height: COLUMN_HEADER_HEIGHT }}>
            <div className="heatmap-corner" style={{ width: ROW_HEADER_WIDTH }}>
              <span>Base</span>
              <span>Target</span>
            </div>
            {visibleColumns.map((column) => (
              <div
                key={column.key}
                className="heatmap-label heatmap-col-label"
                style={{ left: ROW_HEADER_WIDTH + columnLeft(column.start), width: CELL_WIDTH }}
              >
                {columns[column.index]}
              </div>
            ))}
          </div>

          <div className="heatmap-body" style={{ height: bodyHeight }}>
            
            {/* Sticky row header */}
            <div className="heatmap-row-header" style={{ width: ROW_HEADER_WIDTH }}>
              {visibleRows.map((row) => (
                <div
                  key={row.key}
                  className="heatmap-label heatmap-row-label"
                  style={{ top: rowTop(row.start), height: CELL_HEIGHT }}
                >
                  {rows[row.index]}
                </div>
              ))}
            </div>

            {/* Visible cells */}
            {visibleRows.map((row) =>
              visibleColumns.map((column) => {
                const value = matrix[row.index]?.[column.index] ?? null;
                const base = rows[row.index];
                const target = columns[column.index];
                const text = value === null ? "–" : formatPercent(value);
                return (
                  <div
                    key={`${row.key}:${column.key}`}
                    className={value === null ? "heatmap-cell heatmap-cell-empty" : "heatmap-cell"}
                    style={{
                      top: rowTop(row.start),
                      left: ROW_HEADER_WIDTH + columnLeft(column.start),
                      width: CELL_WIDTH,
                      height: CELL_HEIGHT,
                      ...(value === null ? null : cellStyle(value, scale)),
                    }}
                    title={`${base} → ${target}: ${value === null ? "no data" : text}`}
                  >
                    {text}
                  </div>
                );
              }),
            )}
          </div>
        </div>
      </div>
    </figure>
  );
}
