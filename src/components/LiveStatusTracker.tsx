"use client";

import { Check, CircleDot, Clock } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { SessionStatus } from "@/lib/types";

interface LiveStatusTrackerProps {
  status: SessionStatus;
}

export function LiveStatusTracker({ status }: LiveStatusTrackerProps) {
  const shouldReduceMotion = useReducedMotion();

  const steps = [
    {
      id: "UPLOADED",
      label: "Uploaded & Encrypted",
      desc: "Files staged in temporary volatile memory",
      isDone: ["ACTIVE", "ACCESSED", "PRINTED", "DELETED"].includes(status),
      isCurrent: status === "ACTIVE",
    },
    {
      id: "ACCESSED",
      label: "Accessed by Kiosk Operator",
      desc: "Shopkeeper verified code & parameters",
      isDone: ["ACCESSED", "PRINTED", "DELETED"].includes(status),
      isCurrent: status === "ACCESSED",
    },
    {
      id: "PRINTED",
      label: "Printed & Destroyed",
      desc: "Hardware print finished, files incinerated",
      isDone: ["PRINTED", "DELETED"].includes(status),
      isCurrent: status === "PRINTED" || status === "DELETED",
    },
  ];

  return (
    <div className="zd-card-panel">
      <div className="flex items-center gap-2 pb-3 mb-4" style={{ borderBottom: "1px solid var(--line)" }}>
        <Clock size={16} style={{ color: "var(--text-secondary)" }} />
        <h4 className="text-xs font-bold uppercase tracking-wider font-mono" style={{ color: "var(--text-primary)", margin: 0 }}>
          Real-Time Spooling Pipeline
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
