import type { RouteConfig } from "@/types/navigation";
import { CurrencySelect } from "../ui/built_ui/currencySelect";
import { usePredictionFilters } from "@/hooks/usePageFilters";
import { usePredictions } from "@/hooks/api/usePredictions";
import { FilterBox, FilterField } from "../ui/built_ui/FilterBox";
import { PredictionLineChart } from "../Charts/PredictionLineChart";
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue,} from "@/components/ui/select";

type PredictionsProps = {
  route: RouteConfig;
};

export function PredictionsPage({ route }: PredictionsProps) {
  const { filters, setFilters } = usePredictionFilters();
  const { params, query } = usePredictions();

  const hasSelection = params !==null;
  const data = query.data ?? null;

  // Filter is unavailable when forecast data is not present.
  const modes = data?.modes ?? [];
  const modesReady = modes.length > 0;

  // History is hsown when forecast is empty, but there is history data
  const activeMode =filters.predictionMode !== null && modes.includes(filters.predictionMode)
      ? filters.predictionMode
      : null;
  const prediction = activeMode && data ? data.byMode[activeMode] ?? null : null;

  return (
    <section aria-label={route.title}>
      <FilterBox>
        <FilterField label="Base currency">
          <CurrencySelect value={filters.baseCurrency} onChange={(b) => setFilters({ baseCurrency: b })}/>
        </FilterField>
        <FilterField label="Target currency">
          <CurrencySelect value={filters.targetCurrency} onChange={(t) => setFilters({ targetCurrency: t })}/>
        </FilterField>
        <FilterField label="Prediction model">
          <Select value={activeMode} onValueChange={(m) => setFilters({ predictionMode: m ?? null })} disabled={!modesReady}>
            <SelectTrigger className="w-48" aria-label="Prediction model">
              <SelectValue placeholder={modesReady ? "History only" : "No models available"}/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>History only</SelectItem>
              {modes.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
      </FilterBox>

      {!hasSelection ? (
        <p>Select a currency pair.</p>
      ) : query.isError ? (
        <p>Error while loading: {String(query.error)}</p>
      ) : data ? (
        <div className="chart-panel prediction-chart-panel" style={{ opacity: query.isPlaceholderData ? 0.6 : 1 }}>
          <PredictionLineChart history={data.history} prediction={prediction} />
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </section>
  );
}