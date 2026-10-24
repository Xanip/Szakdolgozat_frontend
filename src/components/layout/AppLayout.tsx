import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";
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
          <Routes>
            {routes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={<PagePlaceholder route={route} />}
              />
            ))}
            <Route
              path="*"
              element={<Navigate to={defaultRoutePath} replace />}
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}
