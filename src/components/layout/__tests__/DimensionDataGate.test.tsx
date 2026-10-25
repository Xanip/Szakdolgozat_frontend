import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DimensionDataGateView } from "@/components/layout/DimensionDataGate";

const render = (status: "pending" | "error" | "success", isRetrying = false) =>
  renderToStaticMarkup(
    <DimensionDataGateView status={status} isRetrying={isRetrying} onRetry={() => {}}>
      <p>page content</p>
    </DimensionDataGateView>,
  );

describe("DimensionDataGateView", () => {
  it("shows a loading status and hides the pages while loading", () => {
    const html = render("pending");
    expect(html).toContain('role="status"');
    expect(html).not.toContain("page content");
  });

  it("shows an error with a Retry button and hides the pages on failure", () => {
    const html = render("error");
    expect(html).toContain('role="alertdialog"');
    expect(html).toContain("Filter data could not be loaded");
    expect(html).toMatch(/<button[^>]*>.*Retry<\/button>/);
    expect(html).not.toContain("page content");
  });

  it("disables the Retry button while retrying", () => {
    expect(render("error", true)).toMatch(/<button[^>]*disabled[^>]*>.*Retrying…<\/button>/);
  });

  it("renders the pages once the data is loaded", () => {
    expect(render("success")).toBe("<p>page content</p>");
  });
});
