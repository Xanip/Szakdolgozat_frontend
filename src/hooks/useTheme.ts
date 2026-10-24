import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

function readStoredTheme(): Theme | null {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === "light" || saved === "dark" ? saved : null;
}

function getInitialTheme(): Theme {
  const stored = readStoredTheme();
  if (stored) return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

type UseThemeResult = {
  theme: Theme;
  toggleTheme: () => void;
};

/**
 * Owns all theme state for the application shell.
 *
 * Responsibilities:
 * - Initializes from a saved preference, falling back to the OS setting.
 * - Applies the theme to the document root via the `dark` class.
 * - Persists only an explicit user choice to local storage.
 * - Follows OS preference changes while the user has made no explicit choice.
 *
 * The pre-mount script in `index.html` sets the initial `dark` class to avoid
 * a flash of the wrong theme; this hook keeps it in sync afterwards.
 */
export function useTheme(): UseThemeResult {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [hasExplicitTheme, setHasExplicitTheme] = useState<boolean>(
    () => readStoredTheme() !== null,
  );

  // Reflect the active theme on the document root and persist explicit choices.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    if (hasExplicitTheme) localStorage.setItem(STORAGE_KEY, theme);
  }, [hasExplicitTheme, theme]);

  // Respect OS preference changes until the user picks a theme explicitly.
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      if (!hasExplicitTheme) setTheme(event.matches ? "dark" : "light");
    };
    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () =>
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, [hasExplicitTheme]);

  const toggleTheme = useCallback(() => {
    setHasExplicitTheme(true);
    setTheme((value) => (value === "dark" ? "light" : "dark"));
  }, []);

  return { theme, toggleTheme };
}
