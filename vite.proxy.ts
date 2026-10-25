import type { ProxyOptions } from "vite";

/**
 * Development proxy for API calls, mirroring `nginx.conf`:
 *
 *   location /api/ { proxy_pass http://backend:8000/; }
 *
 * Nginx replaces the matched `/api/` prefix with `/`, so the browser request
 * `/api/exchange-rates/pages` reaches the backend as `/exchange-rates/pages`.
 * The Vite dev server does the same, forwarding to the locally running backend.
 */
export const DEFAULT_API_PROXY_TARGET = "http://localhost:8000";

/** Regex context (Vite treats keys starting with `^` as RegExp): `/api/...` only. */
export const API_PROXY_CONTEXT = "^/api/";

/** `/api/<path>?<query>` → `/<path>?<query>`; other paths are untouched. */
export function rewriteApiPath(path: string): string {
  return path.replace(/^\/api\//, "/");
}

export function createApiProxy(
  target: string = DEFAULT_API_PROXY_TARGET,
): Record<string, ProxyOptions> {
  return {
    [API_PROXY_CONTEXT]: {
      target,
      changeOrigin: true,
      rewrite: rewriteApiPath,
    },
  };
}
