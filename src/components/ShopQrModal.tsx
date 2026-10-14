'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { ShopProfile } from '@/lib/types';
import { Printer, X, Download, ShieldCheck, Sparkles } from 'lucide-react';
import { ZDropLogo } from './ZDropLogo';

interface ShopQrModalProps {
  shop: ShopProfile;
  isOpen: boolean;
  onClose: () => void;
}

export function ShopQrModal({ shop, isOpen, onClose }: ShopQrModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://zdrop.app';
    const shopUrl = `${origin}/?shop=${encodeURIComponent(shop.shopCode)}`;

    QRCode.toDataURL(shopUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then(setQrDataUrl)
      .catch((err) => console.error('Failed to generate QR code:', err));
  }, [shop, isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="zd-auth-modal-overlay" role="dialog" aria-modal="true">
      <div className="zd-auth-modal-backdrop" onClick={onClose} />
      <div className="zd-auth-modal zd-shop-poster-modal">
        <div className="zd-auth-modal-header no-print">
          <div className="zd-auth-modal-badge">
            <Sparkles size={16} />
            <span>Counter Display Poster</span>
          </div>
          <button
            type="button"
            className="zd-icon-button zd-auth-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Printable Poster Container */}
        <div className="zd-shop-poster" id="printable-shop-poster">
          <div className="zd-poster-header">
            <div className="zd-poster-brand">
              <ZDropLogo size="lg" />
            </div>
            <div className="zd-poster-shop-name">{shop.shopName}</div>
            <div className="zd-poster-shop-location">{shop.campusAddress}</div>
          </div>

          <div className="zd-poster-qr-wrapper">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt={`QR Code for ${shop.shopName}`} className="zd-poster-qr" />
            ) : (
              <div className="zd-poster-qr-placeholder">Generating QR code…</div>
            )}
          </div>

          <div className="zd-poster-cta">
            <h3>Scan & Drop Your Documents</h3>
            <p>1. Scan QR with your phone</p>
            <p>2. Select files & print preferences</p>
            <p>3. Give your 6-digit code to the counter</p>
          </div>

          <div className="zd-poster-footer">
            <div className="zd-poster-perk">
              <ShieldCheck size={16} />
              <span>Zero phone numbers shared</span>
            </div>
            <div className="zd-poster-code-badge">
              Shop Code: <strong>{shop.shopCode}</strong>
            </div>
          </div>
        </div>

        <div className="zd-poster-actions no-print">
          <button
            type="button"
            onClick={handlePrint}
            className="zd-button zd-button--primary w-full"
          >
            <Printer size={18} />
            <span>Print Counter Standee (A4)</span>
          </button>
          {qrDataUrl && (
            <a
              href={qrDataUrl}
              download={`${shop.shopCode}-counter-qr.png`}
              className="zd-button zd-button--secondary w-full"
            >
              <Download size={18} />
              <span>Download QR Image</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
