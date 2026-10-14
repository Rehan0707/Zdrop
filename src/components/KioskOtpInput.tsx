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
    <div className="w-full max-w-md mx-auto">
      {/* 6 Digit Input Boxes */}
      <div className="zd-otp-container" onPaste={handlePaste}>
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
              className={`zd-otp-digit ${digit ? "zd-otp-digit--filled" : ""}`}
            />
            {idx === 2 && (
              <span className="zd-otp-separator">
                •
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="zd-alert-danger" style={{ marginTop: "16px" }}>
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Manual Submit Button */}
      <button
        type="button"
        onClick={() => isComplete && onSubmit(digits.join(""))}
        disabled={!isComplete || isLoading}
        className="zd-kiosk-submit"
      >
        {isLoading ? (
          <>
            <RefreshCw className="animate-spin" size={16} />
            <span>Resolving Code…</span>
          </>
        ) : (
          <>
            <span>Access Session Documents</span>
            <ArrowRight size={17} />
          </>
        )}
      </button>

      {/* On-screen Keypad for Touch Kiosks */}
      <div className="zd-keypad-wrapper">
        <p className="zd-keypad-label">
          Counter Terminal Keypad
        </p>
        <div className="zd-keypad-grid">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "CLEAR", "0", "BACKSPACE"].map(
            (key) => (
              <button
                key={key}
                type="button"
                onClick={() => handleKeypadPress(key)}
                disabled={isLoading}
                className={`zd-keypad-key ${key === "CLEAR" ? "zd-keypad-key--clear" : ""}`}
              >
                {key === "BACKSPACE" ? (
                  <Delete size={20} />
                ) : key === "CLEAR" ? (
                  "CLEAR"
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
