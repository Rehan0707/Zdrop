"use client";

import { useState, useRef, useId, ChangeEvent, DragEvent } from "react";
import { UploadCloud, AlertCircle, ArrowUpRight } from "lucide-react";
import { FileMetadata } from "@/lib/types";
import { FileCard } from "./FileCard";
import { getClientDocumentPageCount } from "@/lib/client-document";
import { analyzeImageColor, analyzePdfColorPages } from "@/lib/client-color-analysis";

interface DropZoneProps {
  files: FileMetadata[];
  onFilesChange: (files: FileMetadata[]) => void;
  maxFiles?: number;
  maxSizeMb?: number;
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
}

export function DropZone({
  files,
  onFilesChange,
  maxFiles = 3,
  maxSizeMb = 25,
  disabled = false,
  onBusyChange,
}: DropZoneProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const analyzingRef = useRef(false);
  const locked = disabled || analyzing;
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysisMessage, setAnalysisMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const descriptionId = useId();

  const maxSizeBytes = maxSizeMb * 1024 * 1024;

  const validateAndAddFiles = async (incomingFiles: FileList | File[]) => {
    if (disabled || analyzingRef.current) return;
    analyzingRef.current = true; setAnalyzing(true); onBusyChange?.(true);
    setErrorMessage(null);
    try {
    const newFiles: FileMetadata[] = [...files];

    for (let i = 0; i < incomingFiles.length; i++) {
      const file = incomingFiles[i];

      if (newFiles.length >= maxFiles) {
        setErrorMessage(`Maximum ${maxFiles} documents allowed per session.`);
        break;
      }

      if (file.size > maxSizeBytes) {
        setErrorMessage(
          `"${file.name}" exceeds the ${maxSizeMb}MB file limit.`,
        );
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
      const type =
        file.type ||
        extensions[file.name.split(".").pop()?.toLowerCase() || ""];
      if (type?.includes("wordprocessing")) {
        setErrorMessage("Restricted printing needs a PDF. Convert this DOCX on your device before uploading.");
        continue;
      }
      const isAllowed = allowedTypes.includes(type) && file.size > 0;

      if (!isAllowed) {
        setErrorMessage(
          `"${file.name}" is not a supported format. Please use PDF, JPG, or PNG.`,
        );
        continue;
      }

      // Check duplicate by name and size
      const isDuplicate = newFiles.some(
        (f) => f.name === file.name && f.size === file.size,
      );
      if (isDuplicate) continue;

      const previewUrl =
        type.startsWith("image/") || type.includes("pdf")
          ? URL.createObjectURL(file)
          : undefined;

      // Read page count and scan supported pages locally. File bytes never leave the browser for analysis.
      let pageCount = await getClientDocumentPageCount(file);
      const metadata: FileMetadata = {
        fileId: "file_" + crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type,
        file,
        pageCount,
        previewUrl,
      };
      newFiles.push(metadata);
      onFilesChange([...newFiles]);

      try {
        if (type === "application/pdf") {
          const analysis = await analyzePdfColorPages(file, ({ currentPage, totalPages }) => {
            setAnalysisMessage(`Checking page color in ${file.name}: page ${currentPage} of ${totalPages}`);
          });
          pageCount = analysis.pageCount;
          newFiles[newFiles.length - 1] = { ...metadata, pageCount, colorPages: analysis.colorPages };
        } else if (type.startsWith("image/")) {
          setAnalysisMessage(`Checking ${file.name} for page color`);
          newFiles[newFiles.length - 1] = { ...metadata, colorPages: await analyzeImageColor(file) };
        }
      } catch {
        // Analysis is an estimate only; unsupported browsers or malformed PDFs remain uploadable.
      }
      onFilesChange([...newFiles]);
    }

    onFilesChange(newFiles);
    } finally {
      analyzingRef.current = false; setAnalyzing(false); onBusyChange?.(false); setAnalysisMessage(null);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!locked && files.length < maxFiles) {
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
    if (locked || files.length >= maxFiles) return;
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
    if (locked) return;
    const removed = files.find((f) => f.fileId === fileId);
    if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
    const updated = files.filter((f) => f.fileId !== fileId);
    onFilesChange(updated);
    setErrorMessage(null);
  };

  return (
    <div>
      {analysisMessage && (
        <p className="text-xs text-blue-700 mb-2" role="status" aria-live="polite">
          {analysisMessage} on this device
        </p>
      )}
      {files.length < maxFiles && (
        <div
          className="zd-upload-zone"
          data-dragging={isDragging}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="button"
          tabIndex={locked ? -1 : 0}
          aria-disabled={locked}
          aria-label="Select documents"
          aria-describedby={descriptionId}
          onKeyDown={(event) => {
            if (!locked && (event.key === "Enter" || event.key === " ")) {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          onClick={() => !locked && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            className="hidden"
            disabled={locked}
            aria-label="Upload documents"
          />
          <span className="zd-upload-icon" aria-hidden="true">
            <UploadCloud size={23} />
          </span>
          <h3>Drop your documents here</h3>
          <p id={descriptionId}>
            PDF, JPG & PNG · {maxFiles} files · {maxSizeMb} MiB each
          </p>
          <span className="zd-browse">
            Browse files <ArrowUpRight size={14} />
          </span>
        </div>
      )}
      {errorMessage && (
        <p role="alert" className="zd-alert">
          {errorMessage}
        </p>
      )}
      {files.length > 0 && (
        <div className="zd-file-list">
          <p className="zd-eyebrow" aria-live="polite">
            {files.length} of {maxFiles} documents selected
          </p>
          {files.map((file) => (
            <FileCard
              key={file.fileId}
              file={file}
              onRemove={handleRemove}
              disabled={locked}
            />
          ))}
        </div>
      )}
    </div>
  );
}
