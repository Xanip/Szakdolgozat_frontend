import type { RouteConfig } from "@/types/navigation";
import { FilterBox, FilterField } from "../ui/built_ui/FilterBox";
import { MediaAnalyticsContent } from "./content/media_analytics_content";

type MediaAnalyticsPageProps = {
  route: RouteConfig;
};

export function MediaAnalyticsPage({ route }: MediaAnalyticsPageProps) {
  // TODO: wire up useMediaAnalyticsFilters() and useMediaAnalytics() (params, query) following the fx_performance / daily_heatmap pattern.

  return (
    <section aria-label={route.title}>

    <FilterBox>
        <FilterField label="Filters">
            {/* TODO: filter controls (e.g. category, period) */}
            <span className="text-xs text-muted-foreground">Coming soon</span>
        </FilterField>
    </FilterBox>

        {/* TODO: loading / error / no-selection states once the query is wired up */}
        <MediaAnalyticsContent />

    </section>
  );
}
