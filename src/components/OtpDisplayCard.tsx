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
    <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gradient-to-b dark:from-[#141926]/95 dark:to-[#0E121B]/95 p-6 sm:p-7 shadow-lg dark:shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl text-center space-y-6 transition-colors">
      {/* Eyebrow and Status */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
          One-Time Counter Code
        </span>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
          <motion.span
            animate={
              shouldReduceMotion
                ? {}
                : { opacity: [1, 0.3, 1] }
            }
            transition={{ duration: 1.8, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-emerald-500"
          />
          <span>Active Session</span>
        </div>
      </div>

      {/* 6-Digit Code Display */}
      <div className="py-4 px-4 sm:px-6 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10">
        <div className="flex items-center justify-center gap-2 sm:gap-3 my-2 font-mono">
          {digits.map((digit, idx) => (
            <motion.div
              key={idx}
              initial={shouldReduceMotion ? false : { y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
              className="w-10 h-14 sm:w-12 sm:h-16 rounded-xl bg-white dark:bg-[#161D2B] border border-blue-300 dark:border-cyan-500/40 flex items-center justify-center text-2xl sm:text-3xl font-extrabold text-blue-700 dark:text-cyan-300 shadow-2xs dark:shadow-[0_0_16px_rgba(6,182,212,0.25)] font-display"
            >
              {digit}
            </motion.div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-3 mt-4">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 transition active:scale-[0.98] cursor-pointer shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-300 font-bold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                <span>Copy Code</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowQr(!showQr)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 transition active:scale-[0.98] cursor-pointer shadow-2xs"
          >
            <QrCode className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
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
          className="p-5 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 flex flex-col items-center gap-3"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDataUrl}
            alt="Access QR Code"
            className="w-48 h-48 rounded-xl bg-white p-2.5 shadow-md"
          />
          <p className="text-xs text-slate-600 dark:text-slate-300 font-sans">
            Show this QR to the shop counter camera
          </p>
        </motion.div>
      )}

      {/* Countdown Timer Strip */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-left font-sans">Auto-purges upon print completion or timeout</span>
        </div>
        <span className="font-mono font-bold text-sm text-amber-900 dark:text-amber-300 shrink-0 pl-2">
          {formatTimeRemaining(secondsRemaining)}
        </span>
      </div>

      {/* Revoke Action */}
      <div className="pt-1">
        <button
          type="button"
          onClick={onRevoke}
          disabled={isRevoking}
          className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-200 dark:hover:border-rose-500/20 px-4 py-2.5 rounded-xl transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Revoke Session & Purge Files Now</span>
        </button>
      </div>
    </div>
  );
}
