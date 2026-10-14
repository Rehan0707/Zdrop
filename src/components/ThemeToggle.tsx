"use client";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";
interface ThemeToggleProps {
  className?: string;
  isHovered?: boolean;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
}
export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const label =
    resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme";
  return (
    <button
      type="button"
      className={`zd-icon-button ${className}`}
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      {resolvedTheme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  );
}
