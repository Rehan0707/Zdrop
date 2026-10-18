"use client";

import React, { useState, useEffect } from "react";
import { ShopProfile, ShopPricing } from "@/lib/types";
import { DEFAULT_PRICING } from "@/lib/pricing";
import {
  BadgePercent,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  DollarSign,
  Palette,
  Layers,
  Smartphone,
  Save,
} from "lucide-react";

interface ShopPricingModalProps {
  shop: ShopProfile;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (updatedPricing: ShopPricing) => void;
}

export function ShopPricingModal({
  shop,
  isOpen,
  onClose,
  onSaved,
}: ShopPricingModalProps) {
  const current = shop.pricing || DEFAULT_PRICING;

  const [bwRate, setBwRate] = useState<number>(current.bwRate || 2);
  const [colorRate, setColorRate] = useState<number>(current.colorRate || 10);
  const [duplexDiscount, setDuplexDiscount] = useState<number>(
    current.duplexDiscount || 0
  );
  const [currencySymbol, setCurrencySymbol] = useState<string>(
    current.currencySymbol || "₹"
  );
  const [upiId, setUpiId] = useState<string>(current.upiId || "");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const rates = shop.pricing || DEFAULT_PRICING;
    setBwRate(rates.bwRate); setColorRate(rates.colorRate); setDuplexDiscount(rates.duplexDiscount);
    setCurrencySymbol(rates.currencySymbol); setUpiId(rates.upiId || ""); setError(null); setSuccess(false);
  }, [isOpen, shop.id]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const payload: ShopPricing = {
        bwRate: Number(bwRate),
        colorRate: Number(colorRate),
        duplexDiscount: Number(duplexDiscount),
        currencySymbol: currencySymbol.trim() || "₹",
        upiId: upiId.trim(),
      };

      const res = await fetch("/api/shops/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: shop.id,
          pricing: payload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save pricing rates.");
      }

      setSuccess(true);
      onSaved?.(payload);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="zd-auth-modal-overlay" role="dialog" aria-modal="true">
      <div className="zd-auth-modal-backdrop" onClick={onClose} />
      <div className="zd-auth-modal" style={{ maxWidth: "480px" }}>
        {/* Header */}
        <div className="zd-auth-modal-header">
          <div className="zd-auth-modal-badge">
            <BadgePercent size={18} />
            <span>Pricing & UPI Counter Setup</span>
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

        <form onSubmit={handleSubmit} className="zd-pricing-modal-body">
          <p className="zd-pricing-modal-desc">
            Set custom per-page rates for <strong>{shop.shopName}</strong>.
            Customers selecting your shop will see these rates calculated
            automatically into their bills.
          </p>

          {error && (
            <div className="zd-alert-danger" style={{ marginBottom: "16px" }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="zd-alert-success" style={{ marginBottom: "16px" }}>
              <CheckCircle2 size={16} />
              <span>Rates updated successfully!</span>
            </div>
          )}

          <div className="zd-pricing-fields-grid">
            {/* Currency Symbol */}
            <div className="zd-field">
              <label htmlFor="currency-symbol">Currency Symbol</label>
              <input
                id="currency-symbol"
                className="zd-input"
                value={currencySymbol}
                maxLength={4}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                placeholder="₹"
                required
              />
            </div>

            {/* B&W Rate */}
            <div className="zd-field">
              <label htmlFor="bw-rate">
                <span>B&W Rate / Page</span>
              </label>
              <div className="zd-input-prefix-wrap">
                <span className="zd-input-prefix">{currencySymbol}</span>
                <input
                  id="bw-rate"
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="1000"
                  className="zd-input zd-input--prefixed"
                  value={bwRate}
                  onChange={(e) => setBwRate(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
            </div>

            {/* Color Rate */}
            <div className="zd-field">
              <label htmlFor="color-rate">
                <span>Color Rate / Page</span>
              </label>
              <div className="zd-input-prefix-wrap">
                <span className="zd-input-prefix">{currencySymbol}</span>
                <input
                  id="color-rate"
                  type="number"
                  step="0.5"
                  min="1"
                  max="1000"
                  className="zd-input zd-input--prefixed"
                  value={colorRate}
                  onChange={(e) => setColorRate(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
            </div>

            {/* Duplex Discount */}
            <div className="zd-field">
              <label htmlFor="duplex-discount">
                <span>2-Sided Discount / Sheet</span>
              </label>
              <div className="zd-input-prefix-wrap">
                <span className="zd-input-prefix">{currencySymbol}</span>
                <input
                  id="duplex-discount"
                  type="number"
                  step="0.25"
                  min="0"
                  max="100"
                  className="zd-input zd-input--prefixed"
                  value={duplexDiscount}
                  onChange={(e) =>
                    setDuplexDiscount(parseFloat(e.target.value) || 0)
                  }
                />
              </div>
            </div>
          </div>

          {/* UPI ID Setup */}
          <div className="zd-field" style={{ marginTop: "14px" }}>
            <label htmlFor="shop-upi-id">
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <Smartphone size={14} />
                Shop UPI VPA for Counter QR (Optional)
              </span>
            </label>
            <input
              id="shop-upi-id"
              className="zd-input"
              value={upiId}
              placeholder="e.g. myprintshop@okaxis or paytmqr@paytm"
              onChange={(e) => setUpiId(e.target.value)}
            />
            <small style={{ color: "var(--text-secondary)", fontSize: "11px", marginTop: "4px", display: "block" }}>
              Customers can scan and pay directly to this UPI address from their phone before printing.
            </small>
          </div>

          {/* Action buttons */}
          <div className="zd-pricing-modal-actions">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="zd-button zd-button--secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="zd-button zd-button--primary"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              <span>Save Rates & Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
