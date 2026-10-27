// TODO: replace with the real data type (e.g. MediaAnalyticsData from "@/types/api/display")

import { VirtualizedTable } from "@/components/Charts/VirtualizedTable";

// once the API endpoint and the useMediaAnalytics hook exist.
type MediaAnalyticsContentProps = {
  data?: unknown;
};

/** Placeholder for the Media Analytics page content (KPIs + charts will go here). */
export function MediaAnalyticsContent(_props: MediaAnalyticsContentProps) {
  return (
    <section aria-labelledby="media-analytics-content-title">
      <div className="kpi-grid">
        {/* TODO: KpiCard components */}
      </div>

      <div className="chart-grid">
        <div className="chart-panel">
          <p id="media-analytics-content-title">Media analytics content coming soon.</p>
          <VirtualizedTable />
        </div>
      </div>
    </section>
  );
}
