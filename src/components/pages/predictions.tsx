import type { RouteConfig } from "@/types/navigation";
import { CurrencySelect } from "../ui/built_ui/currencySelect";
import { useFxPerformanceFilters } from "@/hooks/usePageFilters";
import { useFxPerformance } from "@/hooks/api/useFxPerformance";
import { FilterBox, FilterField } from "../ui/built_ui/FilterBox";
import { SmoothLineChart } from "../Charts/SmoothLineChart";

type PredictionsProps = {
  route: RouteConfig;
};

export function PredictionsPage({ route }: PredictionsProps) {
    const { filters, setFilters } = useFxPerformanceFilters();
    const { params, query } = useFxPerformance();

    const hasSelection = params !==null;
  return (
    <section aria-label={route.title}>

    <FilterBox>
        <FilterField label="Base currency">
            <CurrencySelect value={filters.baseCurrency} onChange={(b)=> setFilters({baseCurrency:b})}/>
        </FilterField>
        <FilterField label="Target currency">
            <CurrencySelect value={filters.targetCurrency} onChange={(t)=> setFilters({targetCurrency:t})}/>
        </FilterField>
    </FilterBox>
    
        {!hasSelection ? (
        <p>Select a currency pair.</p>
        ) : query.isError ? (
        <p>Error while loading: {String(query.error)}</p>
        ) : query.data ? (
            <div className="chart-panel">
                <SmoothLineChart dates={query.data.charts.lineChart_X} values={query.data.charts.lineChart_Y_data} onClick={(date)=> setFilters({startDate:date, toDate: date})} />
            </div>
        ) : (
        <p>Loading...</p>
        )}

    </section>
  );
}