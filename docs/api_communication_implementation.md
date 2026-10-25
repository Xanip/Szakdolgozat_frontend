# API Communication Layer – Implementation

Implements `docs/API_communication_spec.md` (data layer only). Page components remain placeholders; no charts, page layouts, or page-specific UI were added.

## 1. Implemented architecture

```
Filter controls ──► page filter store (draft ─debounce─► committed) ──► registry.setActive(role, key)
                                                   │
                                                   ▼
page hook ──► useQuery(key) ──► getJson (Axios, /api) ──► validate (unknown → Raw*) ──► process (Raw* → display type)
                                                   │
                         QueryCache onSuccess/onError ──► active-result lifecycle (remove obsolete/superseded entries)
```

| Area | Files |
| --- | --- |
| Raw backend types | `src/types/api/raw.ts` |
| Display types (Spec shapes) | `src/types/api/display.ts` |
| Filter types | `src/types/filters.ts` |
| API client | `src/lib/api/client.ts` |
| Validators | `src/lib/api/validators/guards.ts`, `dimensions.ts`, `fxPerformance.ts`, `dailyHeatmap.ts`, `mediaAnalytics.ts` |
| Processors | `src/lib/api/processors/dimensions.ts`, `fxPerformance.ts`, `dailyHeatmap.ts`, `mediaAnalytics.ts` |
| Query keys, params, roles | `src/lib/api/queryKeys.ts` |
| Query options / pipeline | `src/lib/api/queries.ts` |
| Active-result lifecycle | `src/lib/api/activeResult.ts`, `src/lib/api/queryClient.ts` |
| Filter state | `src/lib/filters/debouncedState.ts`, `src/lib/filters/pageFilters.ts` |
| App wiring | `src/lib/appData.ts`, `src/components/providers/AppDataProvider.tsx`, `src/main.tsx` |
| Hooks | `src/hooks/usePageFilters.ts`, `src/hooks/api/useDimensionData.ts`, `useFxPerformance.ts`, `useDailyHeatmap.ts`, `useMediaAnalytics.ts` |
| Dimension-data gate | `src/components/layout/DimensionDataGate.tsx`, used in `AppLayout.tsx` |
| Dev proxy | `vite.proxy.ts`, `vite.config.ts` |

### API client (`client.ts`)
- One Axios instance with `baseURL: "/api"`. Endpoint paths are in `ENDPOINTS`.
- `serializeQueryParams` handles query strings for every endpoint: it drops `null`/`undefined` and repeats array values (`Currencies=HUF&Currencies=USD&Currencies=EUR`). Values are form-encoded (`URLSearchParams`).
- `getJson` returns the body as `unknown`. The Axios generic is never relied on for typing.
- No `AbortSignal` is passed. TanStack Query aborts a fetch whose signal was consumed when the last observer unmounts, and the Spec requires that leaving a page does not stop a request.

### Runtime validation (`validators/`)
- `guards.ts` has reusable, hand-written decoders: `string`, `number` (finite), `integer`, `nullable`, `arrayOf`, `object`, plus the `isRecord`/`isFiniteNumber` type guards and `ensure` for structural checks. Each decoder narrows `unknown` to a type or reports the failing JSON path. `validateResponse` turns any failure into one `ResponseValidationError` (with `endpoint` and `path`).
- `object` requires every field to be present. A missing field fails even when `null` is allowed, and extra fields are dropped.
- Endpoint validators declare the raw shape and add structural rules:
  - FX: `lineChart_X`/`lineChart_Y` and `waterfallVarianceChart_X`/`_Y` must have equal lengths. The backend field `changeSinceYesteray` is required exactly as spelled.
  - Heatmap: `data` has `y_data.length` rows, and each row has `x_data.length` cells (`number | null`).
  - Media: the response must match the request mode. Main (`IncludeMain=true`) needs `main` set and `filtered` null. Filtered needs the reverse. Counts are integers.
  - Dimensions: `CurrencyName`/`CurrencySymbol` may be `null` (nullable columns in `DimCurrency`). All other fields are required.

### Processors (`processors/`)
These are pure functions from validated raw data to the Spec's display types:
- FX: maps `changeSinceYesteray` → `changeSinceYesterday` and `changeSinceTheStartOfPeriod` → `changeSincePeriod`, and maps the chart arrays.
- Heatmap: `X_FilterCurrencies = x_data` (column order), `Y_AllCurrencies = y_data` (row order), `matrics_data = data` (unchanged `[row][column]`).
- Media: rows become `tableData` in `MEDIA_TABLE_COLUMNS` order. `by_category`/`by_source` (`{Name, Count}[]`) are split into element-aligned `*Name`/`*Data` arrays.
- Empty arrays stay empty, and `null` stays `null`.

### TanStack Query integration (`queries.ts`, `queryClient.ts`)
- `createEndpointQueryFn` runs fetch → validate → process. Any failure rejects the query, so only fully processed data is cached. Pages read the processed structure and never re-run processing.
- `createAppQueryClient`: `staleTime: Infinity` and `gcTime: Infinity` (no time-based expiry or refetch when returning to a page), no focus/reconnect refetch, `retry: false` (the user retries explicitly).
- Parallel requests for the same key are deduplicated by TanStack Query.

### Query keys (`queryKeys.ts`)
Keys embed the exact request params, as the Spec examples show:
- `["FX_performance", { BaseCurrency, TargetCurrency, StartDate, ToDate: null }]`
- `["Daily_heatmap", { Currencies: string[] | null }]` (an empty selection is normalized to `null`, the full heatmap)
- `["Media_analytics", { StartDate, ToDate, SourceFilter, CategoryFilter, IncludeMain }]`
- `["Dimensions"]` for `/exchange-rates/pages` (the Spec defines no key)

`build*Params` functions turn filters into params and return `null` until a request can be built. `[scope, null]` is an idle key that is never fetched or tracked. `getResultRole` maps a key to its role: `fxPerformance`, `dailyHeatmap`, `mediaMain`, or `mediaFiltered`.

### Active-result lifecycle (`activeResult.ts`)
- **Registry.** When filters are committed, the filter store records the matching key as the *active key* of its role. This happens outside React, so it works even when the page is not mounted.
- **QueryCache `onSuccess`.** Runs synchronously right after TanStack Query stores the data:
  1. The key isn't the role's active key (obsolete, late): the entry is removed. Its result is never shown or kept.
  2. The key is active: every other entry of the same role is removed. This covers superseded results and still-running obsolete requests. Removing a running query cancels it silently in TanStack Query, so it can't write back later.
  3. A new `mediaMain` result also removes `mediaFiltered` entries for a different date range.
- **QueryCache `onError`.** A failed obsolete request is removed. A failed active request keeps its error, and TanStack Query keeps the earlier successful data of the same key (failed refetch).
- **Result.** FX and Heatmap keep at most one successful result. Media Analytics keeps at most one main and one filtered result. A superseded result stays cached, not displayed, until its replacement succeeds.

### Filter state and debounce (`lib/filters/`)
- `createDebouncedState` is a small external store with a `draft` (updated on every change, for controls) and a `committed` value (follows `draft` after a quiet period, for requests). It notifies listeners after `onCommit`, so the active key is updated before components re-render. Changing a value and changing it back inside the window starts no request.
- `createPageFilterStores` creates one store per page (no shared filters). The default debounce is `DEFAULT_FILTER_DEBOUNCE_MS = 300`.
- Media rules: `withMediaDateRange` clears the cross-filter, because a cross-filter always belongs to the main data it was picked from. `MediaCrossFilter` is a `{ kind: "source" | "category", value }` union, so Source and Category can't both be set.
- `AppDataProvider` creates the QueryClient, registry, and filter stores once and sits above the router. Navigation doesn't touch them.

### Hooks
- `useFxPerformanceFilters`, `useDailyHeatmapFilters`, `useMediaAnalyticsFilters` return draft values and setters.
- `useDimensionData`, `useFxPerformance`, `useDailyHeatmap` read committed filters, build params, and call `useQuery`. Each returns `{ params, query }`.
- `useMediaAnalytics` returns `{ mainParams, filteredParams, main, filtered }`. The filtered query is enabled only after main data for the same date range exists.

### Dimension-data gate
`DimensionDataGate` wraps the routes in `AppLayout`. It shows a loading status while pending. On failure it shows an error (`role="alertdialog"`) with a Retry button that calls `refetch` and is disabled while retrying; F5 also retries. Pages render only after success. The sidebar and header stay usable.

### Development proxy (`vite.proxy.ts`)
`server.proxy` uses the regex context `^/api/` → `http://localhost:8000`, with `rewriteApiPath` (`/api/x?q` → `/x?q`) and `changeOrigin: true`. This mirrors `nginx.conf` (`location /api/ { proxy_pass http://backend:8000/; }`), so dev and production send the same backend path.

## 2. Specification coverage

| Spec requirement | Implementation |
| --- | --- |
| Network data is `unknown` until validated; per-endpoint validators with reusable checks | `getJson` → `validators/*` built on `guards.ts` |
| Endpoint processor produces the display structure; cache stores it; pages don't reprocess | `processors/*`, `createEndpointQueryFn` |
| `Currencies` serialized as repeated params, centrally | `serializeQueryParams` |
| FX `ToDate` always `null` | `buildFxPerformanceParams` |
| Media: Source and Category never together; `IncludeMain` true for main, false for filtered | `MediaCrossFilter` union, `buildMedia*Params` |
| Query key contains the actually requested params | `queryKeys` + `build*Params` |
| Page change doesn't clear the cache or stop requests; return shows cached data at once | Provider above router, `gcTime/staleTime: Infinity`, no abort signal |
| Filters stored apart from pages and preserved | `createPageFilterStores` in `AppDataProvider` |
| Debounced request start for rapid changes | `createDebouncedState` (300 ms) |
| Old results never shown as the new filter's result | Separate keys and no `placeholderData`. Late results are discarded by the lifecycle |
| One active result (FX, Heatmap); Media ≤ 1 main + ≤ 1 filtered; superseded results deleted | `handleQuerySuccess` |
| New main data (new date range) deletes filtered data | `handleQuerySuccess` (`mediaMain` branch) |
| Failed first load caches nothing; failed refetch keeps prior data; error still shown | Pipeline rejects; TanStack Query keeps `data` with `error` |
| Dimension data loads first; error + Retry; pages unusable until loaded; pages don't wait for each other | `DimensionDataGate`; each page query is independent |
| Same-key deduplication by TanStack Query | Default behavior |

## 3. Tests and verification

Vitest `5.0.5` (exact pin, devDependency) with a `test` script (`vitest run`). All tests run in the Node environment. No jsdom or React Testing Library was needed.

| File | Covers |
| --- | --- |
| `src/lib/api/__tests__/validators.test.ts` (17) | Valid payloads; missing fields; wrong types; non-JSON body; X/Y length mismatch; matrix/axis mismatch; Media mode mismatch; non-integer counts; error path reporting |
| `src/lib/api/__tests__/processors.test.ts` (9) | FX field renames; heatmap axis order and cell positions; Media name/value alignment and table column order; `null` vs empty arrays |
| `src/lib/api/__tests__/queryKeys.test.ts` (10) | Spec key shapes; `ToDate: null`; distinct keys for USD/HUF vs EUR/HUF; `IncludeMain` separation; serialization; Axios URL `/api/...` |
| `src/lib/api/__tests__/activeResult.test.ts` (18) | Obsolete late requests (3 scenarios); navigation + cache without refetch or reprocessing; replacement of the active result; A → B → A; failed refetch keeps data; validation error caches nothing; processor error as query error; heatmap single result; dimension error + retry; Media main/filtered lifecycle (7 scenarios) |
| `src/lib/filters/__tests__/pageFilters.test.ts` (7) | Debounce rule (fake timers); rapid changes → one request for the latest filters; values kept without subscribers; independent page filters; Media date change clears cross-filter; Source/Category exclusivity |
| `src/components/layout/__tests__/DimensionDataGate.test.tsx` (4) | Loading, error with Retry, disabled while retrying, pages after success (server-rendered markup) |
| `vite.proxy.test.ts` (4) | `rewriteApiPath`; `vite.config.ts` proxy is `^/api/` → `http://localhost:8000`; integration: a real Vite dev server forwards the Axios-built URL `/api/exchange-rates/pages/Daily_heatmap?Currencies=…` to a stub backend, which receives `/exchange-rates/pages/Daily_heatmap?Currencies=HUF&Currencies=USD&Currencies=EUR` |

**Obsolete-request test.** "An older, slower request finishing after a newer one is neither shown nor cached" starts request A (USD/HUF), switches to B (USD/EUR), resolves B, and then resolves A. It asserts that the observer shows B, that `getQueryData(A)` is `undefined` and the cache has no A entry, and that only one FX entry exists. As a mutation check, both safeguards (obsolete-result removal and superseded-entry removal) were disabled temporarily. The test failed, and the code was restored. Each safeguard alone makes it pass. The related tests ("discarded before the newer one finishes", "newer one fails") fail when only the obsolete-result removal is disabled.

**Results** (Node 22.20.0, direct `node` invocation because of the PowerShell execution policy):

| Command | Result |
| --- | --- |
| `node ./node_modules/vitest/vitest.mjs run` | 7 files, 69 tests passed |
| `node ./node_modules/typescript/bin/tsc --noEmit -p tsconfig.app.json` | exit 0 |
| `node ./node_modules/typescript/bin/tsc -b` | exit 0 (app + node configs, including `vite.proxy.ts` and its test) |
| `node ./node_modules/vite/bin/vite.js build` | exit 0, 2102 modules, `dist/` produced |
| `node ./node_modules/eslint/bin/eslint.js .` | 1 error, already present before this work, in `src/components/ui/button.tsx` (`react-refresh/only-export-components`, shadcn file, unchanged). No findings in new code |

The existing Vite warning about `__dirname` in `vite.config.ts` is unchanged.

## 4. Implementation decisions and deviations from the plan

1. **Debounce lives in an external filter store instead of a `useDebouncedValue` hook.**
   - *Plan:* debounce hook in each page hook, with filter params coming from elsewhere.
   - *Implemented:* `createDebouncedState` holds draft and committed values outside React, and commits call `registry.setActive`.
   - *Why it's better:* one mechanism keeps filters across navigation, applies the debounce, and sets the active key. A pending change still commits if the page unmounts, and everything is testable in Node without a DOM.
   - *Preserved:* filters stay separate from pages, the debounce rule is unchanged, and keys still hold the requested params.

2. **Lifecycle enforced in `QueryCache` callbacks instead of hook calls and an `ObsoleteResultError`.**
   - *Plan:* hooks call `setActiveResult`, and the `queryFn` throws `ObsoleteResultError` for obsolete keys.
   - *Implemented:* the registry plus `QueryCache.onSuccess`/`onError` (`handleQuerySuccess`, `handleQueryError`).
   - *Why it's better:* it applies to every query, even when no page is mounted. It runs synchronously right after the data is stored, so there's no window where an obsolete result is cached. No artificial error state reaches the UI. There are two independent safeguards: superseded running requests are removed and silently cancelled, and obsolete results are removed on arrival.
   - *Preserved:* every active-result rule and the obsolete-request requirement, which the tests above verify.

3. **When the previous entry is removed.**
   - *Plan:* `setActiveResult` removes the superseded key when the new key becomes active.
   - *Implemented:* the *active role* switches on commit, so the old data is no longer displayed. The old *cache entry* is removed when the new result succeeds.
   - *Why it's better:* this matches the agreed Media rule (filtered data is removed when the new main result *arrives*) and the Spec ("aktívvá válásakor"). It uses one rule for all roles. Removing on filter change would cancel the old request at once, while the Spec says a new filter doesn't automatically stop a started request.
   - *Trade-off:* until the replacement succeeds, the old successful entry stays cached but not displayed. If the replacement fails, it stays until the next success of that role. That's at most one extra entry per role.

4. **Validators are path-reporting decoders, not just boolean guards.** `isRecord`/`isFiniteNumber` still exist. The composable decoders (`object`, `arrayOf`, `nullable`) also infer types and report the exact failing path, which makes failures diagnosable and keeps each endpoint validator short. Still hand-written, with no library.

5. **Single `useMediaAnalytics` hook** instead of `useMediaMain` plus `useMediaFiltered`. The filtered query depends on main data for the same dates, which is easiest to express in one hook. The two queries keep separate keys and roles.

6. **Additions that follow from the agreed scope.** The plan's file list didn't name these:
   - The filter state (`lib/filters/`, `types/filters.ts`), required by the Spec's "Oldalankénti szűrő adatok" section.
   - `DimensionDataGate` and its use in `AppLayout.tsx`. The gate was in scope, but no file was listed.
   - `appData.ts` and `AppDataProvider.tsx`, which hold the provider wiring.

7. **Dev proxy placed in a root `vite.proxy.ts`** instead of `src/lib/api/devProxy.ts`. It is build-time config with Node/Vite types, so it belongs with `vite.config.ts` (covered by `tsconfig.node.json`, whose `include` gained `vite.proxy.ts` and `vite.proxy.test.ts`).
   - The context is the regex `^/api/`, which mirrors nginx's `location /api/`. A plain `/api` prefix would also proxy paths like `/apix`.
   - Besides the unit test, an integration test runs a real Vite dev server against a stub backend.

8. **Dimension gate test via `react-dom/server`.** The presentational `DimensionDataGateView` is tested from server-rendered markup, so no jsdom or Testing Library was added. Retry behavior is tested at the QueryClient level.

## 5. Limitations and open points

- **Not render-tested:** the React hook wrappers (`useFxPerformance` etc., `usePageFilters`) aren't tested by rendering, since there's no DOM test environment. The behavior they wrap is tested through `QueryObserver` (the same observer `useQuery` uses) and the filter stores.
- **No page uses the hooks yet:** pages are placeholders. The Daily Heatmap's initial filter `Currencies: null` means the full heatmap is requested once a heatmap page mounts the hook.
- **Default filter values are unspecified:** the FX currency pair, FX start date, and Media date range start as `null`, so no request is sent until they're set. The page specifications need to provide defaults.
- **"Pop-up" is an inline blocking panel:** the project has no dialog component, so the error panel replaces the page content (`role="alertdialog"`, focused Retry button) instead of opening a modal. Adding one wasn't in scope.
- **Obsolete requests aren't aborted over HTTP:** their result is discarded (allowed by the Spec: "a megszakítás opcionális").
- **"Eltérő query key-k" interpretation:** USD/HUF and EUR/HUF are separate entries and never mix, but after EUR/HUF becomes active, USD/HUF is removed per the one-active-result rule.
- **No null-safety from the compiler:** `tsconfig.app.json` has no `strict`/`strictNullChecks`, so nullability in the types isn't enforced at compile time. The runtime validators enforce it for responses. The config was left unchanged.
- **No live backend test:** requests were checked against stubs and the documented JSON, not a running FastAPI backend. The `+` encoding of spaces (for example `SourceFilter=YAHOO+ENTERTAINMENT`) relies on standard form decoding in FastAPI/Starlette.
- **Date strings aren't format-checked:** they are validated as strings only. The documentation gives no stricter contract.
- **Debounce value:** 300 ms is an initial value, adjustable through `DEFAULT_FILTER_DEBOUNCE_MS` or `createAppData({ delayMs })`.
