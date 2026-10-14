"use client";

import { useState } from "react";
import { ArrowLeft, FileText, CheckCircle2, Sliders } from "lucide-react";
import { SessionData } from "@/lib/types";
import { OtpDisplayCard } from "@/components/OtpDisplayCard";
import { LiveStatusTracker } from "@/components/LiveStatusTracker";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { formatBytes } from "@/lib/utils";

interface CodeViewProps {
  session: SessionData;
  onRevokeSession: () => void;
  onBackToUpload: () => void;
  isRevoking?: boolean;
}

export function CodeView({
  session,
  onRevokeSession,
  onBackToUpload,
  isRevoking = false,
}: CodeViewProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  return (
    <div className="max-w-md mx-auto px-4 py-8 sm:py-12 space-y-6">
      {/* Top back button & file summary */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsConfirmOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition active:scale-[0.98] cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Cancel Session</span>
        </button>

        <span className="text-xs text-slate-700 dark:text-slate-400 font-mono bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 px-2.5 py-1 rounded-lg">
          {session.files.length} file{session.files.length > 1 ? "s" : ""} · {formatBytes(session.totalSizeBytes)}
        </span>
      </div>

      {/* Main OTP Card */}
      <OtpDisplayCard
        accessCode={session.accessCode}
        expiresAt={session.expiresAt}
        onRevoke={() => setIsConfirmOpen(true)}
        isRevoking={isRevoking}
      />

      {/* Live Status Progression */}
      <LiveStatusTracker status={session.status} />

      {/* Preferences Summary Micro-Card */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121622]/90 backdrop-blur-md shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] text-xs space-y-2.5 transition-colors">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white font-display">
            <Sliders className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
            <span>Configured Print Parameters</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Locked
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 text-slate-700 dark:text-slate-300 pt-1 font-mono text-[11px]">
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/5">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] block">COPIES</span>
            <span className="font-bold text-slate-900 dark:text-white">{session.preferences.copies}</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/5">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] block">COLOR MODE</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {session.preferences.colorMode === "BW" ? "Grayscale (B&W)" : "Full Color"}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/5">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] block">SIDES</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {session.preferences.sides === "DOUBLE" ? "Double-Sided" : "Single-Sided"}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/5">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] block">PAGE RANGE</span>
            <span className="font-bold text-slate-900 dark:text-white">{session.preferences.pageRange}</span>
          </div>
        </div>
      </div>

      {/* Confirm Revoke Modal */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Revoke Session & Purge Files?"
        message="This immediately destroys all uploaded documents and disables your 6-digit access code. This action is irreversible."
        confirmLabel="Purge Now"
        onConfirm={() => {
          setIsConfirmOpen(false);
          onRevokeSession();
        }}
        onCancel={() => setIsConfirmOpen(false)}
        isConfirming={isRevoking}
      />
    </div>
  );
}
