"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface ScreenshotProtectionOptions {
  enabled?: boolean;
  onAttempt?: (reason: string) => void;
}

export function useScreenshotProtection(options: ScreenshotProtectionOptions = {}) {
  const { enabled = true, onAttempt } = options;
  const [isShielded, setIsShielded] = useState(false);
  const [securityAlert, setSecurityAlert] = useState<string | null>(null);
  const alertTimerRef = useRef<NodeJS.Timeout | null>(null);
  const shieldTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerSecurityWarning = useCallback(
    (reason: string, temporaryShieldMs = 3000) => {
      onAttempt?.(reason);

      // Sanitize clipboard if screenshot was attempted
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText("").catch(() => {});
      }

      setSecurityAlert(
        "🔒 Screen Capture & Download Restricted: Customer documents cannot be saved or recorded under ZDrop privacy policy."
      );

      setIsShielded(true);

      if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
      alertTimerRef.current = setTimeout(() => {
        setSecurityAlert(null);
      }, 4000);

      if (shieldTimerRef.current) clearTimeout(shieldTimerRef.current);
      shieldTimerRef.current = setTimeout(() => {
        // Only unshield if document is currently focused
        if (typeof document !== "undefined" && !document.hidden && document.hasFocus()) {
          setIsShielded(false);
        }
      }, temporaryShieldMs);
    },
    [onAttempt]
  );

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    // 1. Detect Window Blur / Focus Loss (External Snipping Tools, Screen Recorders, Mac Grab)
    const handleBlur = () => {
      setIsShielded(true);
    };

    const handleFocus = () => {
      // Re-enable view when user focuses back into ZDrop
      setIsShielded(false);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsShielded(true);
      } else if (document.hasFocus()) {
        setIsShielded(false);
      }
    };

    // 2. Intercept Screenshot, Screen Record, Save, and DevTools Shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen key (Windows / Linux)
      if (e.key === "PrintScreen" || e.keyCode === 44) {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityWarning("PrintScreen key pressed");
        return;
      }

      const isModifier = e.metaKey || e.ctrlKey;

      // Mac screenshot shortcuts: Cmd + Shift + 3, Cmd + Shift + 4, Cmd + Shift + 5
      if (e.metaKey && e.shiftKey && (e.key === "3" || e.key === "4" || e.key === "5")) {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityWarning("macOS screenshot shortcut intercepted");
        return;
      }

      // Windows Snipping Tool shortcut: Win/Ctrl + Shift + S
      if (isModifier && e.shiftKey && (e.key === "S" || e.key === "s")) {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityWarning("Snipping tool shortcut intercepted");
        return;
      }

      // Save page / Save document shortcut: Ctrl + S / Cmd + S
      if (isModifier && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityWarning("Save shortcut blocked - downloads restricted");
        return;
      }

      // View Source shortcut: Ctrl + U / Cmd + U
      if (isModifier && (e.key === "u" || e.key === "U")) {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityWarning("View source blocked");
        return;
      }

      // DevTools shortcuts: F12, Ctrl/Cmd + Shift + I / C / J, Cmd + Alt + I / C / J
      if (
        e.key === "F12" ||
        (isModifier && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "C" || e.key === "c" || e.key === "J" || e.key === "j")) ||
        (e.metaKey && e.altKey && (e.key === "I" || e.key === "i" || e.key === "C" || e.key === "c" || e.key === "J" || e.key === "j"))
      ) {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityWarning("Developer inspection blocked");
        return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen" || e.keyCode === 44) {
        if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
          navigator.clipboard.writeText("").catch(() => {});
        }
        triggerSecurityWarning("PrintScreen key release sanitized");
      }
    };

    // 3. Block Context Menu (Right Click) across the protected surface
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest(".zd-console-body") || target?.closest(".zd-secure-surface")) {
        e.preventDefault();
        setSecurityAlert("🔒 Right-click disabled: Customer documents cannot be saved to disk.");
        if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
        alertTimerRef.current = setTimeout(() => setSecurityAlert(null), 3000);
      }
    };

    // 4. Block Dragging images/documents out of the browser
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest(".zd-secure-surface") || target?.tagName === "IMG" || target?.tagName === "IFRAME") {
        e.preventDefault();
      }
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("dragstart", handleDragStart);

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("dragstart", handleDragStart);
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
      if (shieldTimerRef.current) clearTimeout(shieldTimerRef.current);
    };
  }, [enabled, triggerSecurityWarning]);

  const clearAlert = useCallback(() => setSecurityAlert(null), []);
  const unshieldManually = useCallback(() => setIsShielded(false), []);

  return {
    isShielded,
    securityAlert,
    clearAlert,
    unshieldManually,
    triggerSecurityWarning,
  };
}
