"use client";

import Link from "next/link";
import { ZDropLogo } from "@/components/ZDropLogo";
import { ShieldCheck, Github, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#080A0F] text-slate-600 dark:text-slate-400 text-xs font-sans transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <ZDropLogo size="md" showText={true} />
            </Link>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              The zero-trace, counter-side document printing protocol. Drop your files, hand a 6-digit PIN across the desk, and your documents vanish forever upon printing.
            </p>
            <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-950/20 flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 text-xs max-w-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Zero retention guaranteed: 15-minute TTL server shredder.</span>
            </div>
          </div>

          {/* Column: Application */}
          <div className="space-y-3">
            <h4 className="text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider font-mono">
              Terminal
            </h4>
            <ul className="space-y-2 font-medium">
              <li>
                <a href="#upload" className="hover:text-blue-600 dark:hover:text-cyan-400 transition">
                  Drop & Upload Files
                </a>
              </li>
              <li>
                <Link href="/kiosk" className="hover:text-blue-600 dark:hover:text-cyan-400 transition">
                  Shop Counter Kiosk
                </Link>
              </li>
              <li>
                <a href="#features" className="hover:text-blue-600 dark:hover:text-cyan-400 transition">
                  6-Digit PIN Protocol
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-blue-600 dark:hover:text-cyan-400 transition">
                  How It Works
                </a>
              </li>
            </ul>
          </div>

          {/* Column: Security & Technology */}
          <div className="space-y-3">
            <h4 className="text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider font-mono">
              Privacy Specs
            </h4>
            <ul className="space-y-2 font-medium">
              <li>
                <a href="#problem" className="hover:text-blue-600 dark:hover:text-cyan-400 transition">
                  WhatsApp Trap Audit
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-blue-600 dark:hover:text-cyan-400 transition">
                  Dual-Trigger Purge
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-blue-600 dark:hover:text-cyan-400 transition">
                  Zero-Log Guarantee
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-blue-600 dark:hover:text-cyan-400 transition">
                  Security Architecture
                </a>
              </li>
            </ul>
          </div>

          {/* Column: Community & Code */}
          <div className="space-y-3">
            <h4 className="text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider font-mono">
              Open Source
            </h4>
            <ul className="space-y-2 font-medium">
              <li>
                <a
                  href="https://github.com/SohamB-ai/Zdrop"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 dark:hover:text-cyan-400 transition inline-flex items-center gap-1.5"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>GitHub Repository</span>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/SohamB-ai/Zdrop/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 dark:hover:text-cyan-400 transition inline-flex items-center gap-1"
                >
                  <span>Report an Issue</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <span className="text-slate-400 dark:text-slate-500">MIT Open Source License</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          <div>
            © {new Date().getFullYear()} ZDrop. Zero-Trace Print Protocol.
          </div>
          <div className="flex items-center gap-2">
            <span>Built with precision for student privacy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
