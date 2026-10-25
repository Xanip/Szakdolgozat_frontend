import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAppData, useCommittedFilters } from "@/hooks/usePageFilters";
import { mediaAnalyticsQueryOptions } from "@/lib/api/queries";
import {
  buildMediaFilteredParams,
  buildMediaMainParams,
} from "@/lib/api/queryKeys";

/**
 * Media Analytics `main` and `filtered` data as two separate queries.
 * The cross-filtered request only starts once the main data for the same
 * date range is available (a cross-filter is always applied to main data).
 */
export function useMediaAnalytics() {
  const committed = useCommittedFilters(useAppData().filters.mediaAnalytics);
  const mainParams = useMemo(() => buildMediaMainParams(committed), [committed]);
  const filteredParams = useMemo(
    () => buildMediaFilteredParams(committed),
    [committed],
  );

  const main = useQuery(mediaAnalyticsQueryOptions(mainParams));
  const filtered = useQuery({
    ...mediaAnalyticsQueryOptions(filteredParams),
    enabled: main.data !== undefined,
  });

  return { mainParams, filteredParams, main, filtered };
}
