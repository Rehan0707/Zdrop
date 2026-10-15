"use client";

import { ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";
import { SessionData } from "@/lib/types";

interface SuccessViewProps {
  session: SessionData | null;
  onReset: () => void;
}

export function SuccessView({ session, onReset }: SuccessViewProps) {
  return (
    <div className="zd-success-container">
      {/* Icon with glowing bloom */}
      <div className="zd-success-shield-wrap">
        <ShieldCheck size={42} />
      </div>

      {/* Headlines */}
      <div className="space-y-2">
        <h2
          style={{
            fontFamily: "var(--font-space-grotesk)",
            fontSize: "28px",
            fontWeight: 800,
            color: "var(--text-primary)",
            margin: "0 0 8px",
          }}
        >
          ZDrop Copy Purged
        </h2>
        <p
          style={{
            fontSize: "14px",
            color: "var(--text-secondary)",
            maxWidth: "380px",
            margin: "0 auto",
            lineHeight: 1.5,
          }}
        >
          {session?.deletionSource === "OPERATOR_PRINT"
            ? "The print window ended, and ZDrop removed its stored files. This does not verify physical printing. System captures and printer copies are outside ZDrop's control."
            : session?.status === "EXPIRED"
            ? "Your session expired, and ZDrop removed its stored copy. Copies already accessed by the operator or printer may still exist."
            : "Your session was revoked, and ZDrop removed its stored copy. Copies already accessed by the operator or printer may still exist."}
        </p>
      </div>

      {/* Anonymous Destruction Certificate Card */}
      <div className="zd-card-panel text-left text-xs max-w-sm mx-auto" style={{ width: "100%" }}>
        <div className="flex items-center justify-between pb-3" style={{ borderBottom: "1px solid var(--line)" }}>
          <div className="flex items-center gap-2 font-bold" style={{ color: "var(--text-primary)" }}>
            <CheckCircle2 size={16} style={{ color: "var(--success)" }} />
            <span>ZDrop Deletion Receipt</span>
          </div>
          <span className="zd-pill-active" style={{ fontSize: "10px", padding: "2px 8px" }}>
            Purged
          </span>
        </div>

        <div className="zd-receipt-grid">
          <div className="zd-receipt-item">
            <span className="zd-receipt-label">SESSION CODE</span>
            <span className="zd-receipt-val" style={{ color: "var(--primary-ink)" }}>
              {session?.accessCode || "Unavailable"}
            </span>
          </div>
          <div className="zd-receipt-item">
            <span className="zd-receipt-label">DELETION TRIGGER</span>
            <span className="zd-receipt-val" style={{ color: "var(--success)" }}>
              {session?.deletionSource === "OPERATOR_PRINT"
                ? "Print access ended"
                : session?.deletionSource === "STUDENT_REVOKE"
                ? "User Revoked"
                : "TTL Auto-Purge"}
            </span>
          </div>
          <div className="zd-receipt-item">
            <span className="zd-receipt-label">FILES IN ZDROP STORAGE</span>
            <span className="zd-receipt-val">0.00 Bytes</span>
          </div>
          <div className="zd-receipt-item">
            <span className="zd-receipt-label">ACTIVE DURATION</span>
            <span className="zd-receipt-val">
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
      <div style={{ paddingTop: "8px" }}>
        <button
          type="button"
          onClick={onReset}
          className="zd-button zd-button--primary"
          style={{ width: "100%", maxWidth: "384px", margin: "0 auto", height: "48px", fontSize: "14px" }}
        >
          <span>Print Another Document</span>
          <ArrowRight size={17} />
        </button>
      </div>
    </div>
  );
}
