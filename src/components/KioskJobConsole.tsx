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
    <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gradient-to-b dark:from-[#141926]/95 dark:to-[#0E121B]/95 shadow-lg dark:shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl overflow-hidden transition-colors">
      {/* Console Top Header */}
      <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-black/20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/10 transition active:scale-[0.98] cursor-pointer shadow-2xs"
            aria-label="Back to code entry"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase">
                Session Code:
              </span>
              <span className="text-lg font-extrabold font-mono text-blue-700 dark:text-cyan-400">
                {session.accessCode}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
              {session.files.length} document{session.files.length > 1 ? "s" : ""} attached ({formatBytes(session.totalSizeBytes)})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-cyan-950/60 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-cyan-500/30 font-mono">
            Status: Accessed
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-7 space-y-6">
        {/* Print Preferences Summary Cards */}
        <div>
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 font-mono">
            Customer Print Configuration
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Copies */}
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-cyan-950/20 border border-blue-200 dark:border-cyan-500/30 space-y-1">
              <div className="flex items-center gap-1.5 text-blue-600 dark:text-cyan-400">
                <Printer className="w-4 h-4" />
                <span className="text-xs font-medium">Copies</span>
              </div>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                {preferences.copies} {preferences.copies === 1 ? "Set" : "Sets"}
              </p>
            </div>

            {/* Color Mode */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <Palette className="w-4 h-4" />
                <span className="text-xs font-medium">Color Mode</span>
              </div>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {preferences.colorMode === "BW" ? "Black & White" : "Full Color"}
              </p>
            </div>

            {/* Sides */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <Layers className="w-4 h-4" />
                <span className="text-xs font-medium">Print Sides</span>
              </div>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {preferences.sides === "DOUBLE" ? "Double-Sided" : "Single-Sided"}
              </p>
            </div>

            {/* Pages */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <FileSpreadsheet className="w-4 h-4" />
                <span className="text-xs font-medium">Page Selection</span>
              </div>
              <p className="text-base font-bold text-slate-900 dark:text-white truncate">
                {preferences.pageRange === "ALL" ? "All Pages" : `Pages: ${preferences.pageRange}`}
              </p>
            </div>
          </div>

          {preferences.customerNotes && (
            <div className="mt-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Special Customer Request: </span>
                <span>{preferences.customerNotes}</span>
              </div>
            </div>
          )}
        </div>

        {/* Document Selection Tabs & Preview */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
            Documents ({session.files.length})
          </h4>

          {/* File selector pills */}
          <div className="flex flex-wrap gap-2">
            {session.files.map((file) => {
              const isSelected = selectedFile?.fileId === file.fileId;
              return (
                <button
                  key={file.fileId}
                  type="button"
                  onClick={() => setSelectedFile(file)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer active:scale-[0.98] ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 text-blue-900 dark:border-cyan-500 dark:bg-cyan-950/40 dark:text-cyan-200 shadow-2xs"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/20"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                  <span className="truncate max-w-[180px]">{file.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ({file.pageCount ? `${file.pageCount} ${file.pageCount === 1 ? "page" : "pages"} · ` : ""}{formatBytes(file.size)})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Preview Canvas Box */}
          {selectedFile && (
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 flex flex-col items-center justify-center min-h-[240px]">
              {selectedFile.previewUrl && selectedFile.type.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedFile.previewUrl}
                  alt={selectedFile.name}
                  className="max-h-80 rounded-xl shadow-lg object-contain bg-white dark:bg-white/5 p-2"
                />
              ) : selectedFile.previewUrl && selectedFile.type.includes("pdf") ? (
                <div className="w-full text-center space-y-2">
                  <iframe
                    ref={previewRef}
                    src={selectedFile.previewUrl}
                    title="PDF Preview"
                    className="w-full h-80 rounded-xl border border-slate-200 dark:border-white/10 bg-white"
                  />
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-cyan-950/60 border border-blue-200 dark:border-cyan-500/30 text-blue-600 dark:text-cyan-400 flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white font-display">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans">
                    DOCX files stream via native application dialog.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {selectedFile?.previewUrl && (
          <a
            className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-cyan-400 hover:underline font-mono transition"
            href={selectedFile.previewUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>Open document in new window</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}

        <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
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
        <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPurging}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white hover:bg-slate-50 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition active:scale-[0.98] cursor-pointer shadow-2xs"
          >
            Close Terminal
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrintClick}
              disabled={isPurging}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 dark:from-cyan-500 dark:via-sky-500 dark:to-blue-600 dark:hover:from-cyan-400 dark:hover:to-blue-500 text-white font-bold text-sm font-display flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer shadow-md dark:shadow-[0_0_20px_rgba(6,182,212,0.3)]"
            >
              <Printer className="w-4 h-4" />
              <span>Print Document (Ctrl+P)</span>
            </button>

            <button
              type="button"
              onClick={() => setConfirmPurge(true)}
              disabled={isPurging}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm font-display flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer shadow-md dark:shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isPurging ? "Purging Files..." : "Mark Printed & Purge"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
