import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  useAppData,
  useCommittedFilters,
  useMediaAnalyticsFilters,
} from "@/hooks/usePageFilters";
import { mediaAnalyticsQueryOptions } from "@/lib/api/queries";
import { buildMediaAnalyticsParams } from "@/lib/api/queryKeys";
import { effectiveMediaCrossFilter } from "@/lib/filters/pageFilters";
import {
  buildMediaChartTotals,
  withMediaHighlight,
} from "@/lib/media/mediaCharts";
import type { MediaArticle } from "@/types/api/display";
import type { MediaCrossSelection } from "@/types/filters";

const NO_ROWS: readonly MediaArticle[] = [];

/**
 * Media Analytics articles for the committed date range. `params` is `null`
 * (and the query idle) until both dates are set. Same pattern as
 * `useFxPerformance`: one request, one cached result, and the previous result
 * as placeholder while a new range loads (`query.isPlaceholderData`).
 */
export function useMediaAnalytics() {
  const committed = useCommittedFilters(useAppData().filters.mediaAnalytics);
  const params = useMemo(() => buildMediaAnalyticsParams(committed), [committed]);
  const query = useQuery(mediaAnalyticsQueryOptions(params));
  return { params, query };
}

/**
 * Everything the Media Analytics page displays, for the data currently shown
 * (which may be the previous range's placeholder while a new range loads):
 * - `crossFilter` is the stored cross-filter only if it was picked from this
 *   data; otherwise `null`;
 * - totals are recomputed only when the articles change;
 * - the highlight is recomputed when the cross-filter changes, without any
 *   API request;
 * - `toggleCrossFilter` tags a click with the shown data's date range.
 * The table receives all `rows` and the `crossFilter`; it filters itself.
 */
export function useMediaAnalyticsView() {
  const { params, query } = useMediaAnalytics();
  const { crossFilter: stored, toggleCrossFilter: toggleStored } =
    useMediaAnalyticsFilters();
  const data = query.data;
  const rows = data?.rows ?? NO_ROWS;
  const range = data?.range ?? null;

  const crossFilter = useMemo(
    () => effectiveMediaCrossFilter(stored, range),
    [stored, range],
  );
  const toggleCrossFilter = useCallback(
    (clicked: MediaCrossSelection) => {
      if (range !== null) toggleStored({ ...clicked, range });
    },
    [range, toggleStored],
  );

  const totals = useMemo(() => buildMediaChartTotals(rows), [rows]);
  const chartData = useMemo(
    () => withMediaHighlight(rows, totals, crossFilter),
    [rows, totals, crossFilter],
  );

  return { params, query, rows, crossFilter, toggleCrossFilter, chartData };
}
