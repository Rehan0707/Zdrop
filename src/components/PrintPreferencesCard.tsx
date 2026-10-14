"use client";
import { useId } from "react";
import { SlidersHorizontal } from "lucide-react";
import { PrintPreferences, FileMetadata, ShopPricing } from "@/lib/types";
import { NumericStepper } from "./NumericStepper";
import { SegmentedControl } from "./SegmentedControl";
import { LiveCostEstimator } from "./LiveCostEstimator";

interface PrintPreferencesCardProps {
  preferences: PrintPreferences;
  onChange: (prefs: PrintPreferences) => void;
  disabled?: boolean;
  files?: FileMetadata[];
  shopPricing?: ShopPricing | null;
  shopName?: string;
}

export function PrintPreferencesCard({
  preferences,
  onChange,
  disabled = false,
  files,
  shopPricing,
  shopName,
}: PrintPreferencesCardProps) {
  const id = useId();
  const update = <K extends keyof PrintPreferences>(
    key: K,
    value: PrintPreferences[K],
  ) => onChange({ ...preferences, [key]: value });
  const custom = preferences.pageRange !== "ALL";
  return (
    <fieldset
      className="zd-preferences"
      disabled={disabled}
      aria-label="Print preferences"
    >
      <legend>
        <SlidersHorizontal size={15} />
        Make it your print
      </legend>
      <NumericStepper
        label="Number of copies"
        value={preferences.copies}
        onChange={(value) => update("copies", value)}
      />
      <div className="zd-pref-grid">
        <div className="zd-field">
          <span>Color</span>
          <SegmentedControl
            ariaLabel="Color mode"
            options={[
              { id: "BW", label: "B & W" },
              { id: "COLOR", label: "Color" },
            ]}
            value={preferences.colorMode}
            onChange={(value) => update("colorMode", value as "BW" | "COLOR")}
          />
        </div>
        <div className="zd-field">
          <span>Sides</span>
          <SegmentedControl
            ariaLabel="Print sides"
            options={[
              { id: "SINGLE", label: "Single" },
              { id: "DOUBLE", label: "Double" },
            ]}
            value={preferences.sides}
            onChange={(value) => update("sides", value as "SINGLE" | "DOUBLE")}
          />
        </div>
      </div>
      <div className="zd-field zd-field-wide">
        <span>Pages</span>
        <SegmentedControl
          ariaLabel="Page selection"
          options={[
            { id: "ALL", label: "All pages" },
            { id: "CUSTOM", label: "Choose a range" },
          ]}
          value={custom ? "CUSTOM" : "ALL"}
          onChange={(value) =>
            update("pageRange", value === "ALL" ? "ALL" : "1-5")
          }
        />
        {custom && (
          <input
            className="zd-input zd-range"
            aria-label="Custom page range"
            placeholder="e.g. 1-5, 8, 11-14"
            value={preferences.pageRange}
            onChange={(event) => update("pageRange", event.target.value)}
          />
        )}
      </div>
      <div className="zd-field zd-field-wide">
        <label htmlFor={`${id}-note`}>
          Note for the shop <small>Optional</small>
        </label>
        <input
          className="zd-input"
          id={`${id}-note`}
          maxLength={120}
          placeholder="Staple top-left, landscape…"
          value={preferences.customerNotes || ""}
          onChange={(event) => update("customerNotes", event.target.value)}
        />
      </div>

      {files && files.length > 0 && (
        <LiveCostEstimator
          files={files}
          preferences={preferences}
          shopPricing={shopPricing}
          shopName={shopName}
        />
      )}
    </fieldset>
  );
}
