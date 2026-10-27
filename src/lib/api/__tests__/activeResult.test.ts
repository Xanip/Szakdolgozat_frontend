/**
 * Active-result lifecycle tests against a real QueryClient.
 *
 * A `QueryObserver` stands in for a page hook: after each committed filter
 * change the test calls `setOptions` with the new key, exactly what `useQuery`
 * does on re-render. Requests are resolved manually to control their order.
 */
import { QueryObserver, type QueryClient, type QueryKey } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import { createAppData } from "@/lib/appData";
import { createEndpointQueryFn, dimensionsQueryOptions, fxPerformanceQueryOptions, dailyHeatmapQueryOptions, mediaAnalyticsQueryOptions } from "@/lib/api/queries";
import {
  buildDailyHeatmapParams,
  buildFxPerformanceParams,
  buildMediaAnalyticsParams,
  getResultRole,
  queryKeys,
  type ResultRole,
} from "@/lib/api/queryKeys";
import { ResponseValidationError } from "@/lib/api/validators/guards";
import { processFxPerformance } from "@/lib/api/processors/fxPerformance";
import { processMediaAnalytics } from "@/lib/api/processors/mediaAnalytics";
import {
  effectiveMediaCrossFilter,
  toggleMediaCrossFilter,
  withMediaDateRange,
} from "@/lib/filters/pageFilters";
import { buildMediaChartData } from "@/lib/media/mediaCharts";
import type { FxPerformanceFilters, MediaCrossSelection } from "@/types/filters";

import {
  createControlledHttp,
  rawDimensions,
  rawFx,
  rawHeatmap,
  rawMedia,
  settle,
} from "./fixtures";

function entriesOf(client: QueryClient, role: ResultRole) {
  return client
    .getQueryCache()
    .getAll()
    .filter((query) => getResultRole(query.queryKey) === role);
}

function cached(client: QueryClient, key: QueryKey) {
  return client.getQueryCache().find({ queryKey: key, exact: true });
}

const fxKey = (baseCurrency: string, targetCurrency: string) =>
  queryKeys.fxPerformance(
    buildFxPerformanceParams({
      baseCurrency,
      targetCurrency,
      startDate: null,
      toDate: null,
    }),
  );

function fxHarness() {
  const transport = createControlledHttp();
  const { queryClient, filters } = createAppData();
  const store = filters.fxPerformance;
  const options = () =>
    fxPerformanceQueryOptions(
      buildFxPerformanceParams(store.getCommitted()),
      transport.http,
    );

  const observer = new QueryObserver(queryClient, options());
  const unsubscribe = observer.subscribe(() => {});

  /** User changes filters; the debounce elapses; the page re-renders. */
  const select = (patch: Partial<FxPerformanceFilters>) => {
    store.update((current) => ({ ...current, ...patch }));
    store.flush();
    observer.setOptions(options());
  };

  return { ...transport, queryClient, store, observer, unsubscribe, select, options };
}

describe("obsolete (late) requests", () => {
  it("an older, slower request finishing after a newer one is neither shown nor cached", async () => {
    const h = fxHarness();
    h.select({ baseCurrency: "USD", targetCurrency: "HUF" }); // request A
    const requestA = h.find({ TargetCurrency: "HUF" });

    h.select({ targetCurrency: "EUR" }); // request B, A still running
    const requestB = h.find({ TargetCurrency: "EUR" });
    expect(h.requests).toHaveLength(2);

    requestB.resolve(rawFx(2));
    await settle();
    expect(h.observer.getCurrentResult().data).toEqual(processFxPerformance(rawFx(2)));

    // A finishes late, after B became the active result.
    requestA.resolve(rawFx(1));
    await settle();

    expect(h.queryClient.getQueryData(fxKey("USD", "HUF"))).toBeUndefined();
    expect(cached(h.queryClient, fxKey("USD", "HUF"))).toBeUndefined();
    expect(h.observer.getCurrentResult().data).toEqual(processFxPerformance(rawFx(2)));
    expect(entriesOf(h.queryClient, "fxPerformance")).toHaveLength(1);
    h.unsubscribe();
  });

  it("an obsolete request finishing before the newer one is discarded too", async () => {
    const h = fxHarness();
    h.select({ baseCurrency: "USD", targetCurrency: "HUF" });
    const requestA = h.find({ TargetCurrency: "HUF" });
    h.select({ targetCurrency: "EUR" });

    requestA.resolve(rawFx(1));
    await settle();

    expect(cached(h.queryClient, fxKey("USD", "HUF"))).toBeUndefined();
    const current = h.observer.getCurrentResult();
    expect(current.data).toBeUndefined(); // B still loading, A never shown
    expect(current.isPending).toBe(true);

    h.find({ TargetCurrency: "EUR" }).resolve(rawFx(2));
    await settle();
    expect(h.observer.getCurrentResult().data).toEqual(processFxPerformance(rawFx(2)));
    h.unsubscribe();
  });

  it("when the newer request fails, a late older result is still not stored", async () => {
    const h = fxHarness();
    h.select({ baseCurrency: "USD", targetCurrency: "HUF" });
    const requestA = h.find({ TargetCurrency: "HUF" });
    h.select({ targetCurrency: "EUR" });

    h.find({ TargetCurrency: "EUR" }).reject(new Error("network"));
    await settle();
    requestA.resolve(rawFx(1));
    await settle();

    expect(cached(h.queryClient, fxKey("USD", "HUF"))).toBeUndefined();
    const current = h.observer.getCurrentResult();
    expect(current.isError).toBe(true);
    expect(current.data).toBeUndefined();
    h.unsubscribe();
  });
});

describe("navigation and cache", () => {
  it("a request finishes after leaving the page and is shown on return without refetch or reprocessing", async () => {
    const h = fxHarness();
    h.select({ baseCurrency: "USD", targetCurrency: "HUF" });
    h.unsubscribe(); // user navigates to another page

    h.find({ TargetCurrency: "HUF" }).resolve(rawFx(1));
    await settle();
    const stored = h.queryClient.getQueryData(fxKey("USD", "HUF"));
    expect(stored).toEqual(processFxPerformance(rawFx(1)));

    // User returns: a new observer (page mount) reads the cache immediately.
    const returned = new QueryObserver(h.queryClient, h.options());
    const unsubscribe = returned.subscribe(() => {});
    expect(returned.getCurrentResult().data).toBe(stored); // same processed object
    expect(returned.getCurrentResult().isFetching).toBe(false);
    expect(h.requests).toHaveLength(1);
    unsubscribe();
  });
});

describe("active result per role", () => {
  it("USD/HUF and EUR/HUF are separate entries; the new active one replaces the old", async () => {
    const h = fxHarness();
    h.select({ baseCurrency: "USD", targetCurrency: "HUF" });
    h.find({ BaseCurrency: "USD" }).resolve(rawFx(1));
    await settle();
    expect(h.queryClient.getQueryData(fxKey("USD", "HUF"))).toEqual(
      processFxPerformance(rawFx(1)),
    );

    h.select({ baseCurrency: "EUR" });
    // Until EUR/HUF succeeds, `keepPreviousData` shows the previous USD/HUF
    // result as a placeholder (no content flicker) while USD/HUF stays cached.
    const whileLoadingEur = h.observer.getCurrentResult();
    expect(whileLoadingEur.data).toEqual(processFxPerformance(rawFx(1)));
    expect(whileLoadingEur.isPlaceholderData).toBe(true);
    expect(cached(h.queryClient, fxKey("USD", "HUF"))).toBeDefined();

    h.find({ BaseCurrency: "EUR" }).resolve(rawFx(3));
    await settle();
    expect(h.queryClient.getQueryData(fxKey("EUR", "HUF"))).toEqual(
      processFxPerformance(rawFx(3)),
    );
    // The real EUR/HUF result has replaced the placeholder.
    expect(h.observer.getCurrentResult().isPlaceholderData).toBe(false);
    expect(cached(h.queryClient, fxKey("USD", "HUF"))).toBeUndefined();
    expect(entriesOf(h.queryClient, "fxPerformance")).toHaveLength(1);
    h.unsubscribe();
  });

  it("A → B → A requests A again after it was removed", async () => {
    const h = fxHarness();
    h.select({ baseCurrency: "USD", targetCurrency: "HUF" });
    h.find({ TargetCurrency: "HUF" }).resolve(rawFx(1));
    await settle();
    h.select({ targetCurrency: "EUR" });
    h.find({ TargetCurrency: "EUR" }).resolve(rawFx(2));
    await settle();

    h.select({ targetCurrency: "HUF" });
    expect(h.requests).toHaveLength(3);
    // HUF was removed from the cache, so it is refetched. Meanwhile
    // `keepPreviousData` shows the latest EUR result as a placeholder.
    const whileRefetchingHuf = h.observer.getCurrentResult();
    expect(whileRefetchingHuf.data).toEqual(processFxPerformance(rawFx(2)));
    expect(whileRefetchingHuf.isPlaceholderData).toBe(true);

    h.requests[2].resolve(rawFx(5));
    await settle();
    expect(h.observer.getCurrentResult().data).toEqual(processFxPerformance(rawFx(5)));
    expect(h.observer.getCurrentResult().isPlaceholderData).toBe(false);
    expect(entriesOf(h.queryClient, "fxPerformance")).toHaveLength(1);
    h.unsubscribe();
  });

  it("a failed refetch keeps the earlier successful data and reports the error", async () => {
    const h = fxHarness();
    h.select({ baseCurrency: "USD", targetCurrency: "HUF" });
    h.requests[0].resolve(rawFx(1));
    await settle();

    const refetch = h.observer.refetch();
    h.requests[1].reject(new Error("server down"));
    await refetch;
    await settle();

    const current = h.observer.getCurrentResult();
    expect(current.isError).toBe(true);
    expect(current.error?.message).toBe("server down");
    expect(current.data).toEqual(processFxPerformance(rawFx(1)));
    h.unsubscribe();
  });

  it("an invalid first response stores no data and surfaces a validation error", async () => {
    const h = fxHarness();
    h.select({ baseCurrency: "USD", targetCurrency: "HUF" });
    h.requests[0].resolve({ ...rawFx(1), todaysRate: "324" });
    await settle();

    const current = h.observer.getCurrentResult();
    expect(current.isError).toBe(true);
    expect(current.error).toBeInstanceOf(ResponseValidationError);
    expect(h.queryClient.getQueryData(fxKey("USD", "HUF"))).toBeUndefined();
    h.unsubscribe();
  });

  it("Daily Heatmap keeps one active result", async () => {
    const transport = createControlledHttp();
    const { queryClient, filters } = createAppData();
    const store = filters.dailyHeatmap;
    const options = () =>
      dailyHeatmapQueryOptions(buildDailyHeatmapParams(store.getCommitted()), transport.http);
    const observer = new QueryObserver(queryClient, options());
    const unsubscribe = observer.subscribe(() => {});

    transport.requests[0].resolve(rawHeatmap(["ADP"])); // initial: full heatmap
    await settle();
    store.update(() => ({ currencies: ["HUF", "USD"] }));
    store.flush();
    observer.setOptions(options());
    transport.requests[1].resolve(rawHeatmap(["HUF", "USD"]));
    await settle();

    expect(entriesOf(queryClient, "dailyHeatmap")).toHaveLength(1);
    expect(observer.getCurrentResult().data?.charts.X_FilterCurrencies).toEqual(["HUF", "USD"]);
    expect(transport.requests[1].params).toEqual({ Currencies: ["HUF", "USD"] });
    unsubscribe();
  });
});

describe("processing errors", () => {
  it("a processor failure is a query error and nothing is cached", async () => {
    const transport = createControlledHttp();
    const { queryClient } = createAppData();
    const key = ["processing-test"];
    const fetching = queryClient.fetchQuery({
      queryKey: key,
      queryFn: createEndpointQueryFn({
        path: "/x",
        http: transport.http,
        validate: (body) => body,
        process: () => {
          throw new Error("processing failed");
        },
      }),
    });
    transport.requests[0].resolve({});

    await expect(fetching).rejects.toThrow("processing failed");
    expect(queryClient.getQueryData(key)).toBeUndefined();
    expect(queryClient.getQueryState(key)?.status).toBe("error");
  });
});

describe("dimension data", () => {
  it("a failed load reports an error and a retry can succeed", async () => {
    const transport = createControlledHttp();
    const { queryClient } = createAppData();
    const observer = new QueryObserver(queryClient, dimensionsQueryOptions(transport.http));
    const unsubscribe = observer.subscribe(() => {});

    transport.requests[0].reject(new Error("backend unreachable"));
    await settle();
    expect(observer.getCurrentResult().isError).toBe(true);
    expect(observer.getCurrentResult().data).toBeUndefined();

    const retry = observer.refetch(); // the Retry button
    transport.requests[1].resolve(rawDimensions());
    await retry;
    await settle();
    expect(observer.getCurrentResult().isSuccess).toBe(true);
    expect(observer.getCurrentResult().data?.sources).toEqual([{ id: 24, name: "/FILM" }]);
    unsubscribe();
  });
});

describe("Media Analytics: one request per date range, client-side cross-filter", () => {
  const AUG = { startDate: "2026-08-01", toDate: "2026-10-01" };
  const SEP = { startDate: "2026-09-01", toDate: "2026-10-01" };

  function mediaHarness() {
    const transport = createControlledHttp();
    const { queryClient, filters, registry } = createAppData();
    const options = () =>
      mediaAnalyticsQueryOptions(
        buildMediaAnalyticsParams(filters.mediaAnalytics.getCommitted()),
        transport.http,
      );

    const observer = new QueryObserver(queryClient, options());
    const unsubscribe = observer.subscribe(() => {});
    const shown = () => observer.getCurrentResult().data;

    /** User picks dates (no debounce wait); `useMediaAnalytics` re-renders. */
    const editDates = (range: typeof AUG) => {
      filters.mediaAnalytics.update((current) =>
        withMediaDateRange(current, range.startDate, range.toDate),
      );
    };
    const commit = () => {
      filters.mediaAnalytics.flush();
      observer.setOptions(options());
    };
    const setDates = (range: typeof AUG) => {
      editDates(range);
      commit();
    };
    /** Chart click, as `useMediaAnalyticsView().toggleCrossFilter` does. */
    const click = (clicked: MediaCrossSelection) => {
      const range = shown()?.range;
      if (range) {
        filters.mediaCrossFilter.update((current) =>
          toggleMediaCrossFilter(current, { ...clicked, range }),
        );
      }
      observer.setOptions(options()); // a re-render must not start a request
    };
    /** The cross-filter the view applies to the shown data. */
    const effective = () =>
      effectiveMediaCrossFilter(filters.mediaCrossFilter.get(), shown()?.range ?? null);

    return {
      ...transport,
      queryClient,
      filters,
      registry,
      observer,
      unsubscribe,
      shown,
      editDates,
      commit,
      setDates,
      click,
      effective,
    };
  }

  const mediaKey = (range: typeof AUG) =>
    queryKeys.mediaAnalytics({ StartDate: range.startDate, ToDate: range.toDate });
  const mediaData = (label: string, range: typeof AUG) =>
    processMediaAnalytics(rawMedia(label), range);

  it("a date change keeps the previous result as placeholder, then replaces it", async () => {
    const h = mediaHarness();
    h.setDates(AUG);
    expect(h.requests).toHaveLength(1);
    expect(h.requests[0].params).toEqual({ StartDate: "2026-08-01", ToDate: "2026-10-01" });
    h.requests[0].resolve(rawMedia("A"));
    await settle();
    expect(h.shown()).toEqual(mediaData("A", AUG));

    h.setDates(SEP);
    const whileLoading = h.observer.getCurrentResult();
    expect(whileLoading.data).toEqual(mediaData("A", AUG)); // old data, labelled as AUG
    expect(whileLoading.isPlaceholderData).toBe(true);

    h.find({ StartDate: "2026-09-01" }).resolve(rawMedia("B"));
    await settle();
    expect(h.shown()).toEqual(mediaData("B", SEP));
    expect(h.observer.getCurrentResult().isPlaceholderData).toBe(false);
    expect(cached(h.queryClient, mediaKey(AUG))).toBeUndefined();
    expect(entriesOf(h.queryClient, "mediaAnalytics")).toHaveLength(1);
    h.unsubscribe();
  });

  it("a late response for an earlier date range is neither shown nor cached", async () => {
    const h = mediaHarness();
    h.setDates(AUG);
    const early = h.find({ StartDate: "2026-08-01" });
    h.setDates(SEP);

    h.find({ StartDate: "2026-09-01" }).resolve(rawMedia("NEW"));
    await settle();
    early.resolve(rawMedia("OLD")); // finishes late
    await settle();

    expect(h.shown()).toEqual(mediaData("NEW", SEP));
    expect(cached(h.queryClient, mediaKey(AUG))).toBeUndefined();
    expect(entriesOf(h.queryClient, "mediaAnalytics")).toHaveLength(1);
    h.unsubscribe();
  });

  it("cross-filter clicks start no request and highlight the cached articles", async () => {
    const h = mediaHarness();
    h.setDates(AUG);
    h.requests[0].resolve(rawMedia("SOURCE A"));
    await settle();
    const activeKey = h.registry.getActive("mediaAnalytics");
    const rows = h.shown()!.rows;

    h.click({ kind: "source", value: "SOURCE A" });
    expect(h.effective()).toEqual({ kind: "source", value: "SOURCE A", range: AUG });
    const charts = buildMediaChartData(rows, h.effective());
    expect(charts.sources.names).toEqual(["SOURCE A", "YAHOO ENTERTAINMENT"]);
    expect(charts.sources.highlighted).toEqual([1, 0]);
    expect(charts.categories.names).toEqual(["Economic Recession", "Inflation"]);
    expect(charts.categories.highlighted).toEqual([0, 1]);

    h.click({ kind: "category", value: "Inflation" }); // replaces the source filter
    h.click({ kind: "category", value: "Inflation" }); // same element: clears it
    expect(h.filters.mediaCrossFilter.get()).toBeNull();

    expect(h.requests).toHaveLength(1);
    expect(h.registry.getActive("mediaAnalytics")).toBe(activeKey);
    h.unsubscribe();
  });

  it("dates changed and reverted within the debounce: no request, cross-filter kept", async () => {
    const h = mediaHarness();
    h.setDates(AUG);
    h.requests[0].resolve(rawMedia("SOURCE A"));
    await settle();
    h.click({ kind: "source", value: "SOURCE A" });

    h.editDates(SEP);
    h.editDates(AUG);
    h.commit();

    expect(h.requests).toHaveLength(1);
    expect(h.effective()).toEqual({ kind: "source", value: "SOURCE A", range: AUG });
    h.unsubscribe();
  });

  it("the cross-filter stays on the old data while a new range loads and is cleared when it arrives", async () => {
    const h = mediaHarness();
    h.setDates(AUG);
    h.requests[0].resolve(rawMedia("SOURCE A"));
    await settle();
    h.click({ kind: "source", value: "SOURCE A" });

    // Record what a page would render, in order.
    const renders: string[] = [];
    const record = () =>
      renders.push(`${h.shown()?.range.startDate}|${h.effective()?.value ?? "none"}`);
    const unsubscribes = [h.observer.subscribe(record), h.filters.mediaCrossFilter.subscribe(record)];

    h.setDates(SEP);
    // While loading: old data (placeholder) with its own cross-filter.
    expect(h.observer.getCurrentResult().isPlaceholderData).toBe(true);
    expect(h.effective()?.value).toBe("SOURCE A");

    h.find({ StartDate: "2026-09-01" }).resolve(rawMedia("B"));
    await settle();

    expect(h.shown()).toEqual(mediaData("B", SEP));
    expect(h.filters.mediaCrossFilter.get()).toBeNull();
    // The old cross-filter was never applied to the new data, and it was not
    // dropped while the old data was still shown.
    expect(renders).not.toContain("2026-09-01|SOURCE A");
    expect(renders).not.toContain("2026-08-01|none");
    unsubscribes.forEach((unsubscribe) => unsubscribe());
    h.unsubscribe();
  });

  it("a refetch of the same range keeps the cross-filter", async () => {
    const h = mediaHarness();
    h.setDates(AUG);
    h.requests[0].resolve(rawMedia("SOURCE A"));
    await settle();
    h.click({ kind: "source", value: "SOURCE A" });

    const refetch = h.observer.refetch();
    h.requests[1].resolve(rawMedia("SOURCE A"));
    await refetch;
    await settle();

    expect(h.effective()).toEqual({ kind: "source", value: "SOURCE A", range: AUG });
    h.unsubscribe();
  });

  it("new data arriving while the user is on another page still clears the cross-filter", async () => {
    const h = mediaHarness();
    h.setDates(AUG);
    h.requests[0].resolve(rawMedia("SOURCE A"));
    await settle();
    h.click({ kind: "source", value: "SOURCE A" });
    h.setDates(SEP);
    h.unsubscribe(); // user leaves the page

    h.find({ StartDate: "2026-09-01" }).resolve(rawMedia("B"));
    await settle();
    expect(h.filters.mediaCrossFilter.get()).toBeNull();
    expect(h.queryClient.getQueryData(mediaKey(SEP))).toEqual(mediaData("B", SEP));
  });
});
