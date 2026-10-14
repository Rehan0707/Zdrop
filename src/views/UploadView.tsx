"use client";

import { useState } from "react";
import { ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { FileMetadata, PrintPreferences, PrintPreferencesSchema } from "@/lib/types";
import { DropZone } from "@/components/DropZone";
import { PrintPreferencesCard } from "@/components/PrintPreferencesCard";

interface UploadViewProps {
  onGenerateCode: (files: FileMetadata[], preferences: PrintPreferences) => void;
  isGenerating?: boolean;
  uploadProgress?: number;
}

export function UploadView({ onGenerateCode, isGenerating = false, uploadProgress = 0 }: UploadViewProps) {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [preferences, setPreferences] = useState<PrintPreferences>({
    copies: 1,
    colorMode: "BW",
    sides: "DOUBLE",
    pageRange: "ALL",
  });

  const validation = PrintPreferencesSchema.safeParse(preferences);
  const canSubmit = files.length > 0 && validation.success;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onGenerateCode(files, preferences);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Hero Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <Zap className="w-3.5 h-3.5 text-blue-600" />
          <span>Frictionless Print Drop</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-[family-name:var(--font-geist)]">
          Drop it. Print it. Done.
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
          Upload your documents, hand the 6-digit code to the Xerox operator, and your files auto-delete instantly.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Upload Zone */}
        <div>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block font-mono">
            Step 1: Select Documents
          </label>
          <DropZone files={files} onFilesChange={setFiles} disabled={isGenerating} />
        </div>

        {/* Print Preferences (shows when at least 1 file added) */}
        {files.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block font-mono">
              Step 2: Print Setup
            </label>
            <PrintPreferencesCard
              preferences={preferences}
              onChange={setPreferences}
              disabled={isGenerating}
            />
          </div>
        )}

        {!validation.success && <p role="alert" className="text-sm text-red-700">{validation.error.issues[0].message}</p>}
        {/* Submit Bar */}
        <div className="space-y-2 pt-2">
          <button
            type="submit"
            disabled={!canSubmit || isGenerating}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] cursor-pointer shadow-sm text-sm"
          >
            <span>{isGenerating ? `Uploading Documents… ${uploadProgress}%` : "Generate Access Code"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
            <span>Files auto-delete in 15 minutes or immediately after printing</span>
          </p>
        </div>
      </form>
    </div>
  );
}
