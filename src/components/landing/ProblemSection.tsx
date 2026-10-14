"use client";

import { MessageSquareOff, Usb, AlertTriangle, FileWarning, Skull, ShieldAlert } from "lucide-react";
import HolographicCard from "@/components/ui/holographic-card";

export function ProblemSection() {
  const problems = [
    {
      icon: MessageSquareOff,
      tag: "Privacy Leak",
      tagColor: "border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300",
      title: "The WhatsApp Download Trap",
      description:
        "You save a stranger's phone number to your contacts, message your ID card, tax returns, or admit card, and hope for the best.",
      impact:
        "Your unencrypted PDFs sit in the shop PC's 'Downloads' folder indefinitely. They remain accessible to every stranger who touches the machine next.",
      visualBadge: "4,820 files lingering in C:\\Downloads",
      accent: "from-rose-500/10 dark:from-rose-500/15 via-rose-500/5 to-transparent",
    },
    {
      icon: Usb,
      tag: "Malware Vector",
      tagColor: "border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300",
      title: "The Infected USB Roulette",
      description:
        "You plug your personal flash drive into a cyber cafe PC that hasn't seen an antivirus definition update since 2019.",
      impact:
        "Silent autorun worms and VBS shortcut trojans infect your drive in seconds, corrupting your thesis and spreading to your home laptop.",
      visualBadge: "Autorun.inf Trojan detected",
      accent: "from-amber-500/10 dark:from-amber-500/15 via-amber-500/5 to-transparent",
    },
    {
      icon: AlertTriangle,
      tag: "Wasted Money & Time",
      tagColor: "border-orange-200 dark:border-orange-500/30 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300",
      title: "The Verbal Dictation Misprint",
      description:
        "You shout 'Pages 4 to 18, double-sided, grayscale!' over roaring laser printers and crowded student queues.",
      impact:
        "The rushed operator prints all 75 pages single-sided in full color. You lose $15, waste 20 minutes arguing, and miss your class submission.",
      visualBadge: "75 pages printed in color by mistake",
      accent: "from-orange-500/10 dark:from-orange-500/15 via-orange-500/5 to-transparent",
    },
  ];

  const costStats = [
    {
      value: "47+",
      label: "Unpurged Sensitive Files",
      detail: "Passports, gradesheets, and medical bills left exposed per shop PC weekly.",
    },
    {
      value: "14 Min",
      label: "Average Counter Queue Wait",
      detail: "Lost searching contacts, scanning shop QR codes, and repeating print specs.",
    },
    {
      value: "3.4x",
      label: "Higher Flash Drive Infection Rate",
      detail: "Odds of catching shortcut malware on unmanaged public Windows kiosks.",
    },
    {
      value: "0%",
      label: "Proof of File Deletion",
      detail: "Operators say 'I will delete it later,' but recycle bins remain untouched for months.",
    },
  ];

  return (
    <section className="relative py-20 sm:py-28 overflow-hidden border-t border-slate-200/80 dark:border-white/5 transition-colors" id="problem">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-rose-500/5 blur-3xl pointer-events-none -z-10 rounded-full" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-500/5 blur-3xl pointer-events-none -z-10 rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold shadow-2xs">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>The Reality of Counter Printing</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 dark:text-white tracking-tight leading-tight font-display">
            Your Private Documents Are Sitting in a Stranger’s{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-orange-600 to-amber-600 dark:from-rose-400 dark:via-orange-400 dark:to-amber-300">
              Downloads Folder Right Now.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            Every time you print at a college stall, print shop, or library, you are forced into three dangerous compromises. None of them protect your identity.
          </p>
        </div>

        {/* 3 Problem Cards Grid (Formula: [Show what they are dealing with]) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-16">
          {problems.map((problem, idx) => {
            const Icon = problem.icon;
            return (
              <HolographicCard
                key={idx}
                className="relative rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gradient-to-b dark:from-[#141926]/90 dark:to-[#0C0F17]/90 p-7 flex flex-col justify-between overflow-hidden shadow-md dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] group hover:border-slate-300 dark:hover:border-white/20 transition-all duration-300"
              >
                {/* Glow accent */}
                <div
                  className={`absolute inset-0 bg-gradient-to-b ${problem.accent} opacity-40 group-hover:opacity-70 transition duration-500 pointer-events-none`}
                />

                <div className="relative z-10 space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-white/5 border border-rose-200 dark:border-white/10 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-inner">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold border ${problem.tagColor}`}>
                      {problem.tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight font-display mb-2">
                      {problem.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                      {problem.description}
                    </p>
                  </div>
                </div>

                <div className="relative z-10 pt-6 mt-6 border-t border-slate-200 dark:border-white/10 space-y-3">
                  <div className="text-xs text-rose-800 dark:text-rose-300/90 font-medium leading-relaxed bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/20 p-3 rounded-xl flex items-start gap-2">
                    <FileWarning className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <span>{problem.impact}</span>
                  </div>

                  <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-black/40 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/5 flex items-center gap-1.5">
                    <Skull className="w-3 h-3 text-rose-500 dark:text-rose-400/80" />
                    <span className="truncate">{problem.visualBadge}</span>
                  </div>
                </div>
              </HolographicCard>
            );
          })}
        </div>

        {/* Real Cost Banner (Formula: [Make them feel the real cost of the problem]) */}
        <div className="relative rounded-3xl border border-rose-200 dark:border-rose-500/20 bg-gradient-to-r from-rose-50/80 via-white dark:via-[#121622]/90 to-amber-50/80 dark:from-rose-950/20 dark:to-amber-950/20 p-8 sm:p-10 backdrop-blur-xl shadow-lg dark:shadow-2xl transition-colors">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-md space-y-2 text-center lg:text-left">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                The Real Collateral Damage
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white font-display">
                The Cost Isn’t Just Inconvenience. It’s Compromised Identity.
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-sans">
                Every print cycle with legacy tools leaves unmonitored digital breadcrumbs behind.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 w-full lg:w-auto">
              {costStats.map((stat, idx) => (
                <HolographicCard
                  key={idx}
                  intensity={18}
                  className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-center space-y-1 shadow-2xs dark:shadow-none"
                >
                  <div className="text-2xl sm:text-3xl font-black font-display tracking-tight bg-gradient-to-r from-rose-600 to-amber-600 dark:from-rose-400 dark:to-amber-300 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 font-display">
                    {stat.label}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">
                    {stat.detail}
                  </div>
                </HolographicCard>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

