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
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121622]/90 backdrop-blur-md p-5 sm:p-6 shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-colors">
      <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-200 dark:border-white/10">
        <Clock className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
          Real-Time Spooling Pipeline
        </h4>
      </div>

      <div className="space-y-4">
        {steps.map((step, idx) => {
          return (
            <div key={step.id} className="flex items-start gap-3.5">
              <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                {step.isDone && !step.isCurrent ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shadow-xs">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                ) : step.isCurrent ? (
                  <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-cyan-950/80 border border-blue-200 dark:border-cyan-500/40 text-blue-600 dark:text-cyan-400 flex items-center justify-center shadow-xs">
                    <motion.div
                      animate={
                        shouldReduceMotion
                          ? {}
                          : { scale: [1, 1.25, 1] }
                      }
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <CircleDot className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                    </motion.div>
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500 flex items-center justify-center text-[10px] font-bold font-mono">
                    {idx + 1}
                  </div>
                )}

                {/* Vertical connector line */}
                {idx < steps.length - 1 && (
                  <div
                    className={`absolute top-6 left-1/2 -translate-x-1/2 w-0.5 h-5 ${
                      step.isDone ? "bg-emerald-400 dark:bg-emerald-500/40" : "bg-slate-200 dark:bg-white/10"
                    }`}
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className={`text-xs font-semibold font-display ${
                    step.isCurrent
                      ? "text-blue-600 dark:text-cyan-400 font-bold"
                      : step.isDone
                      ? "text-slate-900 dark:text-white"
                      : "text-slate-400"
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans mt-0.5">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
