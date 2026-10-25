import { hashKey } from "@tanstack/react-query";

/**
 * A small external store holding one page's filter values in two versions:
 * - `draft`: updated immediately on every user change (drives the controls);
 * - `committed`: follows `draft` once changes pause for `delayMs`
 *   (drives the API request / query key).
 *
 * It lives outside React, so values survive page navigation, and a pending
 * debounce still commits when the page is not mounted.
 * Compatible with `useSyncExternalStore` (stable snapshots and methods).
 */
export type DebouncedState<T> = {
  getDraft(): T;
  getCommitted(): T;
  /** Applies a change to the draft and (re)starts the debounce timer. */
  update(updater: (current: T) => T): void;
  /** Commits a pending draft immediately. */
  flush(): void;
  subscribe(listener: () => void): () => void;
};

export function createDebouncedState<T>(
  initial: T,
  options: { delayMs: number; onCommit?: (committed: T) => void },
): DebouncedState<T> {
  let draft = initial;
  let committed = initial;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const listeners = new Set<() => void>();

  const notify = () => listeners.forEach((listener) => listener());

  const commit = () => {
    timer = undefined;
    // Changing a value and changing it back within the window starts nothing.
    if (hashKey([draft]) !== hashKey([committed])) {
      committed = draft;
      // Runs before listeners, so dependants (active query keys) are updated
      // before any component re-renders with the new committed value.
      options.onCommit?.(committed);
      notify();
    }
  };

  return {
    getDraft: () => draft,
    getCommitted: () => committed,
    update(updater) {
      const next = updater(draft);
      if (Object.is(next, draft)) return;
      draft = next;
      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(commit, options.delayMs);
      notify();
    },
    flush() {
      if (timer === undefined) return;
      clearTimeout(timer);
      commit();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
