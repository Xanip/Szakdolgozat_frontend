// TODO: replace with the real data type (e.g. MediaAnalyticsData from "@/types/api/display")

import { VirtualizedTable } from "@/components/Charts/VirtualizedTable";
import type { MediaAnalyticsData, MediaArticle, MediaChartData } from "@/types/api/display";
import type { MediaCrossSelection } from "@/types/filters";

// once the API endpoint and the useMediaAnalytics hook exist.
type MediaAnalyticsContentProps = {
  analyticsData: MediaAnalyticsData;
  chartData: MediaChartData;
  rows: readonly MediaArticle[];
  crossFilter: MediaCrossSelection | null;
  onToggleCrossFilter: (clicked: MediaCrossSelection) => void;
};

/** Placeholder for the Media Analytics page content (KPIs + charts will go here). */
export function MediaAnalyticsContent({/*analyticsData,chartData,crossFilter,onToggleCrossFilter,*/rows}: MediaAnalyticsContentProps) {
  return (
    <section aria-labelledby="media-analytics-content-title">
      
      {/* TODO: Chart components */}
      

      <div className="chart-grid">
        <div>
          <VirtualizedTable 
              headers={["Date", "Source", "Category", "Title", "URL"]} 
              data={rows.map((row) => [row.Date, row.SourceName, row.CategoryName,row.Title, row.URL])}
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
