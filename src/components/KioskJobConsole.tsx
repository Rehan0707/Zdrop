"use client";

import { useState, useRef, useEffect } from "react";
import {
  Printer,
  Trash2,
  FileText,
  FileImage,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Layers,
  Palette,
  FileSpreadsheet,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { ConfirmDialog } from "./ConfirmDialog";
import { SessionData, FileMetadata } from "@/lib/types";
import { formatBytes } from "@/lib/utils";

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
  const [confirmPurge, setConfirmPurge] = useState(false);
  const { preferences } = session;

  const handlePrintClick = () => {
    onPrint();
    if (!selectedFile?.previewUrl) return;
    if (selectedFile.type.includes("wordprocessing")) {
      window.open(selectedFile.previewUrl, "_blank", "noopener,noreferrer");
      return;
    }
    try {
      previewRef.current?.contentWindow?.focus();
      previewRef.current?.contentWindow?.print();
    } catch {
      window.open(selectedFile.previewUrl, "_blank", "noopener,noreferrer");
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        handlePrintClick();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedFile, onPrint]);

  return (
    <div className="zd-console-card">
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
          <span className="zd-console-status-pill">
            Status: Accessed
          </span>
        </div>
      </div>

      <div className="zd-console-body">
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

          {/* Preview Canvas Box */}
          {selectedFile && (
            <div className="zd-console-preview-container">
              {selectedFile.previewUrl && selectedFile.type.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedFile.previewUrl}
                  alt={selectedFile.name}
                  style={{ maxHeight: "360px", maxWidth: "100%", borderRadius: "8px", objectFit: "contain" }}
                />
              ) : selectedFile.previewUrl && selectedFile.type.includes("pdf") ? (
                <div style={{ width: "100%", height: "360px" }}>
                  <iframe
                    ref={previewRef}
                    src={selectedFile.previewUrl}
                    title="PDF Preview"
                    style={{ width: "100%", height: "100%", borderRadius: "8px", border: "1px solid var(--line)" }}
                  />
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "30px 10px" }}>
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "12px",
                      background: "var(--surface)",
                      border: "1px solid var(--line)",
                      display: "grid",
                      placeItems: "center",
                      margin: "0 auto 12px",
                      color: "var(--text-primary)"
                    }}
                  >
                    <FileText size={26} />
                  </div>
                  <p style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                    {selectedFile.name}
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                    DOCX files stream via native application dialog.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {selectedFile?.previewUrl && (
          <div style={{ marginBottom: "16px" }}>
            <a
              className="zd-text-link"
              style={{ fontSize: "12px" }}
              href={selectedFile.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>Open document in new window</span>
              <ExternalLink size={14} />
            </a>
          </div>
        )}

        <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 16px" }}>
          Apply customer’s copies, color, sides, and page range in your physical printer dialog. Print all attached documents before finalizing the job.
        </p>

        {selectedFile?.type.startsWith("image/") && (
          <iframe ref={previewRef} title="Image print frame" src={selectedFile.previewUrl} className="sr-only" />
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
