import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";

type AppSidebarProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  onCollapse: () => void;
  onMobileClose: () => void;
};

/**
 * Persistent, collapsible navigation sidebar.
 *
 * - Expanded: icons + text labels. Collapsed: icons + tooltips.
 * - On narrow screens it becomes an overlay drawer (see `index.css`),
 *   toggled via `mobileOpen` with a click-away backdrop.
 * - The active route is derived from the current location.
 */
export function AppSidebar({
  collapsed,
  mobileOpen,
  onCollapse,
  onMobileClose,
}: AppSidebarProps) {
  const location = useLocation();

  return (
    <>
      {mobileOpen && (
        <Button
          type="button"
          className="sidebar-backdrop"
          variant="ghost"
          aria-label="Close navigation"
          onClick={onMobileClose}
        />
      )}
      <aside
        id="primary-navigation"
        className={`sidebar ${collapsed ? "sidebar-collapsed" : ""} ${
          mobileOpen ? "sidebar-mobile-open" : ""
        }`}
      >
        <div className="sidebar-brand">
          <div className="brand-mark" aria-hidden="true">
            FX
          </div>
          {!collapsed && <span>Currency Lens</span>}
          <Button
            type="button"
            className="mobile-close"
            variant="ghost"
            size="icon-lg"
            aria-label="Close navigation"
            onClick={onMobileClose}
          >
            <X aria-hidden="true" />
          </Button>
        </div>

        <nav className="sidebar-nav" aria-label="Primary navigation">
          {!collapsed && <span className="nav-label">Workspace</span>}
          {routes.map(({ path, title, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`nav-link ${active ? "nav-link-active" : ""}`}
                aria-current={active ? "page" : undefined}
                title={collapsed ? title : undefined}
                onClick={onMobileClose}
              >
                <Icon aria-hidden="true" />
                {!collapsed && <span>{title}</span>}
              </Link>
            );
          })}
        </nav>

        <Button
          type="button"
          className="collapse-button"
          variant="ghost"
          onClick={onCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight aria-hidden="true" />
          ) : (
            <ChevronLeft aria-hidden="true" />
          )}
          {!collapsed && <span>Collapse sidebar</span>}
        </Button>
      </aside>
    </>
  );
}
