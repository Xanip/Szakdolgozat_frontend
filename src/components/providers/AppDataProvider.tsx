import { useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";

import { AppDataContext, createAppData } from "@/lib/appData";

/**
 * Provides the QueryClient and the per-page filter state to the whole app.
 * Created once per app mount and placed above the router, so in-app
 * navigation keeps both the filters and the cached results.
 */
export function AppDataProvider({ children }: { children: ReactNode }) {
  const [appData] = useState(() => createAppData());
  return (
    <AppDataContext.Provider value={appData}>
      <QueryClientProvider client={appData.queryClient}>
        {children}
      </QueryClientProvider>
    </AppDataContext.Provider>
  );
}
