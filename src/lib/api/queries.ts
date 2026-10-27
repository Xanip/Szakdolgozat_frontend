import { keepPreviousData, queryOptions, skipToken } from "@tanstack/react-query";

import { ENDPOINTS, getJson, type HttpGet, type QueryParams } from "@/lib/api/client";
import { processDailyHeatmap } from "@/lib/api/processors/dailyHeatmap";
import { processDimensions } from "@/lib/api/processors/dimensions";
import { processFxPerformance } from "@/lib/api/processors/fxPerformance";
import { processMediaAnalytics } from "@/lib/api/processors/mediaAnalytics";
import {
  queryKeys,
  type DailyHeatmapParams,
  type FxPerformanceParams,
  type MediaAnalyticsParams,
} from "@/lib/api/queryKeys";
import { validateDailyHeatmapResponse } from "@/lib/api/validators/dailyHeatmap";
import { validateDimensionsResponse } from "@/lib/api/validators/dimensions";
import { validateFxPerformanceResponse } from "@/lib/api/validators/fxPerformance";
import { validateMediaAnalyticsResponse } from "@/lib/api/validators/mediaAnalytics";

type EndpointPipeline<TRaw, TData> = {
  path: string;
  params?: QueryParams;
  validate: (body: unknown) => TRaw;
  process: (raw: TRaw) => TData;
  http?: HttpGet;
};

/**
 * Builds a query function: fetch (`unknown`) → validate → process.
 * Any failure (transport, validation, processing) rejects the query, so only
 * fully processed data can reach the cache. The query-function context (and
 * its abort signal) is intentionally not used; see `getJson`.
 */
export function createEndpointQueryFn<TRaw, TData>({
  path,
  params,
  validate,
  process,
  http = getJson,
}: EndpointPipeline<TRaw, TData>): () => Promise<TData> {
  return async () => {
    const body = await http(path, params);
    return process(validate(body));
  };
}

export function dimensionsQueryOptions(http?: HttpGet) {
  return queryOptions({
    queryKey: queryKeys.dimensions(),
    queryFn: createEndpointQueryFn({
      path: ENDPOINTS.dimensions,
      validate: validateDimensionsResponse,
      process: processDimensions,
      http,
    }),
  });
}

export function fxPerformanceQueryOptions(
  params: FxPerformanceParams | null,
  http?: HttpGet,
) {
  return queryOptions({
    queryKey: queryKeys.fxPerformance(params),
      placeholderData: keepPreviousData,
    queryFn: params
      ? createEndpointQueryFn({
          path: ENDPOINTS.fxPerformance,
          params,
          validate: validateFxPerformanceResponse,
          process: processFxPerformance,
          http,
        })
      : skipToken,
  });
}

export function dailyHeatmapQueryOptions(
  params: DailyHeatmapParams | null,
  http?: HttpGet,
) {
  return queryOptions({
    queryKey: queryKeys.dailyHeatmap(params),
          placeholderData: keepPreviousData,
    queryFn: params
      ? createEndpointQueryFn({
          path: ENDPOINTS.dailyHeatmap,
          params,
          validate: validateDailyHeatmapResponse,
          process: processDailyHeatmap,
          http,
        })
      : skipToken,
  });
}

/** Articles of the date range. Cross-filters are applied on the frontend.*/
export function mediaAnalyticsQueryOptions(
  params: MediaAnalyticsParams | null,
  http?: HttpGet,
) {
  return queryOptions({
    queryKey: queryKeys.mediaAnalytics(params),
    placeholderData: keepPreviousData,
    queryFn: params
      ? createEndpointQueryFn({
          path: ENDPOINTS.mediaAnalytics,
          params,
          validate: validateMediaAnalyticsResponse,
          process: (raw) =>processMediaAnalytics(raw, {startDate: params.StartDate,toDate: params.ToDate,}),
          http,
        })
      : skipToken,
  });
}
