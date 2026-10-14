"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { UploadCloud, AlertCircle } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { FileMetadata } from "@/lib/types";
import { FileCard } from "./FileCard";

interface DropZoneProps {
  files: FileMetadata[];
  onFilesChange: (files: FileMetadata[]) => void;
  maxFiles?: number;
  maxSizeMb?: number;
  disabled?: boolean;
}

export function DropZone({
  files,
  onFilesChange,
  maxFiles = 3,
  maxSizeMb = 25,
  disabled = false,
}: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const maxSizeBytes = maxSizeMb * 1024 * 1024;

  const validateAndAddFiles = (incomingFiles: FileList | File[]) => {
    setErrorMessage(null);
    const newFiles: FileMetadata[] = [...files];

    for (let i = 0; i < incomingFiles.length; i++) {
      const file = incomingFiles[i];

      if (newFiles.length >= maxFiles) {
        setErrorMessage(`Maximum ${maxFiles} documents allowed per session.`);
        break;
      }

      if (file.size > maxSizeBytes) {
        setErrorMessage(`"${file.name}" exceeds the ${maxSizeMb}MB file limit.`);
        continue;
      }

      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg",
        "image/png",
      ];

      const extensions: Record<string, string> = {
        pdf: allowedTypes[0],
        docx: allowedTypes[1],
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
      };
      const type = file.type || extensions[file.name.split(".").pop()?.toLowerCase() || ""];
      const isAllowed = allowedTypes.includes(type) && file.size > 0;

      if (!isAllowed) {
        setErrorMessage(`"${file.name}" is not a supported format. Please use PDF, DOCX, JPG, or PNG.`);
        continue;
      }

      // Check duplicate by name and size
      const isDuplicate = newFiles.some(
        (f) => f.name === file.name && f.size === file.size
      );
      if (isDuplicate) continue;

      const previewUrl =
        type.startsWith("image/") || type.includes("pdf")
          ? URL.createObjectURL(file)
          : undefined;

      newFiles.push({
        fileId: "file_" + crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type,
        file,
        pageCount: type.startsWith("image/") ? 1 : undefined,
        previewUrl,
      });
    }

    onFilesChange(newFiles);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && files.length < maxFiles) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || files.length >= maxFiles) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleRemove = (fileId: string) => {
    const removed = files.find((f) => f.fileId === fileId);
    if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
    const updated = files.filter((f) => f.fileId !== fileId);
    onFilesChange(updated);
    setErrorMessage(null);
  };

  return (
    <div className="space-y-3">
      {/* Upload Zone */}
      {files.length < maxFiles && (
        <motion.div
          animate={
            isDragging && !shouldReduceMotion
              ? { scale: 1.02 }
              : { scale: 1 }
          }
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          aria-label="Select documents"
          onClick={() => !disabled && inputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-7 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? "border-blue-500 dark:border-cyan-400 bg-blue-50/50 dark:bg-cyan-950/30 shadow-[0_0_24px_rgba(37,99,235,0.2)] dark:shadow-[0_0_24px_rgba(6,182,212,0.25)]"
              : "border-slate-300 dark:border-white/15 hover:border-blue-500 dark:hover:border-cyan-500/50 hover:bg-slate-50 dark:hover:bg-white/[0.02] bg-slate-50/60 dark:bg-[#121622]/60"
          } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
          />

          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-blue-50 dark:bg-cyan-950/60 border border-blue-200 dark:border-cyan-500/30 flex items-center justify-center text-blue-600 dark:text-cyan-400 shadow-2xs">
            <UploadCloud className="w-6 h-6" />
          </div>

          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1 font-display">
            Tap to select or drop documents
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-3 font-sans">
            PDF, DOCX, JPG, or PNG (up to {maxSizeMb}MB each)
          </p>

          <span className="inline-block text-[11px] font-mono font-medium text-blue-700 dark:text-cyan-300 bg-blue-50 dark:bg-cyan-950/70 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-cyan-700/50">
            {files.length}/{maxFiles} files selected
          </span>
        </motion.div>
      )}

      {/* Inline Error Message */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 rounded-xl">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <FileCard
              key={file.fileId}
              file={file}
              onRemove={handleRemove}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
}
