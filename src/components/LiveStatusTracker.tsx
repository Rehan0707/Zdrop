"use client";

import { Check, CircleDot, Clock } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { SessionData } from "@/lib/types";

interface LiveStatusTrackerProps {
  status: SessionData["status"];
  deletionSource?: SessionData["deletionSource"];
}

export function LiveStatusTracker({ status, deletionSource }: LiveStatusTrackerProps) {
  const shouldReduceMotion = useReducedMotion();
  const copyPurged = status === "DELETED" || status === "EXPIRED";
  const finalLabel = status === "EXPIRED"
    ? "Session expired · ZDrop copy purged"
    : status === "DELETED" && deletionSource === "STUDENT_REVOKE"
      ? "Session cancelled · ZDrop copy purged"
      : status === "DELETED" && deletionSource === "OPERATOR_PRINT"
        ? "Print access ended · ZDrop copy purged"
        : status === "DELETED"
          ? "ZDrop copy purged"
          : status === "PRINTED"
            ? "Print reported complete"
            : "Print dialog closes · automatic cleanup";

  const steps = [
    {
      id: "UPLOADED",
      label: "Upload confirmed",
      desc: "Files are available to the operator during this temporary session.",
      isDone: ["ACTIVE", "ACCESSED", "PRINTED", "DELETED", "EXPIRED"].includes(status),
      isCurrent: status === "ACTIVE",
    },
    {
      id: "ACCESSED",
      label: "Accessed by Kiosk Operator",
      desc: "The operator opened the job using its access code.",
      isDone: ["ACCESSED", "PRINTED", "DELETED", "EXPIRED"].includes(status),
      isCurrent: status === "ACCESSED",
    },
    {
      id: "PRINTED",
      label: finalLabel,
      desc: copyPurged
        ? "ZDrop removed its stored copy. Printer output and shop-device copies are outside ZDrop's control."
        : status === "PRINTED"
          ? "The print window ended; ZDrop is finishing its stored-copy cleanup."
          : "ZDrop removes its stored copy after the job ends, the customer cancels, or the session expires. Printer and shop-device copies remain outside ZDrop's control.",
      isDone: copyPurged,
      isCurrent: status === "PRINTED" || copyPurged,
    },
  ];

  return (
    <div className="zd-card-panel">
      <div className="flex items-center gap-2 pb-3 mb-4" style={{ borderBottom: "1px solid var(--line)" }}>
        <Clock size={16} style={{ color: "var(--text-secondary)" }} />
        <h4 className="text-xs font-bold uppercase tracking-wider font-mono" style={{ color: "var(--text-primary)", margin: 0 }}>
          Job Status
        </h4>
      </div>

      <div className="space-y-4">
        {steps.map((step, idx) => {
          return (
            <div key={step.id} className="flex items-start gap-3.5 relative">
              <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                {step.isDone && !step.isCurrent ? (
                  <div className="zd-pipeline-step-icon zd-pipeline-step-icon--done">
                    <Check size={14} />
                  </div>
                ) : step.isCurrent ? (
                  <div className="zd-pipeline-step-icon zd-pipeline-step-icon--current">
                    <motion.div
                      animate={
                        shouldReduceMotion
                          ? {}
                          : { scale: [1, 1.25, 1] }
                      }
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <CircleDot size={14} />
                    </motion.div>
                  </div>
                ) : (
                  <div className="zd-pipeline-step-icon zd-pipeline-step-icon--pending text-[10px] font-bold font-mono">
                    {idx + 1}
                  </div>
                )}

                {/* Vertical connector line */}
                {idx < steps.length - 1 && (
                  <div
                    className={`zd-pipeline-line ${step.isDone ? "zd-pipeline-line--done" : ""}`}
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-semibold"
                  style={{
                    color: step.isCurrent
                      ? "var(--text-primary)"
                      : step.isDone
                      ? "var(--text-primary)"
                      : "var(--text-muted)",
                    fontWeight: step.isCurrent ? 700 : 600,
                    margin: 0,
                  }}
                >
                  {step.label}
                </p>
                <p
                  className="text-[11px] mt-0.5"
                  style={{ color: "var(--text-secondary)", margin: 0 }}
                >
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
