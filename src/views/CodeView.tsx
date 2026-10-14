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
    <div className="zd-post-upload-view">
      {/* Top back button & file summary */}
      <div className="zd-post-upload-topbar">
        <button
          type="button"
          onClick={() => setIsConfirmOpen(true)}
          className="zd-code-back-btn"
        >
          <ArrowLeft size={16} />
          <span>Cancel Session</span>
        </button>

        <span className="zd-summary-pill">
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
      <div className="zd-card-panel text-xs">
        <div className="flex items-center justify-between pb-2" style={{ borderBottom: "1px solid var(--line)" }}>
          <div className="flex items-center gap-2 font-bold" style={{ color: "var(--text-primary)" }}>
            <Sliders size={15} style={{ color: "var(--text-secondary)" }} />
            <span>Configured Print Parameters</span>
          </div>
          <span className="zd-pill-active" style={{ fontSize: "10px", padding: "2px 8px" }}>
            <CheckCircle2 size={12} />
            Locked
          </span>
        </div>

        <div className="zd-params-grid">
          <div className="zd-param-item">
            <span className="zd-param-label">COPIES</span>
            <span className="zd-param-val">{session.preferences.copies}</span>
          </div>
          <div className="zd-param-item">
            <span className="zd-param-label">COLOR MODE</span>
            <span className="zd-param-val">
              {session.preferences.colorMode === "BW" ? "Grayscale (B&W)" : "Full Color"}
            </span>
          </div>
          <div className="zd-param-item">
            <span className="zd-param-label">SIDES</span>
            <span className="zd-param-val">
              {session.preferences.sides === "DOUBLE" ? "Double-Sided" : "Single-Sided"}
            </span>
          </div>
          <div className="zd-param-item">
            <span className="zd-param-label">PAGE RANGE</span>
            <span className="zd-param-val">{session.preferences.pageRange}</span>
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
