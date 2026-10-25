import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { DimensionDataGate } from "@/components/layout/DimensionDataGate";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";
import { SecondPagePlaceholder } from "@/components/layout/SecondPagePlaceholder";
import { useTheme } from "@/hooks/useTheme";
import { defaultRoutePath, routes } from "@/lib/routes";

/**
 * Application shell: sidebar + header + routed main content.
 *
 * Owns the layout-only UI state (sidebar collapsed / mobile drawer open) and
 * delegates theme handling to `useTheme`. Page content is intentionally
 * minimal here — each analytics page is implemented under its own spec.
 */
export function AppLayout() {
  const location = useLocation();
  const currentRoute =
    routes.find((route) => route.path === location.pathname) ?? routes[0];

  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the mobile drawer once the viewport is back to desktop width.
  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 721px)");
    const handleDesktopTransition = (event: MediaQueryListEvent) => {
      if (event.matches) setMobileOpen(false);
    };
    mediaQuery.addEventListener("change", handleDesktopTransition);
    return () =>
      mediaQuery.removeEventListener("change", handleDesktopTransition);
  }, []);

  return (
    <div className="app-shell">
      <AppSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCollapse={() => setCollapsed((value) => !value)}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className={`app-main ${collapsed ? "app-main-collapsed" : ""}`}>
        <AppHeader
          route={currentRoute}
          theme={theme}
          mobileOpen={mobileOpen}
          onToggleTheme={toggleTheme}
          onOpenMobileNav={() => setMobileOpen(true)}
        />
        <main className="content-area">
          {/* Pages stay unusable until the filter (dimension) data loads. */}
          <DimensionDataGate>
            <Routes>
              <Route
                path="*"
                element={<Navigate to={defaultRoutePath} replace />}
              />
              <Route
                key="/exchange-rates"
                path="/exchange-rates"
                element={<PagePlaceholder route={routes[0]}/>}
              />
              <Route
                key="/daily-heatmap"
                path="/daily-heatmap"
                element={<SecondPagePlaceholder route={routes[1]}/>}
              />
              <Route
                key="/media-analytics"
                path="/media-analytics"
                element={<PagePlaceholder route={routes[2]}/>}
              />
            </Routes>
          </DimensionDataGate>
        </main>
      </div>
    </div>
  );
}
