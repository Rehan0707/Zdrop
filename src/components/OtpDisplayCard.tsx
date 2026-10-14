"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Copy, Check, QrCode, Clock, ShieldAlert } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { formatTimeRemaining } from "@/lib/utils";

interface OtpDisplayCardProps {
  accessCode: string;
  expiresAt: number;
  onRevoke: () => void;
  isRevoking?: boolean;
}

export function OtpDisplayCard({
  accessCode,
  expiresAt,
  onRevoke,
  isRevoking = false,
}: OtpDisplayCardProps) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(
    Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
  );

  const shouldReduceMotion = useReducedMotion();

  // Tick down timer
  useEffect(() => {
    const interval = setInterval(() => {
      const left = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setSecondsRemaining(left);
      if (left <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  // Generate QR code for counter scanner
  useEffect(() => {
    if (typeof window === "undefined") return;
    const kioskUrl = `${window.location.origin}/kiosk?code=${accessCode}`;
    QRCode.toDataURL(kioskUrl, {
      margin: 1,
      width: 220,
      color: {
        dark: "#0A0D14",
        light: "#FFFFFF",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("Error generating QR", err));
  }, [accessCode]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(accessCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const digits = accessCode.split("");

  return (
    <div className="zd-card-panel text-center">
      {/* Eyebrow and Status */}
      <div className="zd-card-header">
        <p className="zd-eyebrow" style={{ margin: 0 }}>
          <span className="zd-dot" aria-hidden="true" />
          One-Time Counter Code
        </p>
        <div className="zd-pill-active">
          <motion.span
            animate={
              shouldReduceMotion
                ? {}
                : { opacity: [1, 0.3, 1] }
            }
            transition={{ duration: 1.8, repeat: Infinity }}
            className="w-2 h-2 rounded-full"
            style={{ background: "var(--success)" }}
          />
          <span>Active Session</span>
        </div>
      </div>

      {/* 6-Digit Code Display */}
      <div className="zd-display-digits-box">
        <div className="zd-display-digits">
          {digits.map((digit, idx) => (
            <motion.div
              key={idx}
              initial={shouldReduceMotion ? false : { y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
              className="zd-display-digit"
            >
              {digit}
            </motion.div>
          ))}
        </div>

        <div className="zd-display-actions">
          <button
            type="button"
            onClick={handleCopy}
            className="zd-button zd-button--secondary"
            style={{ minHeight: "38px", padding: "6px 14px", fontSize: "12px" }}
          >
            {copied ? (
              <>
                <Check size={14} style={{ color: "var(--success)" }} />
                <span style={{ color: "var(--success)", fontWeight: 700 }}>Copied</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy Code</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowQr(!showQr)}
            className="zd-button zd-button--secondary"
            style={{ minHeight: "38px", padding: "6px 14px", fontSize: "12px" }}
          >
            <QrCode size={14} />
            <span>{showQr ? "Hide QR" : "Show QR"}</span>
          </button>
        </div>
      </div>

      {/* Dynamic QR Modal / Expand */}
      {showQr && qrDataUrl && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="zd-code-qr-card"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDataUrl}
            alt="Access QR Code"
          />
          <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)" }}>
            Show this QR to the shop counter camera or barcode scanner
          </p>
        </motion.div>
      )}

      {/* Countdown Timer Strip */}
      <div className="zd-timer-box">
        <div className="flex items-center gap-2">
          <Clock size={16} style={{ color: "var(--text-secondary)" }} />
          <span>Auto-purges upon print completion or timeout</span>
        </div>
        <span className="zd-timer-val">
          {formatTimeRemaining(secondsRemaining)}
        </span>
      </div>

      {/* Revoke Action */}
      <div style={{ paddingTop: "6px" }}>
        <button
          type="button"
          onClick={onRevoke}
          disabled={isRevoking}
          className="zd-btn-danger"
          style={{ width: "100%", minHeight: "40px", fontSize: "12px" }}
        >
          <ShieldAlert size={15} />
          <span>Revoke Session & Purge Files Now</span>
        </button>
      </div>
    </div>
  );
}
