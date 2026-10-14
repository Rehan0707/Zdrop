"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, ShieldCheck } from "lucide-react";
import HolographicCard from "@/components/ui/holographic-card";


export function FaqSection() {
  const faqs = [
    {
      question: "What happens if there is a paper jam or printing error?",
      answer:
        "Your session code remains valid for the full 15-minute window until the operator explicitly completes the job. If the printer jams or runs out of toner, the operator simply re-spools from the active browser buffer without you needing to re-upload your files or generate a new code.",
    },
    {
      question: "How do I know my sensitive files are actually deleted?",
      answer:
        "ZDrop operates on a dual-trigger cryptographic wipe architecture. The moment the operator completes the print, the backend permanently deletes all associated file blobs and invalidates the session keys. If a job is left untouched, an autonomous 15-minute server TTL garbage collector purges the session. You also receive an on-screen Zero-Retention Audit Certificate.",
    },
    {
      question: "Do I or the shopkeeper need to download an app or sign up?",
      answer:
        "Never. ZDrop requires zero downloads, zero account creation, and zero phone numbers. Customers use the mobile browser on their phone, and shopkeepers simply open zdrop.app/kiosk on their counter PC.",
    },
    {
      question: "Can the operator download my file to keep a local copy?",
      answer:
        "The operator's kiosk portal streams your document directly into the system's native hardware print dialog (window.print()). The kiosk interface has no 'Save to Disk' or 'Download to Downloads' button, eliminating accidental or unauthorized file hoarding.",
    },
    {
      question: "What file formats and size limits are supported?",
      answer:
        "ZDrop natively supports PDF documents, Microsoft Word (.docx) files, and high-resolution images (.jpg, .png). You can upload up to 3 files per session, with a generous combined limit of 25MB, plenty for multi-chapter theses, project reports, and graphic design posters.",
    },
    {
      question: "Is ZDrop really free?",
      answer:
        "Yes, 100% free for both students and print shop operators. There are no paywalls, subscriptions, tracking cookies, or ads. It is built as public privacy infrastructure for campus communities.",
    },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="relative py-20 sm:py-28 overflow-hidden border-t border-slate-200/80 dark:border-white/5 transition-colors" id="faq">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-cyan-950/60 border border-blue-200 dark:border-cyan-500/30 text-blue-700 dark:text-cyan-300 text-xs font-semibold shadow-2xs">
            <HelpCircle className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
            <span>Got Questions?</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 dark:text-white tracking-tight leading-tight font-display">
            Frequently Asked{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 dark:from-cyan-400 dark:via-sky-300 dark:to-blue-400">
              Questions.
            </span>
          </h2>

          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            Everything you need to know about security, print workflows, and data retention.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <HolographicCard
                key={idx}
                intensity={22}
                className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121622]/80 shadow-xs dark:shadow-none backdrop-blur-md overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-display">
                    {faq.question}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen
                        ? "rotate-180 bg-blue-50 dark:bg-cyan-500/10 border-blue-300 dark:border-cyan-500/30 text-blue-600 dark:text-cyan-400"
                        : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans border-t border-slate-100 dark:border-white/5">
                    {faq.answer}
                  </div>
                )}
              </HolographicCard>
            );
          })}
        </div>

        {/* Support Help Strip */}
        <HolographicCard
          intensity={25}
          className="mt-12 p-5 rounded-2xl border border-blue-200 dark:border-cyan-500/20 bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/80 dark:from-cyan-950/20 dark:via-[#141926] dark:to-blue-950/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-xs dark:shadow-none transition-colors"
        >
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white font-display">Want to inspect how we delete files?</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Read our open source zero-retention implementation and test suites.</p>
            </div>
          </div>
          <a
            href="https://github.com/SohamB-ai/Zdrop"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-white dark:bg-white/10 hover:bg-slate-50 dark:hover:bg-white/15 text-slate-800 dark:text-white text-xs font-bold font-mono transition border border-slate-200 dark:border-white/10 shadow-2xs"
          >
            GitHub Repository →
          </a>
        </HolographicCard>
      </div>
    </section>
  );
}
