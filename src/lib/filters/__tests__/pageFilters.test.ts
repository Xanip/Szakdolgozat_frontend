import { QueryObserver } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createAppData } from "@/lib/appData";
import { fxPerformanceQueryOptions } from "@/lib/api/queries";
import { buildFxPerformanceParams, queryKeys } from "@/lib/api/queryKeys";
import { createDebouncedState } from "@/lib/filters/debouncedState";
import {
  DEFAULT_FILTER_DEBOUNCE_MS,
  withMediaCrossFilter,
  withMediaDateRange,
} from "@/lib/filters/pageFilters";
import { createControlledHttp } from "@/lib/api/__tests__/fixtures";

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

describe("page filter state", () => {
  it("pages have independent filters", () => {
    const { filters } = createAppData();
    filters.fxPerformance.update((current) => ({ ...current, baseCurrency: "USD" }));
    filters.fxPerformance.flush();
    expect(filters.dailyHeatmap.getCommitted()).toEqual({ currencies: null });
    expect(filters.mediaAnalytics.getCommitted().startDate).toBeNull();
  });

  it("a Media date change clears the cross-filter", () => {
    const filters = {
      startDate: "2026-08-01",
      toDate: "2026-10-01",
      crossFilter: { kind: "source" as const, value: "SOURCE A" },
    };
    expect(withMediaDateRange(filters, "2026-08-01", "2026-10-01")).toBe(filters);
    expect(withMediaDateRange(filters, "2026-09-01", "2026-10-01")).toEqual({
      startDate: "2026-09-01",
      toDate: "2026-10-01",
      crossFilter: null,
    });
  });

  it("Source and Category cross-filters replace each other", () => {
    const filters = { startDate: "2026-08-01", toDate: "2026-10-01", crossFilter: null };
    const bySource = withMediaCrossFilter(filters, { kind: "source", value: "SOURCE A" });
    const byCategory = withMediaCrossFilter(bySource, { kind: "category", value: "Inflation" });
    expect(byCategory.crossFilter).toEqual({ kind: "category", value: "Inflation" });
    expect(withMediaCrossFilter(byCategory, { kind: "category", value: "Inflation" })).toBe(
      byCategory,
    );
  });
});
