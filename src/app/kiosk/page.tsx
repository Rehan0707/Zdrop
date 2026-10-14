"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
import {
  CheckCircle2,
  Store,
  QrCode,
  ShieldCheck,
  UserPlus,
  LogIn,
  ArrowRight
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ShopAuthModal } from "@/components/ShopAuthModal";
import { ShopQrModal } from "@/components/ShopQrModal";
import "@/components/kiosk.css";

function KioskContent() {
  const searchParams = useSearchParams();
  const { user, shop } = useAuth();
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Shop portal state
  const [shopAuthOpen, setShopAuthOpen] = useState(false);
  const [shopAuthTab, setShopAuthTab] = useState<"login" | "register">("login");
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [guestMode, setGuestMode] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

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
      setCompletedCount((prev) => prev + 1);
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
    <div className="zd-kiosk-page">
      <Navbar currentRole="kiosk" />

      <main id="main-content" className="zd-container zd-kiosk-main">
        {/* Shop Owner Portal Bar / Authentication Gate */}
        {shop ? (
          <div className="zd-shop-header-banner">
            <div className="zd-shop-header-left">
              <div className="zd-shop-icon-wrapper">
                <Store size={22} />
              </div>
              <div>
                <div className="zd-shop-name-row">
                  <h2>{shop.shopName}</h2>
                  <span className="zd-shop-code-pill">Code: {shop.shopCode}</span>
                  <span className="zd-shop-status-pill">
                    <span className="zd-live-dot" /> Online
                  </span>
                </div>
                <p className="zd-shop-address">{shop.campusAddress}</p>
              </div>
            </div>

            <div className="zd-shop-header-right">
              <button
                type="button"
                className="zd-btn zd-btn-secondary zd-shop-qr-btn"
                onClick={() => setQrModalOpen(true)}
              >
                <QrCode size={16} />
                <span>Counter QR Poster</span>
              </button>
              {completedCount > 0 && (
                <div className="zd-shop-stats-badge">
                  <span>{completedCount} printed & purged</span>
                </div>
              )}
            </div>
          </div>
        ) : !guestMode && !session ? (
          <div className="zd-shop-kiosk-gate">
            <div className="zd-gate-content">
              <div className="zd-gate-badge">
                <Store size={18} />
                <span>Print Shop Portal</span>
              </div>
              <h2>Operating a Xerox or Print Shop?</h2>
              <p>
                Sign in to your shop account or create one in 30 seconds to get your counter QR code standee and branded kiosk.
              </p>
              <div className="zd-gate-actions">
                <button
                  type="button"
                  className="zd-btn zd-btn-primary"
                  onClick={() => {
                    setShopAuthTab("login");
                    setShopAuthOpen(true);
                  }}
                >
                  <LogIn size={16} />
                  <span>Sign In to Shop Kiosk</span>
                </button>
                <button
                  type="button"
                  className="zd-btn zd-btn-secondary"
                  onClick={() => {
                    setShopAuthTab("register");
                    setShopAuthOpen(true);
                  }}
                >
                  <UserPlus size={16} />
                  <span>Create Shop Account</span>
                </button>
                <button
                  type="button"
                  className="zd-gate-guest-link"
                  onClick={() => setGuestMode(true)}
                >
                  <span>Continue as Guest Operator</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {errorMessage && session && (
          <p role="alert" className="zd-kiosk-error">
            {errorMessage}
          </p>
        )}

        {successToast && (
          <div role="status" className="zd-kiosk-success">
            <CheckCircle2 size={20} aria-hidden="true" />
            {successToast}
          </div>
        )}

        {!session ? (
          <KioskEntryView
            onSubmitCode={handleCodeSubmit}
            isLoading={isLoading}
            errorMessage={errorMessage}
            onClearError={() => setErrorMessage(null)}
          />
        ) : (
          <KioskJobConsole
            session={session}
            onPrint={() => {}}
            onCompleteAndPurge={handleCompleteAndPurge}
            onCancel={handleCancel}
            isPurging={isPurging}
          />
        )}
      </main>

      {/* Shop Owner Auth Modal */}
      <ShopAuthModal
        isOpen={shopAuthOpen}
        onClose={() => setShopAuthOpen(false)}
        defaultTab={shopAuthTab}
      />

      {/* Printable Counter QR Modal */}
      {shop && (
        <ShopQrModal
          shop={shop}
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
        />
      )}

      <Footer />
    </div>
  );
}

export default function KioskPage() {
  return (
    <Suspense fallback={<div className="zd-kiosk-loading" role="status">Opening the print desk…</div>}>
      <KioskContent />
    </Suspense>
  );
}
