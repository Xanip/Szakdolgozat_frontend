/**
 * A minimal external store for filter values that must apply at once and
 * never start an API request (like the Media Analytics cross-filter).
 *
 * Unlike `DebouncedState` there is no draft/committed split: every change is
 * visible immediately. It lives outside React, so the value survives page
 * navigation. Compatible with `useSyncExternalStore` (stable snapshots and
 * methods).
 */
export type ImmediateState<T> = {
  get(): T;
  /** Applies a change; listeners are notified only if the value changed. */
  update(updater: (current: T) => T): void;
  subscribe(listener: () => void): () => void;
};

export function createImmediateState<T>(initial: T): ImmediateState<T> {
  let value = initial;
  const listeners = new Set<() => void>();

  return {
    get: () => value,
    update(updater) {
      const next = updater(value);
      if (Object.is(next, value)) return;
      value = next;
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
