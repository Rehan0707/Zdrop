"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  FileText,
  Hash,
  Printer,
  Store,
  UserRound,
} from "lucide-react";
import {
  FileMetadata,
  PrintPreferences,
  PrintPreferencesSchema,
  ShopProfile,
} from "@/lib/types";
import { DropZone } from "@/components/DropZone";
import { PrintPreferencesCard } from "@/components/PrintPreferencesCard";
import { useAuth } from "@/lib/auth-context";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { ZDropStickerMark } from "@/components/ZDropLogo";

interface HeroSectionProps {
  onGenerateCode: (
    files: FileMetadata[],
    preferences: PrintPreferences,
    shop?: { id: string; name: string },
  ) => void;
  isGenerating?: boolean;
  uploadProgress?: number;
}

export function HeroSection({
  onGenerateCode,
  isGenerating = false,
  uploadProgress = 0,
}: HeroSectionProps) {
  const { user, isLoading } = useAuth();
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [preferences, setPreferences] = useState<PrintPreferences>({
    copies: 1,
    colorMode: "BW",
    sides: "DOUBLE",
    pageRange: "ALL",
  });
  const [shops, setShops] = useState<ShopProfile[]>([]);
  const [selectedShopId, setSelectedShopId] = useState("");
  const [showSignIn, setShowSignIn] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/shops")
      .then((response) => response.json())
      .then((data) => {
        if (active && Array.isArray(data.shops)) {
          setShops(data.shops);
          if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const shopQuery = params.get("shop");
            if (shopQuery) {
              const matched = data.shops.find(
                (s: ShopProfile) =>
                  s.shopCode.toLowerCase() === shopQuery.toLowerCase() ||
                  s.id.toLowerCase() === shopQuery.toLowerCase()
              );
              if (matched) {
                setSelectedShopId(matched.id);
              }
            }
          }
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const validation = PrintPreferencesSchema.safeParse(preferences);
  const canSubmit = files.length > 0 && validation.success;
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || isGenerating || isLoading) return;
    if (!user) {
      setShowSignIn(true);
      return;
    }
    const chosen = shops.find((shop) => shop.id === selectedShopId);
    onGenerateCode(
      files,
      preferences,
      chosen ? { id: chosen.id, name: chosen.shopName } : undefined,
    );
  };

  return (
    <section className="zd-hero" id="upload" aria-labelledby="upload-heading">
      <div className="zd-container zd-hero-grid">
        <div className="zd-hero-copy">
          <p className="zd-eyebrow">
            <span className="zd-dot" aria-hidden="true" />
            The simple print handoff
          </p>
          <h1 id="upload-heading">
            From your phone.
            <br />
            <span>To the printer.</span>
          </h1>
          <p className="zd-hero-description">
            Your documents, a six-digit code, and a quick stop at the counter.
            No phone number or contact swap needed.
          </p>
          <div className="zd-hero-links">
            <a href="#how-it-works" className="zd-text-link">
              See how it works <ArrowRight size={17} />
            </a>
            <Link href="/kiosk" className="zd-text-link zd-muted">
              I run a print shop <ArrowRight size={17} />
            </Link>
          </div>
          <div className="zd-handoff" aria-hidden="true">
            <div className="zd-paper-stack">
              <div className="zd-paper-sheet">
                <ZDropStickerMark width={32} height={35} />
                <strong>Ready to print.</strong>
                <i />
                <i />
                <div>
                  <span>YOUR FILES</span>
                  <span>YOUR SETTINGS</span>
                </div>
              </div>
              <div className="zd-paper-tag">
                <Hash size={18} />
                One temporary code
              </div>
            </div>
            <ArrowRight
              className="zd-handoff-arrow"
              size={27}
              strokeWidth={1.5}
            />
            <div className="zd-printer">
              <Printer size={46} strokeWidth={1.4} />
              <span>At the counter</span>
            </div>
          </div>
          <div className="zd-hero-facts">
            <span>
              <UserRound size={15} />
              No contact swap
            </span>
            <span>
              <Clock3 size={15} />
              15-minute code
            </span>
            <span>
              <FileText size={15} />
              Up to 3 files
            </span>
          </div>
        </div>
        <div className="zd-workbench">
          <header className="zd-workbench-heading">
            <div>
              <p className="zd-eyebrow">Start here</p>
              <h2>Your next print job</h2>
            </div>
            <span className="zd-workbench-number" aria-hidden="true">
              01
            </span>
          </header>
          <form
            onSubmit={handleSubmit}
            className="zd-upload-form"
            aria-busy={isGenerating}
          >
            <DropZone
              files={files}
              onFilesChange={setFiles}
              disabled={isGenerating}
            />
            {files.length > 0 && (
              <>
                {user && (
                  <p className="zd-signed-in">
                    Signed in as <strong>{user.name || user.email}</strong>
                  </p>
                )}
                {shops.length > 0 && (
                  <div className="zd-field zd-shop-field">
                    <label htmlFor="destination-shop" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <Store size={14} />
                        Destination print shop
                      </span>
                      {selectedShopId && (
                        <span className="zd-pill-active" style={{ fontSize: "10px", padding: "1px 6px" }}>
                          ✓ Selected
                        </span>
                      )}
                    </label>
                    <select
                      id="destination-shop"
                      className="zd-input"
                      value={selectedShopId}
                      disabled={isGenerating}
                      onChange={(event) =>
                        setSelectedShopId(event.target.value)
                      }
                    >
                      <option value="">Any ZDrop counter</option>
                      {shops.map((shop) => (
                        <option key={shop.id} value={shop.id}>
                          {shop.shopName} ({shop.campusAddress})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <PrintPreferencesCard
                  preferences={preferences}
                  onChange={setPreferences}
                  disabled={isGenerating}
                  files={files}
                  shopPricing={shops.find((s) => s.id === selectedShopId)?.pricing}
                  shopName={shops.find((s) => s.id === selectedShopId)?.shopName}
                />
              </>
            )}
            {!validation.success && (
              <p role="alert" className="zd-alert">
                {validation.error.issues[0].message}
              </p>
            )}
            {isGenerating && (
              <div
                className="zd-upload-progress"
                role="progressbar"
                aria-label="Uploading documents"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(uploadProgress)}
              >
                <span
                  style={{
                    width: `${Math.max(0, Math.min(100, uploadProgress))}%`,
                  }}
                />
              </div>
            )}
            <button
              type="submit"
              className="zd-button zd-button--primary zd-workbench-submit"
              disabled={!canSubmit || isGenerating || isLoading}
            >
              <span>
                {isGenerating
                  ? `Uploading… ${uploadProgress}%`
                  : "Get my print code"}
              </span>
              <ArrowRight size={18} />
            </button>
            <p className="zd-workbench-help">
              {files.length === 0
                ? "Add a document to choose your print settings."
                : user
                  ? "Show your code or QR to the print shop operator."
                  : "Sign in with Google before uploading your documents."}
            </p>
            {showSignIn && !user && (
              <div className="zd-upload-sign-in">
                <p role="status">
                  Your files are still on your device. Sign in to continue.
                </p>
                <GoogleSignInButton label="Continue with Google" />
              </div>
            )}
          </form>
          <div className="zd-workbench-footer">
            <Clock3 size={15} />
            <p>
              Files expire after 15 minutes. Delete them sooner whenever you
              need.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
