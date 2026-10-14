"use client";

import { motion } from "motion/react";

interface Option {
  id: string;
  label: string;
  subLabel?: string;
}

interface SegmentedControlProps {
  options: Option[];
  value: string;
  onChange: (val: string) => void;
  className?: string;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  className = "",
}: SegmentedControlProps) {
  return (
    <div
      className={`relative flex bg-slate-100 dark:bg-[#121622] p-1 rounded-xl border border-slate-200 dark:border-white/10 transition-colors ${className}`}
      role="radiogroup"
    >
      {options.map((option) => {
        const isSelected = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.id)}
            className={`relative flex-1 py-2 px-3 text-xs sm:text-sm font-semibold text-center transition-colors duration-150 z-10 active:scale-[0.98] cursor-pointer rounded-lg flex flex-col items-center justify-center ${
              isSelected
                ? "text-blue-700 dark:text-white font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <span>{option.label}</span>
            {option.subLabel && (
              <span
                className={`text-[10px] font-normal ${
                  isSelected ? "text-blue-600 dark:text-cyan-300" : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {option.subLabel}
              </span>
            )}
            {isSelected && (
              <motion.div
                layoutId="segmented-pill"
                className="absolute inset-0 bg-white dark:bg-[#1E2536] rounded-lg shadow-xs dark:shadow-sm border border-slate-200/80 dark:border-cyan-500/30 -z-10"
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
