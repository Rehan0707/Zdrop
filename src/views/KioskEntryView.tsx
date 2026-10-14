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
          Type the 6-digit OTP dictated by the customer or scan their QR code to stream verified documents directly into the print buffer.
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
            <h3>Zero Hard Drive Clutter</h3>
            <p>
              Documents stream into native print buffers. No files saved to your PC’s Downloads folder.
            </p>
          </div>
        </div>

        <div className="zd-guideline-card">
          <div className="zd-guideline-icon">
            <Lock size={18} />
          </div>
          <div className="zd-guideline-text">
            <h3>Anti-Screenshot Shield</h3>
            <p>
              Direct print only. File downloads, right-click saving, and screen capture are restricted.
            </p>
          </div>
        </div>

        <div className="zd-guideline-card">
          <div className="zd-guideline-icon">
            <Clock size={18} />
          </div>
          <div className="zd-guideline-text">
            <h3>Pre-Locked Preferences</h3>
            <p>
              Copies, color mode, and page ranges are selected by the customer on their phone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
