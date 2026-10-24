import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import type { Theme } from "@/hooks/useTheme";
import type { RouteConfig } from "@/types/navigation";

type AppHeaderProps = {
  route: RouteConfig;
  theme: Theme;
  mobileOpen: boolean;
  onToggleTheme: () => void;
  onOpenMobileNav: () => void;
};

/**
 * Shared page header.
 *
 * Shows the current page title and description (derived from the active
 * route), the mobile navigation trigger, and the theme toggle. Intentionally
 * free of business controls or global filters.
 */
export function AppHeader({
  route,
  theme,
  mobileOpen,
  onToggleTheme,
  onOpenMobileNav,
}: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="header-heading">
        <Button
          type="button"
          className="mobile-menu"
          variant="outline"
          size="icon-lg"
          aria-label="Open navigation"
          aria-expanded={mobileOpen}
          aria-controls="primary-navigation"
          onClick={onOpenMobileNav}
        >
          <Menu aria-hidden="true" />
        </Button>
        <div>
          <p className="header-kicker">Currency intelligence</p>
          <h1>{route.title}</h1>
          <p>{route.description}</p>
        </div>
      </div>
      <ThemeToggle theme={theme} onToggle={onToggleTheme} />
    </header>
  );
}
