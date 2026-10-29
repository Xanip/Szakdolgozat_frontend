import type { RouteConfig } from "@/types/navigation";
import { FilterBox, FilterField } from "../ui/built_ui/FilterBox";
import { MediaAnalyticsContent } from "./content/media_analytics_content";
import { useMediaAnalyticsFilters } from "@/hooks/usePageFilters";
import { CalendarDateRangePicker } from "../ui/built_ui/calendarDateRangePicker";
import { useMediaAnalyticsView } from "@/hooks/api/useMediaAnalytics";

type MediaAnalyticsPageProps = {
  route: RouteConfig;
};

export function MediaAnalyticsPage({ route }: MediaAnalyticsPageProps) {
  // TODO: wire up useMediaAnalyticsFilters() and useMediaAnalytics() (params, query) following the fx_performance / daily_heatmap pattern.
  const { filters, setDateRange} = useMediaAnalyticsFilters();
  const { params, query, rows, crossFilter, toggleCrossFilter, chartData } = useMediaAnalyticsView();
  const hasSelection = params !==null;

  return (
    <section aria-label={route.title}>

    <FilterBox>
        <FilterField label="Filters">
            {/* TODO: filter controls (e.g. category, period) */}
            <CalendarDateRangePicker value={{from:filters.startDate, to: filters.toDate}} onChange={(range)=>setDateRange(range.from, range.to)} />
        </FilterField>
    </FilterBox>

        {/* TODO: loading / error / no-selection states once the query is wired up */}
                {!hasSelection ? (
                <p>Select a currency pair.</p>
                ) : query.isError ? (
                <p>Error while loading: {String(query.error)}</p>
                ) : query.data ? (
                    <div style={{ opacity: query.isPlaceholderData ? 0.6 : 1 }}>
                    <MediaAnalyticsContent
                      analyticsData={query.data}
                      chartData={chartData}
                      rows={rows}
                      crossFilter={crossFilter}
                      onToggleCrossFilter={toggleCrossFilter}
                    />
                    </div>
                ) : (
                <p>Loading...</p>
                )}

    </section>
  );
}
