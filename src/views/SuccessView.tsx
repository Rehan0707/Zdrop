"use client";

import { ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";
import { SessionData } from "@/lib/types";

interface SuccessViewProps {
  session: SessionData | null;
  onReset: () => void;
}

export function SuccessView({ session, onReset }: SuccessViewProps) {
  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-20 text-center space-y-6">
      {/* Icon with glowing bloom */}
      <div className="relative inline-flex items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-500/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-md dark:shadow-[0_0_30px_rgba(16,185,129,0.3)]">
          <ShieldCheck className="w-10 h-10" />
        </div>
      </div>

      {/* Headlines */}
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-display">
          Files Permanently Destroyed
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-sm mx-auto font-sans leading-relaxed">
          {session?.deletionSource === "OPERATOR_PRINT"
            ? "The operator marked your print job complete. Your files have been completely shredded from ZDrop storage."
            : session?.status === "EXPIRED"
            ? "Your 15-minute session expired. All uploaded files have been automatically purged by the server TTL."
            : "Your session was manually revoked. Uploaded files have been purged from storage."}
        </p>
      </div>

      {/* Anonymous Destruction Certificate Card */}
      <div className="p-5 rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-white dark:bg-gradient-to-b dark:from-[#141926]/90 dark:to-[#0D1018]/90 shadow-md dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] text-left text-xs space-y-3 max-w-sm mx-auto backdrop-blur-md transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white font-display">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Zero-Retention Audit Receipt</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 px-2 py-0.5 rounded-full">
            Purged
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-slate-700 dark:text-slate-300 pt-1 font-mono text-[11px]">
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[10px]">SESSION CODE</span>
            <span className="font-bold text-blue-700 dark:text-cyan-300">
              {session?.accessCode || "482913"}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[10px]">DELETION TRIGGER</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              {session?.deletionSource === "OPERATOR_PRINT"
                ? "Print Completed"
                : session?.deletionSource === "STUDENT_REVOKE"
                ? "User Revoked"
                : "TTL Auto-Purge"}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[10px]">FILES RETAINED</span>
            <span className="font-bold text-slate-900 dark:text-white">0.00 Bytes</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[10px]">ACTIVE DURATION</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {Math.max(
                0,
                Math.round(
                  ((session?.deletedAt || Date.now()) - (session?.createdAt || Date.now())) / 1000
                )
              )}{" "}
              sec
            </span>
          </div>
        </div>
      </div>

      {/* Primary CTA */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onReset}
          className="w-full max-w-sm mx-auto h-13 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-cyan-500 dark:via-sky-500 dark:to-blue-600 hover:from-blue-500 hover:to-indigo-500 dark:hover:from-cyan-400 dark:hover:to-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer shadow-md dark:shadow-[0_0_20px_rgba(6,182,212,0.3)] text-sm font-display"
        >
          <span>Print Another Document</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
