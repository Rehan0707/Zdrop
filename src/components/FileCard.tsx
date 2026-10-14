"use client";
import { FileText, FileImage, X } from "lucide-react";
import { FileMetadata } from "@/lib/types";
import { formatBytes } from "@/lib/utils";
interface FileCardProps {
  file: FileMetadata;
  onRemove: (fileId: string) => void;
  disabled?: boolean;
}
export function FileCard({ file, onRemove, disabled = false }: FileCardProps) {
  return (
    <div className="zd-file">
      <span className="zd-file-icon" aria-hidden="true">
        {file.type.startsWith("image/") ? (
          <FileImage size={18} />
        ) : (
          <FileText size={18} />
        )}
      </span>
      <div className="zd-file-info">
        <p title={file.name}>{file.name}</p>
        <small>
          {formatBytes(file.size)}
          {file.pageCount
            ? ` · ${file.pageCount} ${file.pageCount === 1 ? "page" : "pages"}`
            : ""}
        </small>
      </div>
      <button
        type="button"
        className="zd-icon-button"
        onClick={() => onRemove(file.fileId)}
        disabled={disabled}
        aria-label={`Remove ${file.name}`}
      >
        <X size={16} />
      </button>
    </div>
  );
}
