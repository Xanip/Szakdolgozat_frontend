import axios from "axios";

/**
 * Every API request goes through this prefix. In production Nginx forwards
 * `/api/*` to the backend with the prefix stripped (`nginx.conf`); in
 * development the Vite proxy does the same (`vite.proxy.ts`).
 */
export const API_BASE_URL = "/api";

/** Backend endpoint paths (relative to `API_BASE_URL`). */
export const ENDPOINTS = {
  dimensions: "/exchange-rates/pages",
  fxPerformance: "/exchange-rates/pages/FX_performance",
  dailyHeatmap: "/exchange-rates/pages/Daily_heatmap",
  mediaAnalytics: "/exchange-rates/pages/Media_analytics",
  predictions: "/exchange-rates/pages/Prediction"
} as const;

export type QueryParamValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly string[];

export type QueryParams = Readonly<Record<string, QueryParamValue>>;

/**
 * Central query-string serialization for all endpoints.
 * - `null` / `undefined` values are omitted (the backend treats a missing
 *   optional parameter as `None`).
 * - Arrays are emitted as repeated parameters:
 *   `{ Currencies: ["HUF", "USD"] }` → `Currencies=HUF&Currencies=USD`.
 * - Values are form-encoded (`URLSearchParams`), which FastAPI decodes.
 */
export function serializeQueryParams(params: QueryParams): string {
  const search = new URLSearchParams();
  for (const [name, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;
    if (typeof value === "object") {
      for (const item of value) search.append(name, item);
    } else {
      search.append(name, String(value));
    }
  }
  return search.toString();
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  paramsSerializer: { serialize: serializeQueryParams },
});

/** Transport used by the query functions; injectable for tests. */
export type HttpGet = (path: string, params?: QueryParams) => Promise<unknown>;

/**
 * GETs a JSON body as `unknown`. Axios' generic type parameter does not
 * validate anything, so callers must run the result through a validator.
 *
 * No `AbortSignal` is passed on purpose: TanStack Query cancels a fetch whose
 * signal was consumed when its last observer unmounts, and the Spec requires
 * that leaving a page does not stop a running request.
 */
export const getJson: HttpGet = async (path, params) => {
  const response = await apiClient.get<unknown>(path, { params });
  return response.data;
};
