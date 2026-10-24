import { BarChart3, LineChart, Newspaper } from "lucide-react";

import type { RouteConfig } from "@/types/navigation";

/**
 * Single source of truth for the currently planned analytics pages.
 *
 * The sidebar, the header, and the router all derive from this array, so
 * adding or reordering a page is a one-line change here. Prediction and
 * Correlation pages are intentionally omitted until their backend APIs and
 * page specifications are ready.
 */
export const routes: RouteConfig[] = [
  {
    path: "/exchange-rates",
    title: "FX Performance",
    description: "Monitor currency exchange rate performance.",
    icon: LineChart,
  },
  {
    path: "/daily-heatmap",
    title: "Daily Heatmap",
    description: "Explore daily movements across currency pairs.",
    icon: BarChart3,
  },
  {
    path: "/media-analytics",
    title: "Media Analytics",
    description: "Review the relationship between currencies and news.",
    icon: Newspaper,
  },
];

/** Path used when the current location does not match any known route. */
export const defaultRoutePath = routes[0].path;
