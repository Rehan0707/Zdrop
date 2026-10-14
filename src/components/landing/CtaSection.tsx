"use client";

import Link from "next/link";
import { ArrowUp, Monitor, ShieldCheck, Zap } from "lucide-react";
import HolographicCard from "@/components/ui/holographic-card";

export function CtaSection() {
  const scrollToUpload = () => {
    const el = document.getElementById("upload");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative py-20 sm:py-28 overflow-hidden border-t border-slate-200/80 dark:border-white/5 transition-colors">
      {/* Background glow blooms */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-50/40 dark:via-cyan-950/20 to-slate-100/50 dark:to-black/60 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-blue-500/10 via-sky-500/10 to-indigo-500/10 dark:from-cyan-500/10 dark:via-sky-500/10 dark:to-blue-500/10 blur-3xl pointer-events-none -z-10 rounded-full" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <HolographicCard
          intensity={30}
          className="relative rounded-3xl border border-blue-200 dark:border-cyan-500/20 bg-gradient-to-b from-blue-50/70 via-white to-sky-50/70 dark:from-[#131927] dark:via-[#0e1320] dark:to-[#080b12] p-8 sm:p-14 text-center overflow-hidden shadow-xl dark:shadow-[0_16px_64px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-colors"
        >
          {/* Top highlight pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100/80 dark:bg-cyan-950/80 border border-blue-200 dark:border-cyan-500/40 text-blue-800 dark:text-cyan-300 text-xs font-semibold mb-6 shadow-2xs">
            <Zap className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
            <span>Instant Zero-Trace Printing</span>
          </div>

          {/* Formula: [Benefit-driven headline] */}
          <h2 className="text-3xl sm:text-5xl font-black text-slate-950 dark:text-white tracking-tight leading-tight max-w-2xl mx-auto font-display mb-4">
            Print Your First Document in Seconds:{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 dark:from-cyan-400 dark:via-sky-300 dark:to-blue-400">
              Without Leaving Any Digital Trace.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto mb-8 font-sans leading-relaxed">
            No signup. No downloads. No WhatsApp number sharing. Just drop your files, hand a 6-digit PIN across the desk, and walk away clean.
          </p>

          {/* Formula: [The CTA] (Dual Action Buttons) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <button
              type="button"
              onClick={scrollToUpload}
              className="w-full sm:w-auto px-8 h-13 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 dark:from-cyan-500 dark:via-sky-500 dark:to-blue-600 dark:hover:from-cyan-400 dark:hover:to-blue-500 text-white font-bold text-sm font-display flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] cursor-pointer shadow-md dark:shadow-[0_0_24px_rgba(6,182,212,0.4)]"
            >
              <span>Drop & Print Now</span>
              <ArrowUp className="w-4 h-4" />
            </button>

            <Link
              href="/kiosk"
              className="w-full sm:w-auto px-6 h-13 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#121622] dark:hover:bg-[#1a2030] text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white border border-slate-200 hover:border-blue-300 dark:border-white/10 dark:hover:border-cyan-500/30 font-semibold text-sm font-display flex items-center justify-center gap-2 transition active:scale-[0.98] shadow-xs dark:shadow-none"
            >
              <Monitor className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              <span>Open Counter Kiosk</span>
            </Link>
          </div>

          {/* Guarantee Badges Strip */}
          <div className="pt-8 mt-8 border-t border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              100% Free & Open Source
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
              Zero Accounts or Passwords
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              15-Minute Instant Shred
            </span>
          </div>
        </HolographicCard>
      </div>
    </section>
  );
}
