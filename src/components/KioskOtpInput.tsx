"use client";

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from "react";
import { Delete, ArrowRight, AlertCircle, RefreshCw } from "lucide-react";

interface KioskOtpInputProps {
  onSubmit: (code: string) => void;
  isLoading?: boolean;
  errorMessage?: string | null;
  onClearError?: () => void;
}

export function KioskOtpInput({
  onSubmit,
  isLoading = false,
  errorMessage = null,
  onClearError,
}: KioskOtpInputProps) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigitChange = (index: number, value: string) => {
    if (onClearError) onClearError();
    const clean = value.replace(/[^0-9]/g, "");
    if (!clean) {
      const updated = [...digits];
      updated[index] = "";
      setDigits(updated);
      return;
    }

    const lastChar = clean[clean.length - 1];
    const updated = [...digits];
    updated[index] = lastChar;
    setDigits(updated);

    // Auto-advance
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else {
      // Completed 6th digit
      const fullCode = updated.join("");
      if (fullCode.length === 6) {
        onSubmit(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (onClearError) onClearError();
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    if (!pasted) return;

    const updated = [...digits];
    for (let i = 0; i < pasted.length; i++) {
      updated[i] = pasted[i];
    }
    setDigits(updated);

    if (pasted.length === 6) {
      onSubmit(pasted);
    } else if (pasted.length < 6) {
      inputRefs.current[pasted.length]?.focus();
    }
  };

  const handleKeypadPress = (val: string) => {
    if (onClearError) onClearError();
    if (val === "BACKSPACE") {
      for (let i = 5; i >= 0; i--) {
        if (digits[i]) {
          const updated = [...digits];
          updated[i] = "";
          setDigits(updated);
          inputRefs.current[i]?.focus();
          break;
        }
      }
      return;
    }

    if (val === "CLEAR") {
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      return;
    }

    const firstEmpty = digits.findIndex((d) => d === "");
    if (firstEmpty !== -1) {
      handleDigitChange(firstEmpty, val);
    }
  };

  const isComplete = digits.every((d) => d !== "");

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* 6 Digit Input Boxes */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-3" onPaste={handlePaste}>
        {digits.map((digit, idx) => (
          <div key={idx} className="flex items-center">
            <input
              ref={(el) => {
                inputRefs.current[idx] = el;
              }}
              type="text"
              inputMode="numeric"
              aria-label={`Access code digit ${idx + 1}`}
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              disabled={isLoading}
              className={`w-9 min-[375px]:w-10 h-14 sm:w-14 sm:h-20 text-center text-2xl sm:text-3xl font-extrabold font-mono rounded-xl border-2 transition-all outline-none ${
                digit
                  ? "border-blue-600 bg-blue-50/60 text-blue-700 shadow-2xs dark:border-cyan-500 dark:bg-[#161D2C] dark:text-cyan-300 dark:shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                  : "border-slate-300 bg-white text-slate-800 hover:border-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-white/10 dark:bg-black/40 dark:text-slate-300 dark:hover:border-white/20 dark:focus:border-cyan-500 dark:focus:bg-[#161D2C] dark:focus:ring-4 dark:focus:ring-cyan-500/20"
              }`}
            />
            {idx === 2 && (
              <span className="hidden min-[375px]:inline mx-1 text-slate-400 dark:text-slate-600 font-bold text-xl select-none">
                •
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 rounded-xl">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Manual Submit Button */}
      <button
        type="button"
        onClick={() => isComplete && onSubmit(digits.join(""))}
        disabled={!isComplete || isLoading}
        className="w-full h-13 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 dark:from-cyan-500 dark:via-sky-500 dark:to-blue-600 dark:hover:from-cyan-400 dark:hover:to-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] cursor-pointer shadow-md dark:shadow-[0_0_20px_rgba(6,182,212,0.3)] text-sm font-display"
      >
        {isLoading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Resolving Code…</span>
          </>
        ) : (
          <>
            <span>Access Session Documents</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {/* On-screen Keypad for Touch Kiosks */}
      <div className="pt-2">
        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-500 text-center uppercase tracking-wider mb-2 font-mono">
          Counter Terminal Keypad
        </p>
        <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "CLEAR", "0", "BACKSPACE"].map(
            (key) => (
              <button
                key={key}
                type="button"
                onClick={() => handleKeypadPress(key)}
                disabled={isLoading}
                className="h-12 rounded-xl border border-slate-200 dark:border-white/10 bg-white hover:bg-slate-50 dark:bg-[#141926] dark:hover:bg-[#1a2133] text-slate-800 dark:text-slate-200 font-bold text-base flex items-center justify-center active:scale-[0.96] transition cursor-pointer shadow-2xs dark:shadow-sm"
              >
                {key === "BACKSPACE" ? (
                  <Delete className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                ) : key === "CLEAR" ? (
                  <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold font-mono">CLEAR</span>
                ) : (
                  key
                )}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
