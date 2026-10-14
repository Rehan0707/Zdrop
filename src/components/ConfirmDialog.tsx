"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isConfirming?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Delete Now",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  isConfirming = false,
}: ConfirmDialogProps) {
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const buttons = dialog.current?.querySelectorAll<HTMLButtonElement>("button");
    buttons?.[0]?.focus();

    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isConfirming) onCancel();
      if (event.key === "Tab" && buttons?.length) {
        const first = buttons[0],
          last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", keydown);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", keydown);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [isOpen, isConfirming, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            ref={dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-description"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="zd-kiosk-card max-w-sm w-full p-6 text-center space-y-4"
            style={{ margin: "auto", position: "relative", zIndex: 100 }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "var(--danger-soft)",
                border: "1px solid var(--danger)",
                color: "var(--danger)",
                display: "grid",
                placeItems: "center",
                margin: "0 auto"
              }}
            >
              <AlertTriangle size={24} />
            </div>

            <div>
              <h3 id="confirm-title" style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 6px" }}>
                {title}
              </h3>
              <p id="confirm-description" style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
                {message}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={isConfirming}
                className="zd-button zd-button--secondary flex-1"
                style={{ minHeight: "42px", padding: "8px 14px", fontSize: "12px" }}
              >
                {cancelLabel}
              </button>

              <button
                type="button"
                onClick={onConfirm}
                disabled={isConfirming}
                className="zd-btn-danger flex-1"
                style={{ minHeight: "42px", padding: "8px 14px", fontSize: "12px" }}
              >
                {isConfirming ? "Deleting..." : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
