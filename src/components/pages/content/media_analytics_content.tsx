import { MediaBarChart } from "@/components/Charts/MediaBarChart";
import { DonutChart } from "@/components/Charts/DonutChart";
import { VirtualizedTable, type TableColumnFilter } from "@/components/Charts/VirtualizedTable";
import type { MediaAnalyticsData, MediaArticle, MediaChartData } from "@/types/api/display";
import type { MediaCrossSelection } from "@/types/filters";

type MediaAnalyticsContentProps = {
  analyticsData: MediaAnalyticsData;
  chartData: MediaChartData;
  rows: readonly MediaArticle[];
  crossFilter: MediaCrossSelection | null;
  onToggleCrossFilter: (clicked: MediaCrossSelection) => void;
};

const BAR_ROW_HEIGHT = 24;
const BAR_CHART_EXTRA_HEIGHT = 80;
const BAR_CHART_MIN_HEIGHT = 260;
const TABLE_HEADERS = ["Date", "Source", "Category", "Title", "URL"];

/** Table column the cross-filter applies to, by the clicked chart element's kind. */
const TABLE_COLUMN_BY_KIND: Readonly<Record<MediaCrossSelection["kind"], string>> = {
  source: "Source",
  category: "Category",
};

/** Media Analytics page content: charts with cross-filtering and the article table. */
export function MediaAnalyticsContent({ chartData, crossFilter, onToggleCrossFilter, rows }: MediaAnalyticsContentProps) {
  const tableFilters: TableColumnFilter[] = crossFilter ? 
    [{ column: TABLE_COLUMN_BY_KIND[crossFilter.kind], value: crossFilter.value }] : [];
  const { categories, sources } = chartData;
  const toggleCategory = (value: string) => onToggleCrossFilter({ kind: "category", value });
  const barChartHeight = Math.max(
    sources.names.length * BAR_ROW_HEIGHT + BAR_CHART_EXTRA_HEIGHT,
    BAR_CHART_MIN_HEIGHT,
  );

  return (
    <section aria-labelledby="media-analytics-content-title">
      <div className="chart-grid">
        <div className="media-chart-frame">
          <div className="media-chart-cell">
            <DonutChart {...categories} onClick={toggleCategory} />
          </div>
          <div className="media-chart-cell" style={{ overflowY: "auto" }}>
            <div style={{ height: barChartHeight }}>
              <MediaBarChart {...sources} onClick={(value) => onToggleCrossFilter({ kind: "source", value })} />
            </div>
          </div>
        </div>
        <div>
          <VirtualizedTable 
              headers={TABLE_HEADERS}
              data={rows.map((row) => [row.Date, row.SourceName, row.CategoryName,row.Title, row.URL])}
              columnFilters={tableFilters}
              columnWidths={[120,200,100,500,180]}
              renderCell={(value, _rowIndex,columnIndex) => {
                if (columnIndex === 4 && typeof value === "string") {
                  return (
                    <a href={value} target="_blank" rel="noopener noreferrer"> Click here for the Article! </a>
                  )
                }
                return String(value ?? "")
              }}
            />
        </div>
      </div>
    </section>
  );
}
