import { describe, expect, it } from "vitest";

import {
  formatHighlightTooltip,
  getHighlight,
  highlightRadius,
  paletteColor,
  pieSliceAngles,
} from "@/components/Charts/chartHighlight";

describe("getHighlight", () => {
  const base = { names: ["A", "B"], totals: [3, 1] };

  it("no highlighted array: null", () => {
    expect(getHighlight(base)).toBeNull();
    expect(getHighlight({ ...base, highlighted: null })).toBeNull();
  });

  it("highlighted not aligned with names: null", () => {
    expect(getHighlight({ ...base, highlighted: [1] })).toBeNull();
  });

  it("aligned highlighted array is returned", () => {
    expect(getHighlight({ ...base, highlighted: [1, 0] })).toEqual([1, 0]);
  });
});

describe("formatHighlightTooltip", () => {
  it("without highlight: total only", () => {
    expect(formatHighlightTooltip("A", 42, null)).toBe("A: 42");
  });

  it("with highlight: both numbers and the rounded share", () => {
    expect(formatHighlightTooltip("A", 180, 42)).toBe("A: 42 / 180 (23%)");
  });

  it("zero total does not divide by zero", () => {
    expect(formatHighlightTooltip("A", 0, 0)).toBe("A: 0 / 0 (0%)");
  });
});

describe("paletteColor", () => {
  it("cycles through the palette", () => {
    const palette = ["#1", "#2", "#3"];
    expect([0, 1, 2, 3, 4].map((i) => paletteColor(palette, i))).toEqual([
      "#1", "#2", "#3", "#1", "#2",
    ]);
  });

  it("empty palette: empty string", () => {
    expect(paletteColor([], 2)).toBe("");
  });
});

describe("pieSliceAngles", () => {
  it("starts at 12 o'clock, goes clockwise, each slice value / sum of the circle", () => {
    const angles = pieSliceAngles([1, 1, 2]);
    expect(angles[0].startAngle).toBeCloseTo(-Math.PI / 2);
    expect(angles[0].endAngle).toBeCloseTo(0);
    expect(angles[1].endAngle).toBeCloseTo(Math.PI / 2);
    expect(angles[2].endAngle).toBeCloseTo((3 * Math.PI) / 2);
  });

  it("slices are contiguous and cover the full circle", () => {
    const angles = pieSliceAngles([10, 7, 4, 1]);
    angles.slice(1).forEach((slice, i) => expect(slice.startAngle).toBe(angles[i].endAngle));
    expect(angles[3].endAngle - angles[0].startAngle).toBeCloseTo(Math.PI * 2);
  });

  it("zero sum: no slices", () => {
    expect(pieSliceAngles([])).toEqual([]);
    expect(pieSliceAngles([0, 0])).toEqual([]);
  });
});

describe("highlightRadius", () => {
  it("fills the ring thickness by highlighted / total (50 total, 25 highlighted: half)", () => {
    expect(highlightRadius(40, 80, 50, 25)).toBe(60);
    expect(highlightRadius(40, 80, 50, 0)).toBe(40);
    expect(highlightRadius(40, 80, 50, 50)).toBe(80);
  });

  it("clamps the ratio and handles a zero total", () => {
    expect(highlightRadius(40, 80, 50, 75)).toBe(80);
    expect(highlightRadius(40, 80, 0, 0)).toBe(40);
  });
});
