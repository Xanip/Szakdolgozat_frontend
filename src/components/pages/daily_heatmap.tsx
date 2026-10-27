import type { RouteConfig } from "@/types/navigation";
import { FilterBox, FilterField } from "../ui/built_ui/FilterBox";
import { MultipleCurrencySelect } from "../ui/built_ui/multipleCurrencySelect";
import { useDailyHeatmapFilters } from "@/hooks/usePageFilters";
import { useDailyHeatmap } from "@/hooks/api/useDailyHeatmap";
import HeatmapChart from "../Charts/HeatMap";

type DailyHeatmapsPageProps = {
  route: RouteConfig;
};

export function DailyHeatmapsPage({ route }: DailyHeatmapsPageProps) {
    const { filters, setCurrencies } = useDailyHeatmapFilters();
    const { params, query } = useDailyHeatmap();

    const hasSelection = params !==null;
  return (
    <section aria-label={route.title}>

    <FilterBox>
        <FilterField label="Target currencies">
            <MultipleCurrencySelect values={filters.currencies} onChange={(c)=> setCurrencies(c)}/>
        </FilterField>
    </FilterBox>
    
        {!hasSelection ? (
        <p>Select a currency pair.</p>
        ) : query.isError ? (
        <p>Error while loading: {String(query.error)}</p>
        ) : query.data ? (
            <div style={{ opacity: query.isPlaceholderData ? 0.6 : 1 }}>
            <HeatmapChart
                title="Daily Exchange Rate Percent Change Heatmap (DOM grid)"
                x_currencies_target={query.data.charts.X_FilterCurrencies}
                y_currencies_base={query.data.charts.Y_AllCurrencies}
                data={query.data.charts.matrics_data}
                calculationDate={query.data.kpi.currentDay}
            />
            </div>
        ) : (
        <p>Loading...</p>
        )}

    </section>
  );
}
