"use client";
import { FileText, FileImage, X } from "lucide-react";
import { FileMetadata } from "@/lib/types";
import { formatBytes } from "@/lib/utils";
import { formatPageRanges } from "@/lib/page-ranges";
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
        <div className="flex items-center gap-2 flex-wrap">
          <p title={file.name} style={{ margin: 0 }}>{file.name}</p>
          {file.pageCount && (
            <span className="zd-file-page-pill">
              {file.pageCount} {file.pageCount === 1 ? "page" : "pages"}
            </span>
          )}
        </div>
        <small>
          {formatBytes(file.size)}
          {file.pageCount
            ? ` · ${file.pageCount} ${file.pageCount === 1 ? "page" : "pages"} ready to print`
            : ""}
          {file.colorPages !== undefined && ` · ${file.colorPages.length} color ${file.colorPages.length === 1 ? "page" : "pages"}`}
        </small>
        {file.colorPages !== undefined ? (
          <small className="block text-slate-600">
            {file.colorPages.length
              ? `Color pages: ${formatPageRanges(file.colorPages)}`
              : "No color detected; estimated as B&W"}
          </small>
        ) : (
          <small className="block text-slate-500">Page-color analysis unavailable; estimate assumes color</small>
        )}
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
