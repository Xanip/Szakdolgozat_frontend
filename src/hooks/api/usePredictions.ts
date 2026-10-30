import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAppData, useCommittedFilters } from "@/hooks/usePageFilters";
import { predictionQueryOptions } from "@/lib/api/queries";
import { buildPredictionParams } from "@/lib/api/queryKeys";

/**
 * Prediction data for the committed filters. `params` is `null` (and the
 * query idle) until both currencies are selected. The selected prediction
 * mode is a client-side filter and intentionally not part of `params`, so
 * changing it never starts a request.
 */
export function usePredictions() {
  const committed = useCommittedFilters(useAppData().filters.prediction);
  const params = useMemo(() => buildPredictionParams(committed), [committed]);
  const query = useQuery(predictionQueryOptions(params));
  return { params, query };
}