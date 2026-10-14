"use client";

import {
  KeyRound,
  Trash2,
  SlidersHorizontal,
  FileCheck2,
  Monitor,
  Fingerprint,
  Sparkles,
  CheckCircle2,
  Layers,
  Printer,
  ShieldCheck,
  Flame,
} from "lucide-react";
import HolographicCard from "@/components/ui/holographic-card";


export function SolutionFeaturesSection() {
  const features = [
    {
      id: "pin",
      icon: KeyRound,
      badge: "Instant Authentication",
      feature: "6-Digit Ephemeral Access PIN",
      benefit:
        "Speak a 6-digit number across the counter or flash the generated QR code. Never share your WhatsApp, personal phone number, or email with strangers.",
      visual: (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-cyan-500/20 space-y-3">
          <div className="flex items-center justify-between text-[11px] font-mono text-blue-600 dark:text-cyan-400">
            <span>SESSION KEY</span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              READY FOR KIOSK
            </span>
          </div>
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 font-mono">
            {["8", "4", "2", "9", "1", "3"].map((digit, i) => (
              <span
                key={i}
                className="w-9 h-11 sm:w-10 sm:h-12 rounded-lg bg-white dark:bg-[#141926] border border-blue-200 dark:border-cyan-500/30 flex items-center justify-center text-lg sm:text-xl font-black text-blue-700 dark:text-cyan-300 shadow-xs dark:shadow-[0_0_12px_rgba(6,182,212,0.2)]"
              >
                {digit}
              </span>
            ))}
          </div>
          <div className="text-[10px] text-center text-slate-500 dark:text-slate-400 font-mono">
            Direct spooling authorized. No credentials saved.
          </div>
        </div>
      ),
    },
    {
      id: "purge",
      icon: Flame,
      badge: "Zero Footprint",
      feature: "Dual-Trigger Cryptographic Wipe",
      benefit:
        "Your files are permanently incinerated the second the operator hits print, backed by an autonomous 15-minute server TTL countdown that leaves zero trace.",
      visual: (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-emerald-500/20 space-y-3">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-500 dark:text-slate-400">RETENTION STATUS</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">100% DESTROYED</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-mono text-slate-700 dark:text-slate-300">
              <span>Disk Footprint</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">0.00 KB</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div className="w-0 h-full bg-emerald-500 transition-all duration-500" />
            </div>
          </div>
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-between text-[10px] font-mono text-emerald-800 dark:text-emerald-300">
            <span>TRIGGER: OPERATOR_PRINT</span>
            <span className="text-slate-500 dark:text-slate-400">HASH: SHA256-PURGED</span>
          </div>
        </div>
      ),
    },
    {
      id: "preferences",
      icon: SlidersHorizontal,
      badge: "Zero Misprints",
      feature: "Granular Pre-Set Preferences",
      benefit:
        "Choose copies, B&W or Color, duplexing, and exact page ranges on your phone screen before you arrive. The printer prints exactly what you locked in.",
      visual: (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-sky-500/20 space-y-2.5">
          <div className="text-[11px] font-mono text-blue-600 dark:text-sky-400">LOCKED PARAMETERS</div>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2 rounded-lg bg-white dark:bg-[#141926] border border-slate-200 dark:border-white/5">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px]">COLOR MODE</span>
              <span className="text-slate-900 dark:text-white font-bold">Grayscale (B&W)</span>
            </div>
            <div className="p-2 rounded-lg bg-white dark:bg-[#141926] border border-slate-200 dark:border-white/5">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px]">DUPLEXING</span>
              <span className="text-blue-600 dark:text-cyan-300 font-bold">Double-Sided</span>
            </div>
            <div className="p-2 rounded-lg bg-white dark:bg-[#141926] border border-slate-200 dark:border-white/5">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px]">COPIES</span>
              <span className="text-slate-900 dark:text-white font-bold">2 Copies</span>
            </div>
            <div className="p-2 rounded-lg bg-white dark:bg-[#141926] border border-slate-200 dark:border-white/5">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px]">PAGE RANGE</span>
              <span className="text-emerald-600 dark:text-emerald-300 font-bold">Pages 1-14</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "engine",
      icon: FileCheck2,
      badge: "High Fidelity",
      feature: "Multi-Format Direct Spooling",
      benefit:
        "Full native support for PDF, DOCX, JPG, and PNG files up to 25MB. Files are decoded in full resolution directly for industrial commercial printer drivers.",
      visual: (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-cyan-500/20 space-y-3">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-blue-600 dark:text-cyan-400">FORMAT ENGINE</span>
            <span className="text-slate-500 dark:text-slate-400">UP TO 25MB</span>
          </div>
          <div className="flex items-center gap-2">
            {["PDF", "DOCX", "JPG", "PNG"].map((ext) => (
              <span
                key={ext}
                className="flex-1 py-1.5 text-center text-xs font-mono font-bold rounded-lg bg-blue-50 dark:bg-cyan-950/40 border border-blue-200 dark:border-cyan-500/30 text-blue-700 dark:text-cyan-200"
              >
                .{ext}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 pt-1">
            <span>Buffer: Direct Stream</span>
            <span className="text-emerald-600 dark:text-emerald-400">Lossless Vector</span>
          </div>
        </div>
      ),
    },
    {
      id: "kiosk",
      icon: Monitor,
      badge: "Operator Terminal",
      feature: "Zero-Download Desktop Kiosk",
      benefit:
        "Shopkeepers open the lightweight /kiosk screen. Documents stream directly into the print dialog without saving files to the computer's hard drive.",
      visual: (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-blue-500/20 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-blue-600 dark:text-blue-400">
            <span className="flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              KIOSK CONSOLE
            </span>
            <span className="text-slate-400 dark:text-slate-500">v2.4 PORTAL</span>
          </div>
          <div className="p-2.5 rounded-lg bg-white dark:bg-[#141926] border border-slate-200 dark:border-white/10 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-900 dark:text-white font-bold font-display">Thesis_Final_Draft.pdf</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">Verified</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex-1 py-1 rounded bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-cyan-500 dark:to-blue-600 text-white font-bold text-[10px] font-display"
              >
                Print & Purge
              </button>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">No disk writes</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "anonymous",
      icon: Fingerprint,
      badge: "Pure Privacy",
      feature: "100% Anonymous Zero-Log Fabric",
      benefit:
        "No login required, no email collection, no tracking cookies, and no telemetry tied to your documents. Privacy by mathematical design, not a marketing promise.",
      visual: (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-emerald-500/20 space-y-3">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-emerald-600 dark:text-emerald-400">PRIVACY AUDIT</span>
            <span className="text-slate-500 dark:text-slate-400">ZERO IDENTIFIERS</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono">
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20 text-slate-700 dark:text-slate-300">
              User: <span className="text-emerald-600 dark:text-emerald-400 font-bold block">None</span>
            </div>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20 text-slate-700 dark:text-slate-300">
              Email: <span className="text-emerald-600 dark:text-emerald-400 font-bold block">None</span>
            </div>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20 text-slate-700 dark:text-slate-300">
              IP Logs: <span className="text-emerald-600 dark:text-emerald-400 font-bold block">None</span>
            </div>
          </div>
          <div className="text-[10px] text-center text-slate-500 dark:text-slate-400 font-mono flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Zero analytics trackers loaded</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section className="relative py-20 sm:py-28 overflow-hidden border-t border-slate-200/80 dark:border-white/5 transition-colors" id="features">
      {/* Background ambient light */}
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[300px] bg-blue-500/5 dark:bg-cyan-500/5 blur-3xl pointer-events-none -z-10 rounded-full" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-indigo-500/5 dark:bg-blue-500/5 blur-3xl pointer-events-none -z-10 rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header (Formula: Better alternative introduction) */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-cyan-950/60 border border-blue-200 dark:border-cyan-500/30 text-blue-700 dark:text-cyan-300 text-xs font-semibold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
            <span>Engineered for Absolute Speed and Privacy</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 dark:text-white tracking-tight leading-tight font-display">
            The Modern Print Pipeline Designed for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 dark:from-cyan-400 dark:via-sky-300 dark:to-blue-400">
              Zero Friction and Zero Traces.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            Every feature in ZDrop replaces a messy manual step with a streamlined, encrypted protocol.
          </p>
        </div>

        {/* 6 Features Grid (Formula: [Feature] + [Benefit] + [Supporting Visual]) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <HolographicCard
                key={feat.id}
                intensity={12}
                className="group relative rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gradient-to-b dark:from-[#141926]/90 dark:to-[#0D1018]/90 p-6 sm:p-7 flex flex-col justify-between overflow-hidden shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:border-blue-400 dark:hover:border-cyan-500/30 transition-all duration-300"
              >
                {/* Glow hover accent */}
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 dark:from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none" />

                <div className="relative z-10 space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-cyan-500/10 border border-blue-200 dark:border-cyan-500/20 flex items-center justify-center text-blue-600 dark:text-cyan-400 shadow-inner group-hover:scale-105 transition">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300">
                      {feat.badge}
                    </span>
                  </div>

                  <div>
                    {/* [Feature] */}
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight font-display mb-2 group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition">
                      {feat.feature}
                    </h3>
                    {/* [Benefit] */}
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                      {feat.benefit}
                    </p>
                  </div>
                </div>

                {/* [Supporting Visual] */}
                <div className="relative z-10 pt-5 mt-5 border-t border-slate-200 dark:border-white/10">
                  {feat.visual}
                </div>
              </HolographicCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
