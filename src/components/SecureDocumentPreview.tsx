"use client";

import { useEffect, useState } from "react";
import type { FileMetadata } from "@/lib/types";
import { FileText, EyeOff } from "lucide-react";
import { renderSessionPage } from "@/lib/session-client";
import { supportsRestrictedPrint } from "@/lib/print-policy";

interface SecureDocumentPreviewProps {
  file: FileMetadata;
  sessionId: string;
  isShielded: boolean;
  onUnshield: () => void;
  disabled?: boolean;
}
export function SecureDocumentPreview({
  file,
  sessionId,
  isShielded,
  onUnshield,
  disabled,
}: SecureDocumentPreviewProps) {
  const [page, setPage] = useState(1);
  const [url, setUrl] = useState<string>();
  const [error, setError] = useState("");
  useEffect(() => {
    setPage(1);
  }, [file.fileId]);
  useEffect(() => {
    const controller = new AbortController();
    let objectUrl: string | undefined;
    setUrl(undefined);
    setError("");
    if (!disabled && supportsRestrictedPrint(file)) {
      renderSessionPage(
        sessionId,
        file.fileId,
        page,
        "preview",
        controller.signal,
      )
        .then((result) => {
          if (controller.signal.aborted) return;
          objectUrl = URL.createObjectURL(result.blob);
          setUrl(objectUrl);
        })
        .catch((error) => {
          if (!controller.signal.aborted) setError((error as Error).message);
        });
    }
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [sessionId, file.fileId, file.type, page, disabled]);

  if (!supportsRestrictedPrint(file))
    return (
      <div className="zd-secure-placeholder">
        <FileText size={32} />
        <h3>PDF conversion required</h3>
        <p>
          Ask the customer to convert this DOCX to PDF on their device and
          upload again. Original Office files cannot be downloaded or printed by
          this restricted browser flow.
        </p>
      </div>
    );
  return (
    <section
      className="zd-raster-preview"
      aria-label="Rendered document preview"
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="zd-raster-page">
        {url && !disabled && !isShielded && (
          <img
            src={url}
            alt={`Rendered page ${page} of ${file.name}`}
            draggable={false}
            onDragStart={(event) => event.preventDefault()}
          />
        )}
        {disabled ? (
          <p>Preview cleared for one-time printing.</p>
        ) : isShielded ? (
          <button
            type="button"
            className="zd-button zd-button--secondary"
            onClick={onUnshield}
          >
            <EyeOff size={17} />
            Restore preview
          </button>
        ) : error ? (
          <p role="alert">{error}</p>
        ) : !url ? (
          <p role="status">Rendering page…</p>
        ) : null}
      </div>
      <div className="zd-raster-controls">
        <button
          type="button"
          className="zd-button zd-button--secondary"
          disabled={disabled || page <= 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>
        <span>
          Page {page} / {file.pageCount || 1}
        </span>
        <button
          type="button"
          className="zd-button zd-button--secondary"
          disabled={disabled || page >= (file.pageCount || 1)}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </section>
  );
}
