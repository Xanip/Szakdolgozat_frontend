import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAppData, useCommittedFilters } from "@/hooks/usePageFilters";
import { fxPerformanceQueryOptions } from "@/lib/api/queries";
import { buildFxPerformanceParams } from "@/lib/api/queryKeys";

/**
 * FX Performance data for the committed filters. `params` is `null` (and the
 * query idle) until both currencies are selected.
 */
export function useFxPerformance() {
  const committed = useCommittedFilters(useAppData().filters.fxPerformance);
  const params = useMemo(() => buildFxPerformanceParams(committed), [committed]);
  const query = useQuery(fxPerformanceQueryOptions(params));
  return { params, query };
}
