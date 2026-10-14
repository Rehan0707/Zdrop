"use client";

import React, { RefObject } from "react";
import { FileMetadata } from "@/lib/types";
import { ShieldAlert, Lock, FileText, EyeOff } from "lucide-react";

interface SecureDocumentPreviewProps {
  file: FileMetadata;
  accessCode: string;
  isShielded: boolean;
  onUnshield: () => void;
  previewRef: RefObject<HTMLIFrameElement | null>;
}

export function SecureDocumentPreview({
  file,
  accessCode,
  isShielded,
  onUnshield,
  previewRef,
}: SecureDocumentPreviewProps) {
  const isImage = file.type.startsWith("image/");
  const isPdf = file.type.includes("pdf");

  return (
    <div
      className="zd-secure-preview zd-secure-surface"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Dynamic Anti-Capture Watermark Grid (Hidden on physical print) */}
      <div className="zd-secure-watermark" aria-hidden="true">
        <div className="zd-watermark-track">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="zd-watermark-row">
              {Array.from({ length: 6 }).map((_, j) => (
                <span key={j} className="zd-watermark-stamp">
                  ZDROP SECURE PRINT • NO SCREENSHOT • CODE #{accessCode}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Actual Document Content (Hidden/Blurred during Privacy Shield) */}
      <div
        className={`zd-secure-content ${isShielded ? "zd-secure-content--blurred" : ""}`}
      >
        {file.previewUrl && isImage ? (
          <div className="zd-secure-image-wrapper">
            {/* Transparent Guard Overlay - Intercepts right-clicks and prevents saving */}
            <div
              className="zd-secure-guard-overlay"
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={file.previewUrl}
              alt="Protected document preview"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              className="zd-secure-img"
            />
          </div>
        ) : file.previewUrl && isPdf ? (
          <div className="zd-secure-pdf-container">
            {/* Guard bar over top edge of PDF to prevent accidental toolbar interaction */}
            <div
              className="zd-secure-pdf-guard"
              onContextMenu={(e) => e.preventDefault()}
            />
            <iframe
              ref={previewRef}
              src={`${file.previewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
              title="Secure PDF Print Preview"
              sandbox="allow-scripts allow-same-origin allow-modals"
              className="zd-secure-pdf-frame"
            />
          </div>
        ) : (
          <div className="zd-secure-placeholder">
            <div className="zd-secure-placeholder-icon">
              <FileText size={28} />
            </div>
            <p className="zd-secure-placeholder-name">{file.name}</p>
            <div className="zd-secure-placeholder-badge">
              <Lock size={12} />
              <span>Office document queued for direct print buffer</span>
            </div>
            <p className="zd-secure-placeholder-hint">
              Local file downloads are restricted to protect customer privacy.
              Click &quot;Print Document&quot; below to spool this file to your printer.
            </p>
          </div>
        )}
      </div>

      {/* Privacy Shield (Triggered when window loses focus, blur, or screenshot shortcut pressed) */}
      {isShielded && (
        <div
          className="zd-privacy-shield"
          role="alert"
          aria-live="assertive"
          onClick={onUnshield}
        >
          <div className="zd-privacy-shield-card">
            <div className="zd-privacy-shield-icon-wrap">
              <ShieldAlert size={28} />
            </div>
            <h4>Privacy Shield Active</h4>
            <p>
              Document preview is obscured because window focus was lost or a screen
              capture tool was detected.
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUnshield();
              }}
              className="zd-button zd-button--primary zd-privacy-shield-btn"
            >
              <EyeOff size={15} />
              <span>Click to Restore Preview</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
