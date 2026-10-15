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

      setSecurityAlert(
        "A restricted shortcut was detected. The preview is obscured briefly; this cannot block system or external capture tools."
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

    // 2. Detect common shortcuts and obscure the preview as a deterrent; OS-level capture remains possible.
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen key (Windows / Linux)
      if (e.key === "PrintScreen" || e.keyCode === 44) {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityWarning("PrintScreen key pressed");
        return;
      }

      const isModifier = e.metaKey || e.ctrlKey;

      // Detect common macOS screenshot shortcuts.
      if (e.metaKey && e.shiftKey && (e.key === "3" || e.key === "4" || e.key === "5")) {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityWarning("macOS screenshot shortcut intercepted");
        return;
      }

      // Detect common snipping-tool shortcuts.
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
        triggerSecurityWarning("Save shortcut detected");
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

    // 3. Block the in-page context menu as a casual-copy deterrent.
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest(".zd-console-body") || target?.closest(".zd-secure-surface")) {
        e.preventDefault();
        setSecurityAlert("Right-click is disabled here; other ways to save or capture the document may still work.");
        if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
        alertTimerRef.current = setTimeout(() => setSecurityAlert(null), 3000);
      }
    };

    // 4. Prevent dragging the preview element; this does not prevent other copies.
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
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("dragstart", handleDragStart);

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("keydown", handleKeyDown, true);
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
