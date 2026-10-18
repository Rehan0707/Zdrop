"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Store, QrCode, BadgePercent } from "lucide-react";
import { SessionData } from "@/lib/types";
import {
  resolveByAccessCode,
  finishPrintSession,
  subscribeToSession,
} from "@/lib/session-client";
import { Navbar } from "@/components/Navbar";
import { KioskEntryView } from "@/views/KioskEntryView";
import { KioskJobConsole } from "@/components/KioskJobConsole";
import { Footer } from "@/components/landing/Footer";
import { useAuth } from "@/lib/auth-context";
import { ShopQrModal } from "@/components/ShopQrModal";
import { ShopPricingModal } from "@/components/ShopPricingModal";

function KioskContent() {
  const { shop, refresh } = useAuth();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);

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
      await finishPrintSession(session.id);
      setSession(null);
      setSuccessToast("Print access ended. ZDrop’s stored files were deleted. Physical printing is not verified.");
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (e) {
      setErrorMessage((e as Error).message);
      throw e;
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

      <main id="main-content" className="zd-main">
        <div className={`zd-kiosk-wrapper ${session ? "zd-kiosk-wrapper--console" : ""}`}>
          {errorMessage && session && (
            <div role="alert" className="zd-alert-danger">
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Shop Owner Status Banner */}
          {shop && (
            <div className="zd-shop-banner">
              <div className="zd-shop-banner-info">
                <div className="zd-shop-banner-icon">
                  <Store size={20} />
                </div>
                <div>
                  <div className="zd-shop-banner-title">
                    <h2>{shop.shopName}</h2>
                    <span className="zd-shop-code-pill">
                      CODE: {shop.shopCode}
                    </span>
                  </div>
                  <p className="zd-shop-banner-address">{shop.campusAddress}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowPricingModal(true)}
                  className="zd-button zd-button--secondary"
                >
                  <BadgePercent size={16} />
                  <span>Rates & UPI Setup</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="zd-button zd-button--secondary"
                >
                  <QrCode size={16} />
                  <span>Counter QR Standee</span>
                </button>
              </div>
            </div>
          )}

          {/* Success Toast */}
          {successToast && (
            <div className="zd-alert-success">
              <span>{successToast}</span>
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
        </div>
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

      {/* Shop Rates & UPI Counter Pricing Modal */}
      {shop && (
        <ShopPricingModal
          shop={shop}
          isOpen={showPricingModal}
          onClose={() => setShowPricingModal(false)}
          onSaved={() => {
            void refresh();
            setSuccessToast("Pricing rates and UPI setup saved successfully!");
            setTimeout(() => setSuccessToast(null), 3500);
          }}
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
