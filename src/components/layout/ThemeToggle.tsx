import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Theme } from "@/hooks/useTheme";

type ThemeToggleProps = {
  theme: Theme;
  onToggle: () => void;
};

/** Header control that switches between light and dark themes. */
export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isDark = theme === "dark";
  const label = `Switch to ${isDark ? "light" : "dark"} theme`;

  return (
    <Button
      type="button"
      className="icon-button"
      variant="outline"
      size="icon-lg"
      onClick={onToggle}
      aria-label={label}
      title={label}
    >
      {isDark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </Button>
  );
}
