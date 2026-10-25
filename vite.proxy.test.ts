/**
 * Verifies the development proxy forwards `/api/*` to the backend with the
 * prefix stripped, matching nginx (`location /api/ { proxy_pass .../; }`).
 * The integration test runs a real Vite dev server against a stub backend.
 */
import { mkdtemp, rm } from "node:fs/promises";
import { createServer as createHttpServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";

import { createServer, type ViteDevServer } from "vite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { apiClient, ENDPOINTS } from "./src/lib/api/client.ts";
import viteConfig from "./vite.config.ts";
import {
  API_PROXY_CONTEXT,
  createApiProxy,
  DEFAULT_API_PROXY_TARGET,
  rewriteApiPath,
} from "./vite.proxy.ts";

describe("rewriteApiPath", () => {
  it("strips the /api prefix and keeps the query string", () => {
    expect(rewriteApiPath("/api/exchange-rates/pages/FX_performance")).toBe(
      "/exchange-rates/pages/FX_performance",
    );
    expect(
      rewriteApiPath("/api/exchange-rates/pages/Daily_heatmap?Currencies=HUF&Currencies=USD"),
    ).toBe("/exchange-rates/pages/Daily_heatmap?Currencies=HUF&Currencies=USD");
    expect(rewriteApiPath("/api/")).toBe("/");
  });

  it("leaves non-API paths untouched", () => {
    expect(rewriteApiPath("/apix/pages")).toBe("/apix/pages");
    expect(rewriteApiPath("/exchange-rates/pages")).toBe("/exchange-rates/pages");
  });
});

describe("vite.config.ts", () => {
  it("proxies /api/ to http://localhost:8000 with the prefix rewrite", () => {
    expect(DEFAULT_API_PROXY_TARGET).toBe("http://localhost:8000");
    expect(viteConfig.server?.proxy).toEqual(createApiProxy());
    const proxy = createApiProxy()[API_PROXY_CONTEXT];
    expect(proxy.target).toBe("http://localhost:8000");
    expect(proxy.rewrite).toBe(rewriteApiPath);
  });
});

describe("dev proxy integration", () => {
  const received: string[] = [];
  let backend: Server;
  let vite: ViteDevServer;
  let root: string;
  let viteUrl: string;

  beforeAll(async () => {
    backend = createHttpServer((request, response) => {
      received.push(request.url ?? "");
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ path: request.url }));
    });
    await new Promise<void>((resolve) => backend.listen(0, "127.0.0.1", resolve));
    const backendPort = (backend.address() as AddressInfo).port;

    root = await mkdtemp(path.join(tmpdir(), "vite-proxy-test-"));
    vite = await createServer({
      configFile: false,
      root,
      logLevel: "silent",
      appType: "custom",
      optimizeDeps: { noDiscovery: true, include: [] },
      server: {
        host: "127.0.0.1",
        port: 0,
        ws: false,
        watch: null,
        proxy: createApiProxy(`http://127.0.0.1:${backendPort}`),
      },
    });
    await vite.listen();
    const vitePort = (vite.httpServer!.address() as AddressInfo).port;
    viteUrl = `http://127.0.0.1:${vitePort}`;
  });

  afterAll(async () => {
    await vite?.close();
    await new Promise((resolve) => backend?.close(resolve));
    if (root) await rm(root, { recursive: true, force: true });
  });

  it("forwards client requests to the backend path without /api", async () => {
    // Exactly the URL the app's Axios client builds for a heatmap request.
    const clientUrl = apiClient.getUri({
      url: ENDPOINTS.dailyHeatmap,
      params: { Currencies: ["HUF", "USD", "EUR"] },
    });
    expect(clientUrl).toBe(
      "/api/exchange-rates/pages/Daily_heatmap?Currencies=HUF&Currencies=USD&Currencies=EUR",
    );

    const response = await fetch(`${viteUrl}${clientUrl}`);
    expect(response.status).toBe(200);
    expect(received).toEqual([
      "/exchange-rates/pages/Daily_heatmap?Currencies=HUF&Currencies=USD&Currencies=EUR",
    ]);
  });
});
