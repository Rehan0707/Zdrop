'use client';
import { useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import type { IScannerControls } from '@zxing/browser';

export function codeFromQr(value: string, origin?: string): string | null {
  if (/^\d{6}$/.test(value)) return value;
  try {
    const url = new URL(value);
    const code = url.searchParams.get('code');
    const isKioskPath = url.pathname === '/kiosk' || url.pathname.endsWith('/kiosk');
    return isKioskPath && code && /^\d{6}$/.test(code) ? code : null;
  } catch {
    return null;
  }
}

export function QrScanner({ onCode, disabled }: { onCode: (code: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const video = useRef<HTMLVideoElement>(null);
  const callback = useRef(onCode);
  callback.current = onCode;

  useEffect(() => {
    if (!open) return;
    let stopped = false;
    let controls: IScannerControls | undefined;
    const start = async () => {
      try {
        if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera scanning requires HTTPS or localhost.');
        }
        const { BrowserQRCodeReader } = await import('@zxing/browser');
        const reader = new BrowserQRCodeReader();
        controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: 'environment' } }, audio: false },
          video.current!,
          (result) => {
            if (!result || stopped) return;
            const code = codeFromQr(result.getText(), window.location.origin);
            if (!code) {
              setError('Scan a ZDrop code from this website.');
              return;
            }
            stopped = true;
            controls?.stop();
            setOpen(false);
            callback.current(code);
          }
        );
        if (stopped) controls.stop();
      } catch (e) {
        if (!stopped) setError(e instanceof Error ? e.message : 'Unable to access camera. Enter the code instead.');
      }
    };
    void start();
    return () => {
      stopped = true;
      controls?.stop();
    };
  }, [open]);

  return (
    <div style={{ marginTop: "18px" }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setError('');
          setOpen(!open);
        }}
        className="zd-button zd-button--secondary"
      >
        <Camera size={16} />
        <span>Scan Customer QR Code</span>
      </button>

      {open && (
        <div
          className="zd-kiosk-card"
          style={{ marginTop: "16px", padding: "20px", textAlign: "left" }}
        >
          <div className="flex justify-between items-center" style={{ marginBottom: "12px" }}>
            <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
              Point camera at customer screen
            </span>
            <button
              aria-label="Close scanner"
              className="zd-icon-button"
              style={{ width: "32px", height: "32px", borderRadius: "8px" }}
              onClick={() => setOpen(false)}
            >
              <X size={16} />
            </button>
          </div>
          <video
            ref={video}
            muted
            playsInline
            style={{ width: "100%", aspectRatio: "16/9", borderRadius: "10px", background: "#000", objectFit: "cover", border: "1px solid var(--line)" }}
          />
          {error && (
            <div role="alert" className="zd-alert-danger" style={{ marginTop: "12px", marginBottom: 0 }}>
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
