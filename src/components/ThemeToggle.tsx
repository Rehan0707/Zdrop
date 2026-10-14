"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "./ThemeProvider";

interface ThemeToggleProps {
  className?: string;
  isHovered?: boolean;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
}

export function ThemeToggle({
  className = "",
  isHovered = false,
  onHoverStart,
  onHoverEnd,
}: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`w-11 h-11 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 opacity-50 ${className}`}
        aria-hidden="true"
      />
    );
  }

  const isDark = resolvedTheme === "dark";
  const label = isDark ? "Light Mode" : "Dark Mode";

  return (
    <motion.button
      layout
      type="button"
      onClick={toggleTheme}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onFocus={onHoverStart}
      onBlur={onHoverEnd}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={`relative h-11 rounded-full border transition-colors duration-200 flex items-center justify-center cursor-pointer active:scale-95 focus-visible:outline-2 focus-visible:outline-blue-500 select-none px-3 ${
        isHovered
          ? isDark
            ? "border-cyan-500/40 bg-cyan-950/40 text-cyan-300 shadow-[0_0_16px_rgba(6,182,212,0.25)]"
            : "border-blue-300 bg-blue-50 text-blue-700 shadow-sm"
          : isDark
            ? "border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900"
      } ${className}`}
    >
      <motion.div
        key={isDark ? "dark" : "light"}
        initial={{ rotate: -45, scale: 0.6, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        exit={{ rotate: 45, scale: 0.6, opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="flex items-center justify-center shrink-0"
      >
        {isDark ? (
          <Sun className="w-5 h-5 text-cyan-400" />
        ) : (
          <Moon className="w-5 h-5 text-blue-600" />
        )}
      </motion.div>

      <AnimatePresence>
        {isHovered && (
          <motion.span
            layout
            initial={{ opacity: 0, width: 0, marginLeft: 0 }}
            animate={{ opacity: 1, width: "auto", marginLeft: 8 }}
            exit={{ opacity: 0, width: 0, marginLeft: 0 }}
            transition={{ type: "spring", stiffness: 450, damping: 28 }}
            className="text-xs sm:text-sm font-semibold tracking-wide whitespace-nowrap overflow-hidden"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
