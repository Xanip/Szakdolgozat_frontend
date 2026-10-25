import type { RouteConfig } from "@/types/navigation";
import { CurrencySelect } from "../ui/built_ui/currencySelect";
import { useFxPerformanceFilters } from "@/hooks/usePageFilters";
import { useFxPerformance } from "@/hooks/api/useFxPerformance";
import { FxPerformanceContent } from "./content/fx_performance_content";
import { FromTodayDatePicker } from "../ui/built_ui/fromTodayDatePicker";

type FxPerformancePageProps = {
  route: RouteConfig;
};

export function FxPerformancePage({ route }: FxPerformancePageProps) {
    const { filters, setFilters } = useFxPerformanceFilters();
    const { params, query } = useFxPerformance();


    const Icon = route.icon;
    const hasSelection = params !==null;
  return (
    <section aria-labelledby="placeholder-title">
      <div className="placeholder-icon">
        <Icon aria-hidden="true" />
      </div>
      <h2 id="placeholder-title">{route.title}</h2>

    <div>
        <CurrencySelect value={filters.baseCurrency} onChange={(b)=> setFilters({baseCurrency:b})}/>
        <CurrencySelect value={filters.targetCurrency} onChange={(t)=> setFilters({targetCurrency:t})}/>
        <FromTodayDatePicker onChange={(d)=>setFilters({startDate:d})} />
    </div>
    
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
