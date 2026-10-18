"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { SessionData } from "@/lib/types";
import { calculatePrintCost, generateUpiUrl } from "@/lib/pricing";
import { updateSessionPayment } from "@/lib/session-client";
import { CheckCircle2, Clock, Smartphone, Banknote, Receipt, Loader2 } from "lucide-react";

export function PaymentSettlementCard({ session, onPaymentUpdated }: { session: SessionData; onPaymentUpdated?: (session: SessionData) => void }) {
  const estimate = session.costEstimate || calculatePrintCost(session.files, session.preferences);
  const [qr, setQr] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const upiUrl = session.shopPricing?.currencySymbol === "₹" ? generateUpiUrl({ upiId: session.shopPricing.upiId || "", payeeName: session.shopName, amount: estimate.totalAmount, accessCode: session.accessCode }) : "";
  const paid = session.paymentStatus === "PAID_ONLINE" || session.paymentStatus === "PAID_COUNTER";
  const pending = session.paymentStatus === "PENDING_CONFIRMATION";
  useEffect(() => {
    let active = true;
    setQr("");
    if (upiUrl) QRCode.toDataURL(upiUrl, { width: 240, margin: 2 }).then(url => { if (active) setQr(url); }).catch(() => { if (active) setError("QR unavailable. Pay at the counter or use the UPI app link."); });
    return () => { active = false; };
  }, [upiUrl]);
  const reportPayment = async () => {
    setBusy(true); setError("");
    try { onPaymentUpdated?.(await updateSessionPayment(session.id, "PENDING_CONFIRMATION", "UPI")); }
    catch (failure) { setError((failure as Error).message); }
    finally { setBusy(false); }
  };
  return <div className="zd-payment-card">
    <div className="zd-payment-card-header">
      <div className="zd-payment-header-left"><Receipt size={18} /><div><h3 className="zd-payment-title">Print job estimate</h3><p className="zd-payment-subtitle">Confirm the page mix and final amount with the shop.</p></div></div>
      <span className={`zd-payment-status-pill ${paid ? "zd-payment-status-pill--paid" : "zd-payment-status-pill--pending"}`}>
        {paid ? <CheckCircle2 size={13} /> : <Clock size={13} />}
        {paid ? "Receipt confirmed by operator" : pending ? "Awaiting shop confirmation" : "Payment due"}
      </span>
    </div>
    <div className="zd-payment-amount-box"><span className="zd-payment-currency">{estimate.currencySymbol}</span><span className="zd-payment-amount">{estimate.totalAmount.toFixed(2)}</span><p className="zd-payment-formula-text">{estimate.formula}</p></div>
    {!paid && <div className="zd-payment-action-panel">
      {upiUrl ? <div className="zd-upi-container">
        {qr && <div className="zd-upi-qr-section"><img src={qr} alt={`Pay ${session.shopName || "the selected shop"} via UPI`} className="zd-upi-qr-image" /><p className="zd-upi-instruction">Pay directly to {session.shopPricing?.upiId}. Check the recipient in your UPI app.</p></div>}
        <div className="zd-upi-actions"><a href={upiUrl} className="zd-button zd-button--primary"><Smartphone size={16} />Open UPI app</a>
          <button type="button" onClick={reportPayment} disabled={busy || pending || !!session.printStartedAt} className="zd-button zd-button--secondary">{busy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}{pending ? "Waiting for the shop" : "I paid — ask shop to confirm"}</button>
          <p className="zd-payment-subtitle">ZDrop cannot verify bank transfers. The operator must check their account before confirming receipt.</p>
        </div>
      </div> : <div className="zd-counter-pay-box"><Banknote size={24} /><div><h4>Pay at the counter</h4><p>{session.shopName || "This counter"} has no INR UPI address configured in ZDrop. Ask the operator how to pay.</p></div></div>}
    </div>}
    {error && <p role="alert" className="zd-alert-danger">{error}</p>}
    {paid && <p className="zd-payment-verified-notice"><CheckCircle2 size={18} />The operator recorded receipt of your {session.paymentMethod === "UPI" ? "UPI transfer" : "counter payment"}.</p>}
  </div>;
}
