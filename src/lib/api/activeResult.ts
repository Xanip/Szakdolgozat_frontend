import {
  hashKey,
  type Query,
  type QueryCache,
  type QueryKey,
} from "@tanstack/react-query";

import { getResultRole, type ResultRole } from "@/lib/api/queryKeys";

/** Any cached query, as passed to `QueryCache` callbacks. */
type AnyQuery = Query<unknown, unknown, unknown>;

/**
 * Records which query key currently holds the active role for each page/data
 * role. The active key is the one built from the latest committed (debounced)
 * filters; it changes the moment new filters are committed, independent of
 * whether any page component is mounted.
 */
export type ActiveResultRegistry = {
  setActive(role: ResultRole, queryKey: QueryKey | null): void;
  getActive(role: ResultRole): QueryKey | null;
  isActive(role: ResultRole, queryHash: string): boolean;
};

export function createActiveResultRegistry(): ActiveResultRegistry {
  const active = new Map<ResultRole, { key: QueryKey; hash: string }>();
  return {
    setActive(role, queryKey) {
      if (queryKey === null) active.delete(role);
      else active.set(role, { key: queryKey, hash: hashKey(queryKey) });
    },
    getActive(role) {
      return active.get(role)?.key ?? null;
    },
    isActive(role, queryHash) {
      return active.get(role)?.hash === queryHash;
    },
  };
}

/**
 * Applies the active-result lifecycle when a query fetch succeeds. Wired into
 * the `QueryCache` `onSuccess` callback, so it runs synchronously right after
 * TanStack Query stores the data; observer listeners (React re-renders) are
 * only notified later, on TanStack Query's batched notification tick.
 *
 * - The result does not belong to the role's active key (an obsolete request
 *   finished late): the entry is removed immediately, so the result is never
 *   retained or shown.
 * - The result is the active one: every other entry of the same role is
 *   removed (superseded results; still-running obsolete requests are dropped
 *   with them, so they cannot write back later).
 *
 * The rule is the same for every page; no role depends on another one.
 * Returns the role when the result was kept as the active one (so callers
 * can react to new active data), otherwise `null`.
 */
export function handleQuerySuccess(
  cache: QueryCache,
  registry: ActiveResultRegistry,
  query: AnyQuery,
): ResultRole | null {
  const role = getResultRole(query.queryKey);
  if (role === null) return null;

  if (!registry.isActive(role, query.queryHash)) {
    cache.remove(query);
    return null;
  }

  for (const other of cache.getAll()) {
    if (other !== query && getResultRole(other.queryKey) === role) {
      cache.remove(other);
    }
  }
  return role;
}

/**
 * A failed obsolete request leaves nothing behind. A failed active request is
 * kept: its error is shown, and TanStack Query keeps any earlier successful
 * data of the same key (failed refetch).
 */
export function handleQueryError(
  cache: QueryCache,
  registry: ActiveResultRegistry,
  query: AnyQuery,
): void {
  const role = getResultRole(query.queryKey);
  if (role !== null && !registry.isActive(role, query.queryHash)) {
    cache.remove(query);
  }
}
