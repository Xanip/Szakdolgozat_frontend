import type { RouteConfig } from "@/types/navigation";
import { CurrencySelect } from "../ui/built_ui/currencySelect";
import { useFxPerformanceFilters } from "@/hooks/usePageFilters";
import { useFxPerformance } from "@/hooks/api/useFxPerformance";
import { FxPerformanceContent } from "./content/fx_performance_content";
import { FromTodayDatePicker } from "../ui/built_ui/fromTodayDatePicker";
import { FilterBox, FilterField } from "../ui/built_ui/FilterBox";

type FxPerformancePageProps = {
  route: RouteConfig;
};

export function FxPerformancePage({ route }: FxPerformancePageProps) {
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
        <FilterField label="Period">
            <FromTodayDatePicker onChange={(d)=>setFilters({startDate:d, toDate:null})} />
        </FilterField>
    </FilterBox>
    
        {!hasSelection ? (
        <p>Select a currency pair.</p>
        ) : query.isError ? (
        <p>Error while loading: {String(query.error)}</p>
        ) : query.data ? (
            <div style={{ opacity: query.isPlaceholderData ? 0.6 : 1 }}>
            <FxPerformanceContent data={query.data} />
            </div>
        ) : (
        <p>Loading...</p>
        )}

    </section>
  );
}
