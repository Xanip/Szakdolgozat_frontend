import { QueryObserver } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createAppData } from "@/lib/appData";
import { fxPerformanceQueryOptions, mediaAnalyticsQueryOptions } from "@/lib/api/queries";
import {
  buildFxPerformanceParams,
  buildMediaAnalyticsParams,
  queryKeys,
} from "@/lib/api/queryKeys";
import { createDebouncedState } from "@/lib/filters/debouncedState";
import { createImmediateState } from "@/lib/filters/immediateState";
import {
  clearStaleMediaCrossFilter,
  DEFAULT_FILTER_DEBOUNCE_MS,
  effectiveMediaCrossFilter,
  toggleMediaCrossFilter,
  withMediaDateRange,
} from "@/lib/filters/pageFilters";
import { createControlledHttp } from "@/lib/api/__tests__/fixtures";
import type { MediaCrossFilter } from "@/types/filters";

const AUG = { startDate: "2026-08-01", toDate: "2026-10-01" };
const SEP = { startDate: "2026-09-01", toDate: "2026-10-01" };
const sourceA: MediaCrossFilter = { kind: "source", value: "SOURCE A", range: AUG };

describe("debounced filter state", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("updates the draft immediately and commits only after changes pause", () => {
    const onCommit = vi.fn();
    const state = createDebouncedState({ value: 0 }, { delayMs: 300, onCommit });

    for (let value = 1; value <= 5; value += 1) {
      state.update(() => ({ value }));
      vi.advanceTimersByTime(100);
    }
    expect(state.getDraft()).toEqual({ value: 5 });
    expect(state.getCommitted()).toEqual({ value: 0 });
    expect(onCommit).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(state.getCommitted()).toEqual({ value: 5 });
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it("does not commit when a value is changed and changed back", () => {
    const onCommit = vi.fn();
    const state = createDebouncedState({ value: 0 }, { delayMs: 300, onCommit });
    state.update(() => ({ value: 1 }));
    state.update(() => ({ value: 0 }));
    vi.advanceTimersByTime(300);
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("keeps values when nobody is subscribed (page unmounted)", () => {
    const state = createDebouncedState({ value: 0 }, { delayMs: 300 });
    const unsubscribe = state.subscribe(() => {});
    state.update(() => ({ value: 7 }));
    unsubscribe();
    vi.advanceTimersByTime(300);
    expect(state.getDraft()).toEqual({ value: 7 });
    expect(state.getCommitted()).toEqual({ value: 7 });
  });

  it("rapid filter changes start one request, for the latest filters", () => {
    const transport = createControlledHttp();
    const { queryClient, filters, registry } = createAppData();
    const store = filters.fxPerformance;
    const options = () =>
      fxPerformanceQueryOptions(buildFxPerformanceParams(store.getCommitted()), transport.http);
    const observer = new QueryObserver(queryClient, options());
    const unsubscribeObserver = observer.subscribe(() => {});
    // Re-render on commit, as `useFxPerformance` does via useSyncExternalStore.
    const unsubscribeStore = store.subscribe(() => observer.setOptions(options()));

    store.update((current) => ({ ...current, baseCurrency: "USD" }));
    for (const target of ["HUF", "EUR", "GBP", "JPY", "CHF"]) {
      store.update((current) => ({ ...current, targetCurrency: target }));
      vi.advanceTimersByTime(DEFAULT_FILTER_DEBOUNCE_MS - 50);
    }
    expect(transport.requests).toHaveLength(0);

    vi.advanceTimersByTime(DEFAULT_FILTER_DEBOUNCE_MS);
    expect(transport.requests).toHaveLength(1);
    expect(transport.requests[0].params).toEqual({
      BaseCurrency: "USD",
      TargetCurrency: "CHF",
      StartDate: null,
      ToDate: null,
    });
    expect(registry.getActive("fxPerformance")).toEqual(
      queryKeys.fxPerformance(
        buildFxPerformanceParams({
          baseCurrency: "USD",
          targetCurrency: "CHF",
          startDate: null,
          toDate: null,
        }),
      ),
    );

    unsubscribeStore();
    unsubscribeObserver();
  });
});

describe("immediate filter state", () => {
  it("applies changes synchronously and notifies only on a real change", () => {
    const state = createImmediateState<string | null>(null);
    const listener = vi.fn();
    const unsubscribe = state.subscribe(listener);

    state.update(() => "A");
    expect(state.get()).toBe("A");
    expect(listener).toHaveBeenCalledTimes(1);

    state.update((current) => current);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    state.update(() => "B"); // value kept without subscribers (page unmounted)
    expect(state.get()).toBe("B");
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe("page filter state", () => {
  afterEach(() => vi.useRealTimers());

  it("pages have independent filters", () => {
    const { filters } = createAppData();
    filters.fxPerformance.update((current) => ({ ...current, baseCurrency: "USD" }));
    filters.fxPerformance.flush();
    expect(filters.dailyHeatmap.getCommitted()).toEqual({ currencies: null });
    expect(filters.mediaAnalytics.getCommitted().startDate).toBeNull();
    expect(filters.mediaCrossFilter.get()).toBeNull();
  });

  it("unchanged Media dates keep the same filter object", () => {
    const filters = { startDate: "2026-08-01", toDate: "2026-10-01" };
    expect(withMediaDateRange(filters, "2026-08-01", "2026-10-01")).toBe(filters);
    expect(withMediaDateRange(filters, "2026-09-01", "2026-10-01")).toEqual({
      startDate: "2026-09-01",
      toDate: "2026-10-01",
    });
  });

  it("changing the Media dates alone never clears the cross-filter", () => {
    vi.useFakeTimers();
    const { filters } = createAppData();
    const setDates = (startDate: string, toDate: string) =>
      filters.mediaAnalytics.update((current) => withMediaDateRange(current, startDate, toDate));
    setDates("2026-08-01", "2026-10-01");
    vi.advanceTimersByTime(DEFAULT_FILTER_DEBOUNCE_MS);
    filters.mediaCrossFilter.update(() => sourceA);

    setDates("2026-09-01", "2026-10-01"); // changed …
    setDates("2026-08-01", "2026-10-01"); // … and reverted within the debounce
    vi.advanceTimersByTime(DEFAULT_FILTER_DEBOUNCE_MS);
    expect(filters.mediaCrossFilter.get()).toBe(sourceA);

    setDates("2026-09-01", "2026-10-01"); // a real change: kept until new data arrives
    vi.advanceTimersByTime(DEFAULT_FILTER_DEBOUNCE_MS);
    expect(filters.mediaCrossFilter.get()).toBe(sourceA);
  });

  it("a click toggles the cross-filter; Source and Category replace each other", () => {
    const category = { kind: "category" as const, value: "Inflation", range: AUG };
    expect(toggleMediaCrossFilter(null, sourceA)).toBe(sourceA);
    expect(toggleMediaCrossFilter(sourceA, { ...sourceA, range: { ...AUG } })).toBeNull();
    expect(toggleMediaCrossFilter(sourceA, category)).toBe(category);
    // Same name, different kind: a different filter.
    const sameName = { kind: "category" as const, value: "SOURCE A", range: AUG };
    expect(toggleMediaCrossFilter(sourceA, sameName)).toBe(sameName);
    // Same element of data for another range: a new selection, not a toggle-off.
    const otherRange = { ...sourceA, range: SEP };
    expect(toggleMediaCrossFilter(sourceA, otherRange)).toBe(otherRange);
  });

  it("a cross-filter applies only to the data it was picked from", () => {
    expect(effectiveMediaCrossFilter(sourceA, AUG)).toBe(sourceA);
    expect(effectiveMediaCrossFilter(sourceA, { ...AUG })).toBe(sourceA);
    expect(effectiveMediaCrossFilter(sourceA, SEP)).toBeNull();
    expect(effectiveMediaCrossFilter(sourceA, null)).toBeNull(); // no data shown
    expect(effectiveMediaCrossFilter(null, AUG)).toBeNull();
  });

  it("new data clears a cross-filter of another range; same-range data keeps it", () => {
    const store = createImmediateState<MediaCrossFilter | null>(sourceA);
    clearStaleMediaCrossFilter(store, { ...AUG }); // refetch of the same range
    expect(store.get()).toBe(sourceA);
    clearStaleMediaCrossFilter(store, SEP);
    expect(store.get()).toBeNull();
  });

  it("cross-filter changes start no request and keep the active key", () => {
    vi.useFakeTimers();
    const transport = createControlledHttp();
    const { queryClient, filters, registry } = createAppData();
    const options = () =>
      mediaAnalyticsQueryOptions(
        buildMediaAnalyticsParams(filters.mediaAnalytics.getCommitted()),
        transport.http,
      );
    const observer = new QueryObserver(queryClient, options());
    const unsubscribeObserver = observer.subscribe(() => {});
    const render = () => observer.setOptions(options());
    const unsubscribeStores = [
      filters.mediaAnalytics.subscribe(render),
      filters.mediaCrossFilter.subscribe(render),
    ];

    filters.mediaAnalytics.update(() => ({ startDate: "2026-08-01", toDate: "2026-10-01" }));
    vi.advanceTimersByTime(DEFAULT_FILTER_DEBOUNCE_MS);
    expect(transport.requests).toHaveLength(1);
    const activeKey = registry.getActive("mediaAnalytics");

    for (const value of ["A", "B", "B", "C"]) {
      filters.mediaCrossFilter.update((current) =>
        toggleMediaCrossFilter(current, { kind: "source", value, range: AUG }),
      );
      vi.advanceTimersByTime(DEFAULT_FILTER_DEBOUNCE_MS);
    }
    expect(transport.requests).toHaveLength(1);
    expect(registry.getActive("mediaAnalytics")).toBe(activeKey);

    unsubscribeStores.forEach((unsubscribe) => unsubscribe());
    unsubscribeObserver();
    vi.useRealTimers();
  });
});
