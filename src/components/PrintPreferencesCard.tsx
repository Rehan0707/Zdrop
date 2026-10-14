"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { PrintPreferences } from "@/lib/types";
import { NumericStepper } from "./NumericStepper";
import { SegmentedControl } from "./SegmentedControl";

interface PrintPreferencesCardProps {
  preferences: PrintPreferences;
  onChange: (prefs: PrintPreferences) => void;
  disabled?: boolean;
}

export function PrintPreferencesCard({
  preferences,
  onChange,
  disabled = false,
}: PrintPreferencesCardProps) {
  const [isCustomPageRange, setIsCustomPageRange] = useState(
    preferences.pageRange !== "ALL"
  );

  const updateField = <K extends keyof PrintPreferences>(
    key: K,
    val: PrintPreferences[K]
  ) => {
    onChange({
      ...preferences,
      [key]: val,
    });
  };

  const handlePageRangeRadio = (custom: boolean) => {
    setIsCustomPageRange(custom);
    if (!custom) {
      updateField("pageRange", "ALL");
    } else {
      updateField("pageRange", "1-5");
    }
  };

  return (
    <fieldset
      disabled={disabled}
      className="bg-slate-50/80 dark:bg-[#121622]/90 rounded-2xl border border-slate-200 dark:border-white/10 p-4 sm:p-5 shadow-2xs space-y-4 transition-colors"
    >
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-white/5">
        <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight font-display">
          Print Preferences
        </h3>
      </div>

      {/* Copies Stepper */}
      <NumericStepper
        label="Number of Copies"
        value={preferences.copies}
        onChange={(val) => updateField("copies", val)}
      />

      {/* Color Mode */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block font-sans">
          Color Mode
        </label>
        <SegmentedControl
          options={[
            { id: "BW", label: "Black & White", subLabel: "Economy" },
            { id: "COLOR", label: "Full Color", subLabel: "Vibrant" },
          ]}
          value={preferences.colorMode}
          onChange={(val) => updateField("colorMode", val as "BW" | "COLOR")}
        />
      </div>

      {/* Print Sides */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block font-sans">
          Print Sides
        </label>
        <SegmentedControl
          options={[
            { id: "DOUBLE", label: "Double-Sided", subLabel: "Duplex" },
            { id: "SINGLE", label: "Single-Sided", subLabel: "Front Only" },
          ]}
          value={preferences.sides}
          onChange={(val) => updateField("sides", val as "SINGLE" | "DOUBLE")}
        />
      </div>

      {/* Page Selection */}
      <div className="space-y-2 pt-1">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block font-sans">
          Page Range
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handlePageRangeRadio(false)}
            disabled={disabled}
            className={`p-2.5 rounded-xl border text-left transition cursor-pointer active:scale-[0.98] ${
              !isCustomPageRange
                ? "border-blue-500 bg-blue-50 text-blue-900 font-semibold shadow-2xs dark:border-cyan-500/60 dark:bg-cyan-950/40 dark:text-cyan-200"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-[#161B26] dark:text-slate-400 dark:hover:border-white/20"
            }`}
          >
            <div className="text-xs font-medium">All Pages</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
              Print entire document
            </div>
          </button>

          <button
            type="button"
            onClick={() => handlePageRangeRadio(true)}
            disabled={disabled}
            className={`p-2.5 rounded-xl border text-left transition cursor-pointer active:scale-[0.98] ${
              isCustomPageRange
                ? "border-blue-500 bg-blue-50 text-blue-900 font-semibold shadow-2xs dark:border-cyan-500/60 dark:bg-cyan-950/40 dark:text-cyan-200"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-[#161B26] dark:text-slate-400 dark:hover:border-white/20"
            }`}
          >
            <div className="text-xs font-medium">Custom Range</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
              Select specific pages
            </div>
          </button>
        </div>

        {isCustomPageRange && (
          <div className="mt-2">
            <input
              type="text"
              placeholder="e.g. 1-5, 8, 11-14"
              value={preferences.pageRange === "ALL" ? "" : preferences.pageRange}
              onChange={(e) => updateField("pageRange", e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F131D] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-cyan-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-cyan-400 font-mono"
            />
          </div>
        )}
      </div>

      {/* Optional Note */}
      <div className="space-y-1.5 pt-1">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block font-sans">
          Instructions for Operator (Optional)
        </label>
        <input
          type="text"
          maxLength={120}
          placeholder="e.g. Staple top-left, landscape mode"
          value={preferences.customerNotes || ""}
          onChange={(e) => updateField("customerNotes", e.target.value)}
          className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F131D] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-cyan-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-cyan-400 font-sans"
        />
      </div>
    </fieldset>
  );
}
