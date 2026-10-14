"use client";

import { useState, useRef, useId, ChangeEvent, DragEvent } from "react";
import { UploadCloud, AlertCircle, ArrowUpRight } from "lucide-react";
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
  const descriptionId = useId();

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
      const isAllowed = allowedTypes.includes(type) && file.size > 0;

      if (!isAllowed) {
        setErrorMessage(
          `"${file.name}" is not a supported format. Please use PDF, DOCX, JPG, or PNG.`,
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
    <div>
      {files.length < maxFiles && (
        <div
          className="zd-upload-zone"
          data-dragging={isDragging}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled}
          aria-label="Select documents"
          aria-describedby={descriptionId}
          onKeyDown={(event) => {
            if (!disabled && (event.key === "Enter" || event.key === " ")) {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          onClick={() => !disabled && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
            aria-label="Upload documents"
          />
          <span className="zd-upload-icon" aria-hidden="true">
            <UploadCloud size={23} />
          </span>
          <h3>Drop your documents here</h3>
          <p id={descriptionId}>
            PDF, DOCX, JPG & PNG · {maxFiles} files · {maxSizeMb} MiB each
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
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
}
