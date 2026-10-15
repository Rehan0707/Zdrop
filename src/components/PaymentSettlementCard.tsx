"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { SessionData } from "@/lib/types";
import { calculatePrintCost, generateUpiUrl } from "@/lib/pricing";
import { updateSessionPayment } from "@/lib/session-client";
import {
  CreditCard,
  QrCode,
  CheckCircle2,
  Clock,
  Sparkles,
  Smartphone,
  Banknote,
  Receipt,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface PaymentSettlementCardProps {
  session: SessionData;
  onPaymentUpdated?: (updatedSession: SessionData) => void;
}

export function PaymentSettlementCard({
  session,
  onPaymentUpdated,
}: PaymentSettlementCardProps) {
  const estimate =
    session.costEstimate ||
    calculatePrintCost(session.files, session.preferences);

  const [upiQrUrl, setUpiQrUrl] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<"UPI" | "COUNTER">("UPI");
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Fallback demo/merchant UPI handle if the shop hasn't configured a custom one
  const targetUpiId = "zdrop.prints@okaxis";
  const upiUrl = generateUpiUrl({
    upiId: targetUpiId,
    payeeName: session.shopName ? `${session.shopName} (ZDrop)` : "ZDrop Print Counter",
    amount: estimate.totalAmount,
    accessCode: session.accessCode,
  });

  useEffect(() => {
    if (!upiUrl) return;
    QRCode.toDataURL(upiUrl, {
      width: 240,
      margin: 2,
      color: {
        dark: "#141a13",
        light: "#ffffff",
      },
    })
      .then(setUpiQrUrl)
      .catch(() => {});
  }, [upiUrl]);

  const handleMarkPaid = async (method: "UPI" | "COUNTER") => {
    setIsProcessing(true);
    try {
      const status = method === "UPI" ? "PAID_ONLINE" : "PAID_COUNTER";
      const updated = await updateSessionPayment(session.id, status, method);
      onPaymentUpdated?.(updated);
    } catch (e) {
      console.error("Failed to update payment status:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const isPaid =
    session.paymentStatus === "PAID_ONLINE" ||
    session.paymentStatus === "PAID_COUNTER";

  return (
    <div className="zd-payment-card">
      <div className="zd-payment-card-header">
        <div className="zd-payment-header-left">
          <div className="zd-payment-icon-wrap">
            <Receipt size={18} />
          </div>
          <div>
            <h3 className="zd-payment-title">Print Job Total</h3>
            <p className="zd-payment-subtitle">
              Calculated automatically from your page count & preferences
            </p>
          </div>
        </div>

        {/* Payment Status Pill */}
        {isPaid ? (
          <span className="zd-payment-status-pill zd-payment-status-pill--paid">
            <CheckCircle2 size={13} />
            <span>
              {session.paymentStatus === "PAID_ONLINE"
                ? "Paid via UPI"
                : "Paid at Counter"}
            </span>
          </span>
        ) : (
          <span className="zd-payment-status-pill zd-payment-status-pill--pending">
            <Clock size={13} />
            <span>Unpaid • Payment Due</span>
          </span>
        )}
      </div>

      {/* Prominent Price & Itemized Math Display */}
      <div className="zd-payment-amount-box">
        <div className="zd-payment-amount-row">
          <div>
            <span className="zd-payment-currency">{estimate.currencySymbol}</span>
            <span className="zd-payment-amount">
              {estimate.totalAmount.toFixed(2)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="zd-payment-breakdown-toggle"
          >
            <span>Receipt breakdown</span>
            {showBreakdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        <p className="zd-payment-formula-text">{estimate.formula}</p>

        {showBreakdown && (
          <div className="zd-payment-itemized-list">
            <div className="zd-payment-item-row">
              <span>Selected Document Pages:</span>
              <strong>{estimate.totalPages / estimate.copies} pages</strong>
            </div>
            <div className="zd-payment-item-row">
              <span>Copies Requested:</span>
              <strong>{estimate.copies}</strong>
            </div>
            {session.preferences.colorMode === "AUTO" ? (
              <div className="zd-payment-item-row">
                <span>Estimated page mix (all copies):</span>
                <strong>{estimate.colorPages} color / {estimate.bwPages} B&amp;W</strong>
              </div>
            ) : (
              <div className="zd-payment-item-row">
                <span>Rate per Page ({session.preferences.colorMode}):</span>
                <strong>{estimate.currencySymbol}{estimate.ratePerPage.toFixed(2)}</strong>
              </div>
            )}
            {estimate.discount > 0 && (
              <div className="zd-payment-item-row zd-discount-text">
                <span>Duplex Paper Discount:</span>
                <strong>
                  -{estimate.currencySymbol}
                  {estimate.discount.toFixed(2)}
                </strong>
              </div>
            )}
            <div className="zd-payment-item-row zd-total-row">
              <span>Net Amount:</span>
              <strong>
                {estimate.currencySymbol}
                {estimate.totalAmount.toFixed(2)}
              </strong>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Payment Section if Unpaid */}
      {!isPaid ? (
        <div className="zd-payment-action-panel">
          {/* Method Selector Tabs */}
          <div className="zd-payment-tabs">
            <button
              type="button"
              className={`zd-payment-tab ${
                selectedMethod === "UPI" ? "active" : ""
              }`}
              onClick={() => setSelectedMethod("UPI")}
            >
              <Smartphone size={15} />
              <span>Instant UPI (Scan / Tap)</span>
            </button>
            <button
              type="button"
              className={`zd-payment-tab ${
                selectedMethod === "COUNTER" ? "active" : ""
              }`}
              onClick={() => setSelectedMethod("COUNTER")}
            >
              <Banknote size={15} />
              <span>Pay Cash at Counter</span>
            </button>
          </div>

          {selectedMethod === "UPI" ? (
            <div className="zd-upi-container">
              {/* Desktop / Tablet QR view */}
              {upiQrUrl && (
                <div className="zd-upi-qr-section">
                  <div className="zd-upi-qr-frame">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={upiQrUrl}
                      alt="Scan to Pay via UPI"
                      className="zd-upi-qr-image"
                    />
                  </div>
                  <p className="zd-upi-instruction">
                    Scan with any UPI App (GPay, PhonePe, Paytm, BHIM)
                  </p>
                </div>
              )}

              {/* Mobile Direct Tap Button */}
              <div className="zd-upi-actions">
                <a
                  href={upiUrl}
                  className="zd-button zd-button--primary zd-upi-app-btn"
                >
                  <Smartphone size={16} />
                  <span>
                    Pay {estimate.currencySymbol}
                    {estimate.totalAmount.toFixed(2)} via UPI App
                  </span>
                </a>

                <button
                  type="button"
                  onClick={() => handleMarkPaid("UPI")}
                  disabled={isProcessing}
                  className="zd-button zd-button--secondary zd-upi-confirm-btn"
                >
                  {isProcessing ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  <span>I Have Completed Payment</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="zd-counter-pay-box">
              <div className="zd-counter-pay-info">
                <Banknote size={24} className="text-emerald-600" />
                <div>
                  <h4>Pay Exactly {estimate.currencySymbol}{estimate.totalAmount.toFixed(2)}</h4>
                  <p>
                    Hand the exact amount to the operator when they share the six-digit code or ZDrop job QR.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="zd-payment-verified-notice">
          <CheckCircle2 size={18} className="text-emerald-600" />
          <span>
            Payment recorded. The shop operator will see your verified status
            on their counter terminal.
          </span>
        </div>
      )}
    </div>
  );
}
