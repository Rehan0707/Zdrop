"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ShieldCheck, RefreshCw, Store, CheckCircle2 } from "lucide-react";
import { SessionData, FileMetadata, PrintPreferences, PrintPreferencesSchema, ShopProfile } from "@/lib/types";
import {
  createSession,
  restoreSession,
  deleteSession,
  subscribeToSession,
} from "@/lib/session-client";
import ResponsiveHeroBanner from "@/components/ui/responsive-hero-banner";
import GradientBlobCard from "@/components/ui/gradient-bold-card";
import { DropZone } from "@/components/DropZone";
import { PrintPreferencesCard } from "@/components/PrintPreferencesCard";
import { WhyZDropSummary } from "@/components/landing/WhyZDropSummary";
import { HowItWorksSummary } from "@/components/landing/HowItWorksSummary";
import { QuickFaqAndKiosk } from "@/components/landing/QuickFaqAndKiosk";
import { Footer } from "@/components/landing/Footer";
import { CodeView } from "@/views/CodeView";
import { SuccessView } from "@/views/SuccessView";
import { ZDropLogo } from "@/components/ZDropLogo";
import { useAuth } from "@/lib/auth-context";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import Link from "next/link";

type StudentStep = "UPLOAD" | "CODE" | "SUCCESS";

export default function StudentPage() {
  const { user } = useAuth();
  const [step, setStep] = useState<StudentStep>("UPLOAD");
  const [session, setSession] = useState<SessionData | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states for the Interactive Print Terminal
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [preferences, setPreferences] = useState<PrintPreferences>({
    copies: 1,
    colorMode: "BW",
    sides: "DOUBLE",
    pageRange: "ALL",
  });
  const [shops, setShops] = useState<ShopProfile[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>("");

  useEffect(() => {
    fetch("/api/shops")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.shops)) setShops(data.shops);
      })
      .catch(() => {});
  }, []);

  const validation = PrintPreferencesSchema.safeParse(preferences);
  const canSubmit = files.length > 0 && validation.success;

  useEffect(() => {
    restoreSession()
      .then((s) => {
        if (s) {
          setSession(s);
          setStep(["DELETED", "EXPIRED"].includes(s.status) ? "SUCCESS" : "CODE");
        }
      })
      .catch(() => {});
  }, []);

  // Subscribe to real-time session changes (e.g. operator accesses or deletes file)
  useEffect(() => {
    if (!session?.id) return;

    const unsubscribe = subscribeToSession(
      session.id,
      (updated) => {
        if (!updated) return;
        setError(null);
        setSession(updated);

        if (updated.status === "DELETED" || updated.status === "EXPIRED") {
          setStep("SUCCESS");
        }
      },
      setError
    );

    return () => unsubscribe();
  }, [session?.id]);

  const handleGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isGenerating) return;

    setIsGenerating(true);
    setUploadProgress(0);
    setError(null);
    try {
      const chosenShop = shops.find((s) => s.id === selectedShopId);
      const s = await createSession(
        files,
        preferences,
        setUploadProgress,
        chosenShop ? { id: chosenShop.id, name: chosenShop.shopName } : undefined
      );
      setSession(s);
      setStep("CODE");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevokeSession = async () => {
    if (!session) return;
    setIsRevoking(true);
    setError(null);
    try {
      setSession(await deleteSession(session.id));
      setStep("SUCCESS");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsRevoking(false);
    }
  };

  const handleReset = () => {
    sessionStorage.removeItem("zdrop-session");
    setSession(null);
    setError(null);
    setFiles([]);
    setStep("UPLOAD");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-zinc-950 transition-colors">
      <div className="flex-1 flex flex-col">
        {error && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[110] max-w-md w-full px-4 animate-fade-slide-in-1">
            <p
              role="alert"
              className="p-3 text-xs bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 rounded-xl shadow-lg font-sans"
            >
              {error}
            </p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === "UPLOAD" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1"
            >
              {/* 1. Responsive Hero Banner Layout & Background as Homepage Hero */}
              <ResponsiveHeroBanner
                badgeLabel="Zero-Trace"
                badgeText="Instant Campus Counter Printing"
                title="Drop it. Print it. Done."
                titleLine2="Zero WhatsApp. Zero USBs."
                description="Print campus documents in 10 seconds flat. Sign in with Google, drop files on your phone, configure copies and sides in two taps, and hand a 6-digit PIN across the desk. No WhatsApp downloads, no flash drives, zero file leaks."
                primaryButtonText="Drop Files Below"
                primaryButtonHref="#upload"
                secondaryButtonText="Print Shop"
                secondaryButtonHref="/kiosk"
                ctaButtonText="Print Shop"
                ctaButtonHref="/kiosk"
                partnersTitle="Trusted across university xerox counters & campus copy centers"
              >
                {/* Interactive Print Terminal Card with Gradient Blob Effect */}
                <GradientBlobCard className="rounded-2xl sm:rounded-3xl border border-emerald-500/30">
                  <div className="p-4 min-[375px]:p-5 sm:p-7">
                    <div className="flex items-center justify-between pb-3 sm:pb-4 mb-4 border-b border-zinc-200 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-heading">
                          Interactive Print Terminal
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-white/5 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-white/10">
                        Max 3 Files · 25MB
                      </span>
                    </div>

                    {!user ? (
                      /* Mandatory Google Auth Gate */
                      <div className="zd-auth-gate-card">
                        <div className="zd-auth-gate-badge">
                          <ShieldCheck size={18} />
                          <span>Protected Campus Print Terminal</span>
                        </div>
                        <h3>Sign in with Google to send files</h3>
                        <p>
                          Sign in securely to upload your documents, configure print settings, and get your 6-digit counter OTP.
                        </p>

                        <div className="zd-auth-gate-action">
                          <GoogleSignInButton label="Continue with Google" />
                        </div>

                        <div className="zd-auth-gate-perks">
                          <div>
                            <strong>🔒 Zero WhatsApp exposure</strong>
                            <span>Your personal contact stays private</span>
                          </div>
                          <div>
                            <strong>⚡ Instant 6-digit OTP</strong>
                            <span>Operator opens your job in 2 seconds</span>
                          </div>
                          <div>
                            <strong>⏱️ Auto-purged in 15 mins</strong>
                            <span>Hard delete upon print or expiration</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Authenticated Print Upload Form */
                      <form onSubmit={handleGenerateCode} className="space-y-4">
                        {/* User Verified Badge */}
                        <div className="zd-user-auth-badge">
                          <div className="zd-user-badge-left">
                            {user.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={user.avatarUrl} alt="" className="zd-badge-avatar" />
                            ) : (
                              <span className="zd-badge-initials">
                                {(user.name?.[0] || user.email[0]).toUpperCase()}
                              </span>
                            )}
                            <div className="zd-badge-text">
                              <strong>{user.name || user.email}</strong>
                              <small>{user.email}</small>
                            </div>
                          </div>
                          <span className="zd-badge-pill">Verified</span>
                        </div>

                        {/* Optional Destination Print Shop */}
                        {shops.length > 0 && (
                          <div className="space-y-1.5">
                            <label htmlFor="shop-select" className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                              <Store size={14} className="text-emerald-500" />
                              <span>Destination Print Shop</span>
                            </label>
                            <select
                              id="shop-select"
                              value={selectedShopId}
                              onChange={(e) => setSelectedShopId(e.target.value)}
                              className="w-full h-11 px-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 font-sans outline-none focus:border-emerald-500"
                            >
                              <option value="">Any ZDrop Kiosk Counter (Default)</option>
                              {shops.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.shopName} ({s.campusAddress})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Step 1: Select Files */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider font-mono">
                              Step 1: Select Files
                            </label>
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">PDF, DOCX, JPG, PNG</span>
                          </div>
                          <DropZone files={files} onFilesChange={setFiles} disabled={isGenerating} />
                        </div>

                        {/* Step 2: Print Settings */}
                        {files.length > 0 && (
                          <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider font-mono block">
                              Step 2: Print Settings
                            </label>
                            <PrintPreferencesCard
                              preferences={preferences}
                              onChange={setPreferences}
                              disabled={isGenerating}
                            />
                          </div>
                        )}

                        {!validation.success && (
                          <p role="alert" className="text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 p-2.5 rounded-xl font-sans">
                            {validation.error.issues[0].message}
                          </p>
                        )}

                        {/* Submit Button */}
                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={!canSubmit || isGenerating}
                            className="w-full h-12 min-[375px]:h-13 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:to-green-400 text-zinc-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 active:scale-[0.98] cursor-pointer shadow-[0_0_24px_rgba(34,197,94,0.35)] text-sm font-heading touch-manipulation"
                          >
                            {isGenerating ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
                                <span>Encrypting & Uploading… {uploadProgress}%</span>
                              </>
                            ) : (
                              <>
                                <span>Generate 6-Digit Access Code</span>
                                <ArrowRight className="w-4 h-4 text-zinc-950" />
                              </>
                            )}
                          </button>

                          <p className="mt-3 text-[11px] text-zinc-500 dark:text-zinc-400 text-center flex items-center justify-center gap-1.5 font-sans">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 inline" />
                            <span>Dual-Purge: Permanently deleted upon print or after 15 mins</span>
                          </p>
                        </div>
                      </form>
                    )}
                  </div>
                </GradientBlobCard>
              </ResponsiveHeroBanner>

              {/* 2. Structured Summary: Why ZDrop (3 Core Pillars) */}
              <WhyZDropSummary />

              {/* 3. Structured Summary: 3-Step Process */}
              <HowItWorksSummary />

              {/* 4. Structured Summary: FAQ & Operator Kiosk Banner */}
              <QuickFaqAndKiosk />
            </motion.div>
          )}

          {step === "CODE" && session && (
            <motion.div
              key="code"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex-1 py-12 px-4"
            >
              {/* Header for Code View */}
              <header className="max-w-md mx-auto mb-6 flex items-center justify-between">
                <Link href="/" onClick={handleReset}>
                  <ZDropLogo size="sm" showText={true} />
                </Link>
                <button
                  type="button"
                  onClick={() => setStep("UPLOAD")}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Back to Terminal
                </button>
              </header>

              <CodeView
                session={session}
                onRevokeSession={handleRevokeSession}
                onBackToUpload={() => setStep("UPLOAD")}
                isRevoking={isRevoking}
              />
            </motion.div>
          )}

          {step === "SUCCESS" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex-1 py-12 px-4"
            >
              <header className="max-w-md mx-auto mb-6 text-center">
                <ZDropLogo size="sm" showText={true} className="mx-auto" />
              </header>

              <SuccessView session={session} onReset={handleReset} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Component */}
        <Footer />
      </div>
    </div>
  );
}
