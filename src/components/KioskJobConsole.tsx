"use client";

import { useState, useRef, useEffect } from "react";
import {
  Printer,
  Trash2,
  FileText,
  ArrowLeft,
  Palette,
  Layers,
  FileSpreadsheet,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Lock,
  X,
} from "lucide-react";
import { ConfirmDialog } from "./ConfirmDialog";
import { SessionData, FileMetadata } from "@/lib/types";
import { formatBytes } from "@/lib/utils";
import { SecureDocumentPreview } from "./SecureDocumentPreview";
import { useScreenshotProtection } from "@/lib/useScreenshotProtection";

interface KioskJobConsoleProps {
  session: SessionData;
  onPrint: () => void;
  onCompleteAndPurge: () => void;
  onCancel: () => void;
  isPurging?: boolean;
}

export function KioskJobConsole({
  session,
  onPrint,
  onCompleteAndPurge,
  onCancel,
  isPurging = false,
}: KioskJobConsoleProps) {
  const [selectedFile, setSelectedFile] = useState<FileMetadata>(
    session.files[0]
  );

  const previewRef = useRef<HTMLIFrameElement>(null);
  const imagePrintRef = useRef<HTMLIFrameElement>(null);
  const [confirmPurge, setConfirmPurge] = useState(false);
  const { preferences } = session;

  // Anti-Screenshot and Anti-Download Hook
  const { isShielded, securityAlert, clearAlert, unshieldManually } =
    useScreenshotProtection({ enabled: true });

  const handlePrintClick = () => {
    onPrint();
    if (!selectedFile?.previewUrl) return;

    try {
      if (selectedFile.type.startsWith("image/")) {
        imagePrintRef.current?.contentWindow?.focus();
        imagePrintRef.current?.contentWindow?.print();
        return;
      }
      if (selectedFile.type.includes("pdf")) {
        previewRef.current?.contentWindow?.focus();
        previewRef.current?.contentWindow?.print();
        return;
      }
      // For other formats (e.g. DOCX), invoke window.print()
      window.print();
    } catch {
      window.print();
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        handlePrintClick();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedFile, onPrint]);

  return (
    <div
      className="zd-console-card zd-secure-surface"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Screenshot / Screen Capture Blocked Toast Alert */}
      {securityAlert && (
        <div className="zd-screenshot-alert-toast" role="alert">
          <div className="zd-screenshot-alert-icon">
            <ShieldAlert size={20} />
          </div>
          <div className="zd-screenshot-alert-text">
            <strong>Security Restriction Active</strong>
            <p>{securityAlert}</p>
          </div>
          <button
            type="button"
            onClick={clearAlert}
            className="zd-screenshot-alert-close"
            aria-label="Dismiss security alert"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Console Top Header */}
      <div className="zd-console-header">
        <div className="zd-console-header-left">
          <button
            type="button"
            onClick={onCancel}
            className="zd-icon-button"
            aria-label="Back to code entry"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="zd-console-code-title">
              <span>Session Code:</span>
              <span className="zd-console-code">{session.accessCode}</span>
            </div>
            <p className="zd-console-meta">
              {session.files.length} document{session.files.length > 1 ? "s" : ""} attached ({formatBytes(session.totalSizeBytes)})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="zd-console-status-pill zd-console-status-pill--secure">
            <ShieldCheck size={14} />
            <span>Print-Only (Anti-Capture Active)</span>
          </span>
        </div>
      </div>

      <div className="zd-console-body">
        {/* Anti-Download & Anti-Screenshot Policy Strip */}
        <div className="zd-security-policy-banner">
          <div className="zd-security-policy-icon">
            <Lock size={18} />
          </div>
          <div className="zd-security-policy-text">
            <strong>Zero-Storage Customer Privacy Protocol:</strong>
            <span>
              {" "}This terminal operates in print-only mode. Downloading, saving to disk, right-click exporting, and screen capture/recording are strictly restricted.
            </span>
          </div>
        </div>

        {/* Print Preferences Summary Cards */}
        <div>
          <h4 className="zd-console-section-title">
            Customer Print Configuration
          </h4>
          <div className="zd-console-pref-grid">
            {/* Copies */}
            <div className="zd-console-pref-card">
              <div className="zd-console-pref-card-label">
                <Printer size={15} />
                <span>Copies</span>
              </div>
              <p className="zd-console-pref-card-val">
                {preferences.copies} {preferences.copies === 1 ? "Set" : "Sets"}
              </p>
            </div>

            {/* Color Mode */}
            <div className="zd-console-pref-card">
              <div className="zd-console-pref-card-label">
                <Palette size={15} />
                <span>Color Mode</span>
              </div>
              <p className="zd-console-pref-card-val">
                {preferences.colorMode === "BW" ? "Black & White" : "Full Color"}
              </p>
            </div>

            {/* Sides */}
            <div className="zd-console-pref-card">
              <div className="zd-console-pref-card-label">
                <Layers size={15} />
                <span>Print Sides</span>
              </div>
              <p className="zd-console-pref-card-val">
                {preferences.sides === "DOUBLE" ? "Double-Sided" : "Single-Sided"}
              </p>
            </div>

            {/* Pages */}
            <div className="zd-console-pref-card">
              <div className="zd-console-pref-card-label">
                <FileSpreadsheet size={15} />
                <span>Page Selection</span>
              </div>
              <p className="zd-console-pref-card-val" style={{ fontSize: "16px" }}>
                {preferences.pageRange === "ALL" ? "All Pages" : `Pages: ${preferences.pageRange}`}
              </p>
            </div>
          </div>

          {preferences.customerNotes && (
            <div
              className="zd-alert-danger"
              style={{
                background: "var(--surface-soft)",
                borderColor: "var(--line)",
                color: "var(--text-primary)",
                marginBottom: "20px"
              }}
            >
              <AlertCircle size={16} />
              <div>
                <strong>Special Customer Request: </strong>
                <span>{preferences.customerNotes}</span>
              </div>
            </div>
          )}
        </div>

        {/* Document Selection Tabs & Preview */}
        <div style={{ marginBottom: "20px" }}>
          <h4 className="zd-console-section-title">
            Documents ({session.files.length})
          </h4>

          {/* File selector pills */}
          <div className="zd-console-file-tabs">
            {session.files.map((file) => {
              const isSelected = selectedFile?.fileId === file.fileId;
              return (
                <button
                  key={file.fileId}
                  type="button"
                  onClick={() => setSelectedFile(file)}
                  className={`zd-console-file-tab ${isSelected ? "zd-console-file-tab--active" : ""}`}
                >
                  <FileText size={15} />
                  <span style={{ maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis" }}>{file.name}</span>
                  <span style={{ font: "11px var(--font-jetbrains), monospace", opacity: 0.7 }}>
                    ({file.pageCount ? `${file.pageCount} ${file.pageCount === 1 ? "page" : "pages"} · ` : ""}{formatBytes(file.size)})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Secure Preview Box with Anti-Screenshot Watermark and Privacy Shield */}
          {selectedFile && (
            <SecureDocumentPreview
              file={selectedFile}
              accessCode={session.accessCode}
              isShielded={isShielded}
              onUnshield={unshieldManually}
              previewRef={previewRef}
            />
          )}
        </div>

        {/* Restricted Mode Information Indicator (Replaces old 'Open in new window' download link) */}
        <div className="zd-secure-preview-notice">
          <ShieldCheck size={14} />
          <span>
            Protected Direct-Print Stream • Local file downloads, raw file exports, and screenshots are restricted.
          </span>
        </div>

        <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5, margin: "14px 0 16px" }}>
          Apply customer’s copies, color, sides, and page range in your physical printer dialog. Print all attached documents before finalizing the job.
        </p>

        {/* Dedicated Hidden Print Buffer for Images */}
        {selectedFile?.type.startsWith("image/") && (
          <iframe
            ref={imagePrintRef}
            title="Image print buffer"
            src={selectedFile.previewUrl}
            className="sr-only"
          />
        )}

        <ConfirmDialog
          isOpen={confirmPurge}
          title="Finished printing all documents?"
          message="Ensure every attached page has physically finished printing. Deleting these files from ZDrop storage is permanent and instantaneous."
          confirmLabel="Yes, Purge Files"
          onConfirm={() => {
            setConfirmPurge(false);
            onCompleteAndPurge();
          }}
          onCancel={() => setConfirmPurge(false)}
          isConfirming={isPurging}
        />

        {/* Action Hub */}
        <div className="zd-console-actions">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPurging}
            className="zd-button zd-button--secondary"
          >
            Close Terminal
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={handlePrintClick}
              disabled={isPurging}
              className="zd-button zd-button--primary"
            >
              <Printer size={16} />
              <span>Print Document (Ctrl+P)</span>
            </button>

            <button
              type="button"
              onClick={() => setConfirmPurge(true)}
              disabled={isPurging}
              className="zd-btn-danger"
            >
              <Trash2 size={16} />
              <span>{isPurging ? "Purging Files..." : "Mark Printed & Purge"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
