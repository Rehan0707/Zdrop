"use client";

import { UploadCloud, Hash, ScanLine, Trash2, ArrowRight, ShieldCheck, Check } from "lucide-react";
import HolographicCard from "@/components/ui/holographic-card";

export function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Drop & Configure",
      subtitle: "Zero signups. Two taps.",
      description:
        "Select your PDFs, DOCXs, or images on your phone or laptop. Choose copies, color mode, and double-sided preferences.",
      icon: UploadCloud,
      badge: "In 5 Seconds",
      preview: "DropZone & Presets",
    },
    {
      number: "02",
      title: "Get Your 6-Digit PIN",
      subtitle: "Instant ephemeral code",
      description:
        "A 6-digit code and QR are generated immediately. Your files are encrypted with an automated 15-minute server countdown.",
      icon: Hash,
      badge: "15-Min TTL",
      preview: "PIN: 842 · 913",
    },
    {
      number: "03",
      title: "Dictate or Scan",
      subtitle: "Across the shop counter",
      description:
        "Walk up to the operator. Say the 6 digits or hold up your QR code. The operator's kiosk spools your job without saving it to disk.",
      icon: ScanLine,
      badge: "Direct Spool",
      preview: "Kiosk Connected",
    },
    {
      number: "04",
      title: "Printed & Vanished",
      subtitle: "Permanent cryptographic purge",
      description:
        "Your crisp pages print. The exact millisecond the job finishes, your files are wiped from the server forever.",
      icon: Trash2,
      badge: "0.00 KB Left",
      preview: "Audit Verified",
    },
  ];

  return (
    <section className="relative py-20 sm:py-28 overflow-hidden border-t border-slate-200/80 dark:border-white/5 transition-colors" id="how-it-works">
      {/* Ambient gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-blue-500/5 via-cyan-500/5 to-transparent blur-3xl pointer-events-none -z-10 rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-cyan-950/60 border border-blue-200 dark:border-cyan-500/30 text-blue-700 dark:text-cyan-300 text-xs font-semibold shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
            <span>4-Step Zero-Commitment Workflow</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 dark:text-white tracking-tight leading-tight font-display">
            How It Works in Under{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 dark:from-cyan-400 dark:via-sky-300 dark:to-blue-400">
              30 Seconds Flat.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            No downloading mobile apps, no typing passwords, no saving stranger phone numbers. Just drop, recite, print, and walk away.
          </p>
        </div>

        {/* 4 Steps Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <HolographicCard
                key={step.number}
                intensity={14}
                className="relative rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gradient-to-b dark:from-[#141926]/90 dark:to-[#0E121B]/90 p-6 flex flex-col justify-between overflow-hidden shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] group hover:border-blue-400 dark:hover:border-cyan-500/30 transition-all duration-300"
              >
                {/* Step Top Bar */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-2xl font-black font-mono text-blue-600 dark:text-cyan-400/80 group-hover:text-blue-700 dark:group-hover:text-cyan-300 transition">
                      {step.number}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold border border-blue-200 dark:border-cyan-500/20 bg-blue-50 dark:bg-cyan-950/40 text-blue-700 dark:text-cyan-300">
                      {step.badge}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-white/5 border border-blue-200 dark:border-white/10 flex items-center justify-center text-blue-600 dark:text-cyan-400 mb-5 group-hover:scale-105 transition">
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Copy */}
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight font-display mb-1">
                    {step.title}
                  </h3>
                  <div className="text-xs font-mono text-blue-600 dark:text-cyan-400 mb-3">
                    {step.subtitle}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                    {step.description}
                  </p>
                </div>

                {/* Bottom preview pill */}
                <div className="pt-5 mt-5 border-t border-slate-200 dark:border-white/10">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-300 font-medium">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      {step.preview}
                    </span>
                    <span className="text-[10px] text-slate-500">Step {step.number}</span>
                  </div>
                </div>
              </HolographicCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
