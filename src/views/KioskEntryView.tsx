"use client";

import { QrScanner } from "@/components/QrScanner";
import { Printer, Shield, Clock, Lock } from "lucide-react";
import { KioskOtpInput } from "@/components/KioskOtpInput";

interface KioskEntryViewProps {
  onSubmitCode: (code: string) => void;
  isLoading?: boolean;
  errorMessage?: string | null;
  onClearError?: () => void;
}

export function KioskEntryView({
  onSubmitCode,
  isLoading = false,
  errorMessage = null,
  onClearError,
}: KioskEntryViewProps) {
  return (
    <div className="space-y-6">
      {/* Kiosk Hero */}
      <div className="zd-kiosk-hero">
        <p className="zd-eyebrow">
          <span className="zd-dot" aria-hidden="true" />
          Operator Counter Station
        </p>

        <h1>Enter Customer Access Code</h1>

        <p>
          Enter the customer’s six-digit code or scan the ZDrop job QR to open the temporary print job in the browser preview.
        </p>
      </div>

      {/* Code Input Card */}
      <div className="zd-kiosk-card">
        <KioskOtpInput
          onSubmit={onSubmitCode}
          isLoading={isLoading}
          errorMessage={errorMessage}
          onClearError={onClearError}
        />
      </div>

      <div className="text-center">
        <QrScanner onCode={onSubmitCode} disabled={isLoading} />
      </div>

      {/* Operator Guidelines Strip */}
      <div className="zd-guidelines-grid">
        <div className="zd-guideline-card">
          <div className="zd-guideline-icon">
            <Shield size={18} />
          </div>
          <div className="zd-guideline-text">
            <h3>Temporary document access</h3>
            <p>
              ZDrop removes its stored copy when the job ends or the code expires. The shop browser or printer may retain other copies.
            </p>
          </div>
        </div>

        <div className="zd-guideline-card">
          <div className="zd-guideline-icon">
            <Lock size={18} />
          </div>
          <div className="zd-guideline-text">
            <h3>Limited browser controls</h3>
            <p>
              The page can block its own context menu and flag some shortcuts, but cannot prevent system screenshots, downloads, or printer copies.
            </p>
          </div>
        </div>

        <div className="zd-guideline-card">
          <div className="zd-guideline-icon">
            <Clock size={18} />
          </div>
          <div className="zd-guideline-text">
            <h3>Print instructions included</h3>
            <p>
              Copies, color mode, and page ranges travel with the job for the operator to review.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
