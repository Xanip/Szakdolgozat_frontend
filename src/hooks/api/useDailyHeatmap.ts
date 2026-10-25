import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAppData, useCommittedFilters } from "@/hooks/usePageFilters";
import { dailyHeatmapQueryOptions } from "@/lib/api/queries";
import { buildDailyHeatmapParams } from "@/lib/api/queryKeys";

/** Daily Heatmap data for the committed currency selection. */
export function useDailyHeatmap() {
  const committed = useCommittedFilters(useAppData().filters.dailyHeatmap);
  const params = useMemo(() => buildDailyHeatmapParams(committed), [committed]);
  const query = useQuery(dailyHeatmapQueryOptions(params));
  return { params, query };
}
