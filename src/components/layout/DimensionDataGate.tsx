import type { ReactNode } from "react";
import { RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useDimensionData } from "@/hooks/api/useDimensionData";

type DimensionDataGateViewProps = {
  status: "pending" | "error" | "success";
  isRetrying: boolean;
  onRetry: () => void;
  children: ReactNode;
};

/**
 * Presentational part of the gate (kept separate so it can be tested without
 * a QueryClient). Pages render only after the dimension data has loaded.
 */
export function DimensionDataGateView({
  status,
  isRetrying,
  onRetry,
  children,
}: DimensionDataGateViewProps) {
  if (status === "success") return <>{children}</>;

  if (status === "pending") {
    return (
      <section className="placeholder" role="status" aria-live="polite">
        <p className="placeholder-copy">Loading filter data…</p>
      </section>
    );
  }

  return (
    <section
      className="placeholder"
      role="alertdialog"
      aria-labelledby="dimension-error-title"
      aria-describedby="dimension-error-copy"
    >
      <p className="eyebrow">Loading error</p>
      <h2 id="dimension-error-title">Filter data could not be loaded</h2>
      <p id="dimension-error-copy" className="placeholder-copy">
        The base filter data did not load, so the analytics pages cannot be
        used yet. Retry now, or reload the page (F5).
      </p>
      <Button
        className="mt-6"
        onClick={onRetry}
        disabled={isRetrying}
        autoFocus
      >
        <RotateCw aria-hidden="true" />
        {isRetrying ? "Retrying…" : "Retry"}
      </Button>
    </section>
  );
}

/**
 * Blocks the routed pages until GET /exchange-rates/pages succeeds; shows an
 * error with a Retry button when it fails. The shell (sidebar, header) stays
 * usable.
 */
export function DimensionDataGate({ children }: { children: ReactNode }) {
  const { status, isFetching, refetch } = useDimensionData();
  return (
    <DimensionDataGateView
      status={status}
      isRetrying={isFetching}
      onRetry={() => void refetch()}
    >
      {children}
    </DimensionDataGateView>
  );
}
