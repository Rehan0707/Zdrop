"use client";
import { useRef } from "react";
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
  ariaLabel?: string;
}
export function SegmentedControl({
  options,
  value,
  onChange,
  className = "",
  ariaLabel,
}: SegmentedControlProps) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  return (
    <div
      className={`zd-segments ${className}`}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {options.map((option, index) => (
        <button
          key={option.id}
          ref={(element) => {
            buttons.current[index] = element;
          }}
          type="button"
          role="radio"
          aria-checked={option.id === value}
          tabIndex={option.id === value ? 0 : -1}
          onClick={() => onChange(option.id)}
          onKeyDown={(event) => {
            let next = index;
            if (event.key === "ArrowRight" || event.key === "ArrowDown")
              next = (index + 1) % options.length;
            else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
              next = (index - 1 + options.length) % options.length;
            else if (event.key === "Home") next = 0;
            else if (event.key === "End") next = options.length - 1;
            else return;
            event.preventDefault();
            onChange(options[next].id);
            buttons.current[next]?.focus();
          }}
        >
          <span>{option.label}</span>
          {option.subLabel && <small>{option.subLabel}</small>}
        </button>
      ))}
    </div>
  );
}
