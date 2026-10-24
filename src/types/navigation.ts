import type { LucideIcon } from "lucide-react";

/**
 * Describes a single navigation entry / routed page in the application shell.
 * Used by the sidebar, the header (title + description), and the router.
 */
export type RouteConfig = {
  path: string;
  title: string;
  description: string;
  icon: LucideIcon;
};
