"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Store, QrCode } from "lucide-react";
import { SessionData } from "@/lib/types";
import {
  resolveByAccessCode,
  deleteSession,
  subscribeToSession,
} from "@/lib/session-client";
import { Navbar } from "@/components/Navbar";
import { KioskEntryView } from "@/views/KioskEntryView";
import { KioskJobConsole } from "@/components/KioskJobConsole";
import { Footer } from "@/components/landing/Footer";
import { useAuth } from "@/lib/auth-context";
import { ShopQrModal } from "@/components/ShopQrModal";

function KioskContent() {
  const { shop } = useAuth();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  // Auto-resolve code from URL query parameter (from QR code scan)
  useEffect(() => {
    const codeParam = searchParams.get("code");
    if (codeParam && codeParam.length === 6) {
      handleCodeSubmit(codeParam);
    }
  }, [searchParams]);

  // Subscribe to live session updates while looking at job
  useEffect(() => {
    if (!session?.id) return;
    const unsubscribe = subscribeToSession(session.id, (updated) => {
      if (!updated || updated.status === "DELETED" || updated.status === "EXPIRED") {
        setSession(null);
      } else {
        setSession(updated);
      }
    });
    return () => unsubscribe();
  }, [session?.id]);

  const handleCodeSubmit = async (code: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      setSession(await resolveByAccessCode(code));
    } catch (e) {
      setErrorMessage((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteAndPurge = async () => {
    if (!session) return;
    setIsPurging(true);
    setErrorMessage(null);
    try {
      await deleteSession(session.id);
      setSession(null);
      setSuccessToast("Job completed. Uploaded files purged permanently.");
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (e) {
      setErrorMessage((e as Error).message);
    } finally {
      setIsPurging(false);
    }
  };

  const handleCancel = () => {
    setSession(null);
    setErrorMessage(null);
  };

  return (
    <div className="zd-app">
      <Navbar currentRole="kiosk" />

      <main id="main-content" className="flex-1 max-w-5xl w-full mx-auto px-4 pt-10 pb-12 sm:pt-14">
        {errorMessage && session && (
          <p role="alert" className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs text-center">
            {errorMessage}
          </p>
        )}

        {/* Shop Owner Status Banner */}
        {shop && (
          <div className="mb-6 p-4 rounded-2xl bg-white/80 dark:bg-[#121622]/80 border border-slate-200 dark:border-white/10 shadow-sm backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-cyan-950/60 border border-blue-200 dark:border-cyan-500/30 text-blue-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white font-display">{shop.shopName}</h2>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-cyan-950/60 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-cyan-500/30">
                    CODE: {shop.shopCode}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{shop.campusAddress}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="h-9 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition active:scale-95 cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Counter QR Standee</span>
            </button>
          </div>
        )}

        {/* Success Toast */}
        {successToast && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold text-center max-w-md mx-auto shadow-sm dark:shadow-lg backdrop-blur-md">
            {successToast}
          </div>
        )}

        <AnimatePresence mode="wait">
          {!session ? (
            <motion.div
              key="entry"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <KioskEntryView
                onSubmitCode={handleCodeSubmit}
                isLoading={isLoading}
                errorMessage={errorMessage}
                onClearError={() => setErrorMessage(null)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="job"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <KioskJobConsole
                session={session}
                onPrint={() => {}}
                onCompleteAndPurge={handleCompleteAndPurge}
                onCancel={handleCancel}
                isPurging={isPurging}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />

      {/* Printable Counter QR Standee Modal */}
      {shop && (
        <ShopQrModal
          shop={shop}
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
        />
      )}
    </div>
  );
}

export default function KioskPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Kiosk Console…</div>}>
      <KioskContent />
    </Suspense>
  );
}
