"use client";
import { Minus, Plus } from "lucide-react";
interface NumericStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
}
export function NumericStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  label = "Copies",
}: NumericStepperProps) {
  return (
    <div className="zd-pref-row">
      <span>{label}</span>
      <div className="zd-stepper">
        <button
          type="button"
          onClick={() => value > min && onChange(value - 1)}
          disabled={value <= min}
          aria-label="Decrease copies"
        >
          <Minus size={15} />
        </button>
        <output aria-label="Copies" aria-live="polite">
          {value}
        </output>
        <button
          type="button"
          onClick={() => value < max && onChange(value + 1)}
          disabled={value >= max}
          aria-label="Increase copies"
        >
          <Plus size={15} />
        </button>
      </div>
    </div>
  );
}
