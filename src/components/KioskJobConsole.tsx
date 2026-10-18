"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Printer,
  FileText,
  ArrowLeft,
  Palette,
  Layers,
  FileSpreadsheet,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Lock,
  X,
  Receipt,
  CheckCircle2,
  Clock,
  Banknote,
} from "lucide-react";
import { ConfirmDialog } from "./ConfirmDialog";
import { SessionData } from "@/lib/types";
import { formatBytes } from "@/lib/utils";
import { SecureDocumentPreview } from "./SecureDocumentPreview";
import { useScreenshotProtection } from "@/lib/useScreenshotProtection";
import { calculatePrintCost, getColorPrintPlan } from "@/lib/pricing";
import { updateSessionPayment, startPrintSession } from "@/lib/session-client";
import { preparePrintPacket, runPrintPacket } from "@/lib/restricted-print";
import { printPages } from "@/lib/print-policy";

interface KioskJobConsoleProps {
  session: SessionData;
  onPrint: () => void;
  onCompleteAndPurge: () => Promise<void>;
  onCancel: () => void;
  isPurging?: boolean;
}

export function KioskJobConsole({
  session,
  onPrint,
  onCompleteAndPurge,
  onCancel,
  isPurging = false,
}: KioskJobConsoleProps) {
  const [selectedFileId, setSelectedFileId] = useState(
    session.files[0]?.fileId,
  );
  const selectedFile =
    session.files.find((file) => file.fileId === selectedFileId) ||
    session.files[0];
  const [confirmPrint, setConfirmPrint] = useState(false);
  const closePrintDialog = useCallback(() => setConfirmPrint(false), []);
  const [phase, setPhase] = useState<
    "idle" | "preparing" | "printing" | "deleting" | "failed"
  >("idle");
  const [printMessage, setPrintMessage] = useState("");
  const abortPrint = useRef<AbortController | null>(null);
  const stopPacket = useRef<(() => void) | null>(null);
  const cleanup = useRef(onCompleteAndPurge);
  cleanup.current = onCompleteAndPurge;
  const mounted = useRef(true);
  const finishing = useRef(false);
  const managed = session.printMode === "managed";
  const busy = isPurging || phase !== "idle" || !!session.printStartedAt;
  let printProblem = "";
  try {
    printPages(session.files, session.preferences);
  } catch (error) {
    printProblem = (error as Error).message;
  }
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      abortPrint.current?.abort();
      stopPacket.current?.();
    };
  }, []);
  const [paymentStatus, setPaymentStatus] = useState(
    session.paymentStatus || "UNPAID",
  );
  const [paymentError, setPaymentError] = useState("");
  useEffect(() => { setPaymentStatus(session.paymentStatus || "UNPAID"); }, [session.paymentStatus]);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const { preferences } = session;

  const estimate =
    session.costEstimate ||
    calculatePrintCost(session.files, session.preferences);
  const colorPrintPlan =
    preferences.colorMode === "AUTO"
      ? getColorPrintPlan(session.files, preferences.pageRange)
      : [];

  const handleMarkPayment = async (status: "PAID_COUNTER" | "PAID_ONLINE" | "UNPAID") => {
    setIsUpdatingPayment(true);
    setPaymentError("");
    try {
      await updateSessionPayment(session.id, status, status === "PAID_ONLINE" ? "UPI" : "CASH");
      setPaymentStatus(status);
    } catch (e) {
      setPaymentError((e as Error).message);
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  // Anti-Screenshot and Anti-Download Hook
  const { isShielded, securityAlert, clearAlert, unshieldManually } =
    useScreenshotProtection({ enabled: true });

  const finishAutomatically = async () => {
    if (finishing.current) return;
    finishing.current = true;
    if (mounted.current) {
      setPhase("deleting");
      setPrintMessage("Print window ended. Deleting ZDrop’s stored files…");
    }
    let error: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await cleanup.current();
        return;
      } catch (failure) {
        error = failure;
        if (!mounted.current) return;
        if (attempt < 2)
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (attempt + 1)),
          );
      }
    }
    finishing.current = false;
    if (mounted.current) {
      setPhase("failed");
      setPrintMessage(
        `Deletion could not be confirmed: ${(error as Error).message}. Access is blocked; cleanup will retry at expiry.`,
      );
    }
  };

  const handlePrintClick = async () => {
    if (managed || busy || printProblem) return;
    setConfirmPrint(false);
    setPhase("preparing");
    setPrintMessage("Preparing one-time print pages…");
    const controller = new AbortController();
    abortPrint.current = controller;
    let started = false;
    let packet: Awaited<ReturnType<typeof preparePrintPacket>> | undefined;
    try {
      packet = await preparePrintPacket(
        session,
        controller.signal,
        (message) => {
          if (mounted.current) setPrintMessage(message);
        },
      );
      await startPrintSession(session.id);
      started = true;
      if (!mounted.current) {
        packet.dispose();
        await cleanup.current();
        return;
      }
      onPrint();
      setPhase("printing");
      setPrintMessage(
        "Use the printer dialog. ZDrop files are deleted when it closes, including cancellation.",
      );
      stopPacket.current = runPrintPacket(packet, () => {
        void finishAutomatically();
      });
    } catch (error) {
      packet?.dispose();
      if (started) {
        void finishAutomatically();
      } else if (mounted.current && !controller.signal.aborted) {
        setPhase("idle");
        setPrintMessage((error as Error).message);
      }
    }
  };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "p") {
        event.preventDefault();
        if (!managed && !busy && !printProblem) setConfirmPrint(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [managed, busy, printProblem]);

  return (
    <div
      className="zd-console-card zd-secure-surface"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Screenshot / Screen Capture Blocked Toast Alert */}
      {securityAlert && (
        <div className="zd-screenshot-alert-toast" role="alert">
          <div className="zd-screenshot-alert-icon">
            <ShieldAlert size={20} />
          </div>
          <div className="zd-screenshot-alert-text">
            <strong>Security Restriction Active</strong>
            <p>{securityAlert}</p>
          </div>
          <button
            type="button"
            onClick={clearAlert}
            className="zd-screenshot-alert-close"
            aria-label="Dismiss security alert"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Console Top Header */}
      <div className="zd-console-header">
        <div className="zd-console-header-left">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="zd-icon-button"
            aria-label="Back to code entry"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="zd-console-code-title">
              <span>Session Code:</span>
              <span className="zd-console-code">{session.accessCode}</span>
            </div>
            <p className="zd-console-meta">
              {session.files.length} document
              {session.files.length > 1 ? "s" : ""} attached (
              {formatBytes(session.totalSizeBytes)})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="zd-console-status-pill zd-console-status-pill--secure">
            <ShieldCheck size={14} />
            <span>Temporary print access</span>
          </span>
        </div>
      </div>

      <div className="zd-console-body">
        {/* Anti-Download & Anti-Screenshot Policy Strip */}
        <div className="zd-security-policy-banner">
          <div className="zd-security-policy-icon">
            <Lock size={18} />
          </div>
          <div className="zd-security-policy-text">
            <strong>Temporary document access:</strong>
            <span>
              {" "}
              {managed ? "Managed station required. Document pages and browser printing are disabled here. Enter the code at the trusted print station to submit directly to its configured printer." : "Original downloads are disabled. Only rendered pages reach this browser. Files are deleted after the print dialog closes, including Cancel. System capture and print-to-file remain possible."}
            </span>
          </div>
        </div>

        {/* Print Preferences Summary Cards */}
        <div>
          <h4 className="zd-console-section-title">
            Customer Print Configuration
          </h4>
          <div className="zd-console-pref-grid">
            {/* Copies */}
            <div className="zd-console-pref-card">
              <div className="zd-console-pref-card-label">
                <Printer size={15} />
                <span>Copies</span>
              </div>
              <p className="zd-console-pref-card-val">
                {preferences.copies} {preferences.copies === 1 ? "Set" : "Sets"}
              </p>
            </div>

            {/* Color Mode */}
            <div className="zd-console-pref-card">
              <div className="zd-console-pref-card-label">
                <Palette size={15} />
                <span>Color Mode</span>
              </div>
              <p className="zd-console-pref-card-val">
                {preferences.colorMode === "AUTO"
                  ? "Smart page mix"
                  : preferences.colorMode === "BW"
                    ? "Black & White"
                    : "Full Color"}
              </p>
            </div>

            {/* Sides */}
            <div className="zd-console-pref-card">
              <div className="zd-console-pref-card-label">
                <Layers size={15} />
                <span>Print Sides</span>
              </div>
              <p className="zd-console-pref-card-val">
                {preferences.sides === "DOUBLE"
                  ? "Double-Sided"
                  : "Single-Sided"}
              </p>
            </div>

            {/* Pages */}
            <div className="zd-console-pref-card">
              <div className="zd-console-pref-card-label">
                <FileSpreadsheet size={15} />
                <span>Page Selection</span>
              </div>
              <p
                className="zd-console-pref-card-val"
                style={{ fontSize: "16px" }}
              >
                {preferences.pageRange === "ALL"
                  ? "All Pages"
                  : `Pages: ${preferences.pageRange}`}
              </p>
            </div>
          </div>

          {preferences.colorMode === "AUTO" && (
            <div className="zd-card-panel" style={{ marginBottom: "20px" }}>
              <strong style={{ display: "block", marginBottom: "8px" }}>
                Suggested color print ranges
              </strong>
              {colorPrintPlan.map((plan) => (
                <p
                  key={plan.fileId}
                  style={{
                    margin: "6px 0",
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                  }}
                >
                  <strong style={{ color: "var(--text-primary)" }}>
                    {plan.name}:
                  </strong>{" "}
                  Color {plan.colorRange}; B&amp;W {plan.bwRange}
                  {plan.needsReview
                    ? " · color analysis unavailable; estimated as color, please check manually"
                    : ""}
                </p>
              ))}
              <p
                style={{
                  margin: "10px 0 0",
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                }}
              >
                Review these advisory ranges before printing. All pages enter
                {managed ? "one station job with the configured printer's automatic color setting." : "one print dialog; choose automatic color detection if your printer supports it. ZDrop cannot apply different driver settings to individual pages."}
              </p>
            </div>
          )}

          {preferences.customerNotes && (
            <div
              className="zd-alert-danger"
              style={{
                background: "var(--surface-soft)",
                borderColor: "var(--line)",
                color: "var(--text-primary)",
                marginBottom: "20px",
              }}
            >
              <AlertCircle size={16} />
              <div>
                <strong>Special Customer Request: </strong>
                <span>{preferences.customerNotes}</span>
              </div>
            </div>
          )}

          {paymentError && <p role="alert" className="zd-alert-danger">{paymentError}</p>}
          {paymentStatus === "PENDING_CONFIRMATION" && <p role="status" className="zd-alert">Customer reports a UPI transfer. Check your bank account before confirming receipt.</p>}
          {/* Billing & Settlement Ledger Card */}
          <div className="zd-kiosk-billing-card">
            <div className="zd-kiosk-billing-header">
              <div className="zd-kiosk-billing-title">
                <Receipt size={17} />
                <span>Counter Billing & Settlement</span>
              </div>
              {paymentStatus === "PAID_ONLINE" ? (
                <span className="zd-payment-status-pill zd-payment-status-pill--paid">
                  <CheckCircle2 size={13} />
                  <span>UPI received · operator confirmed</span>
                </span>
              ) : paymentStatus === "PAID_COUNTER" ? (
                <span className="zd-payment-status-pill zd-payment-status-pill--paid">
                  <CheckCircle2 size={13} />
                  <span>Cash Collected at Counter</span>
                </span>
              ) : (
                <span className="zd-payment-status-pill zd-payment-status-pill--pending">
                  <Clock size={13} />
                  <span>
                    Payment Due: {estimate.currencySymbol}
                    {estimate.totalAmount.toFixed(2)}
                  </span>
                </span>
              )}
            </div>

            <div className="zd-kiosk-billing-body">
              <div className="zd-kiosk-billing-amount-wrap">
                <div className="flex items-baseline gap-1">
                  <span className="zd-kiosk-billing-currency">
                    {estimate.currencySymbol}
                  </span>
                  <span className="zd-kiosk-billing-amount">
                    {estimate.totalAmount.toFixed(2)}
                  </span>
                </div>
                <span className="zd-kiosk-billing-calc">
                  {estimate.formula}
                </span>
              </div>

              <div className="zd-kiosk-billing-actions">
                {paymentStatus === "PAID_ONLINE" || paymentStatus === "PAID_COUNTER" ? (
                    <button
                      type="button"
                      onClick={() => handleMarkPayment("UNPAID")}
                      disabled={isUpdatingPayment || busy}
                      className="zd-button zd-button--secondary"
                      style={{
                        fontSize: "12px",
                        minHeight: "36px",
                        padding: "6px 14px",
                      }}
                    >
                      <span>Mark as Unpaid</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleMarkPayment("PAID_COUNTER")}
                      disabled={isUpdatingPayment || busy}
                      className="zd-button zd-button--primary"
                      style={{
                        fontSize: "12px",
                        minHeight: "36px",
                        padding: "6px 16px",
                        background: "#059669",
                      }}
                    >
                      <CheckCircle2 size={15} />
                      <span>
                        Mark Cash Collected ({estimate.currencySymbol}
                        {estimate.totalAmount.toFixed(2)})
                      </span>
                    </button>
                  )}
                {paymentStatus !== "PAID_ONLINE" && paymentStatus !== "PAID_COUNTER" && session.shopPricing?.upiId && <button type="button" onClick={() => handleMarkPayment("PAID_ONLINE")} disabled={isUpdatingPayment || busy} className="zd-button zd-button--secondary">Confirm UPI received</button>}
              </div>
            </div>
          </div>
        </div>

        {/* Document Selection Tabs & Preview */}
        <div style={{ marginBottom: "20px" }}>
          <h4 className="zd-console-section-title">
            Documents ({session.files.length})
          </h4>

          {/* File selector pills */}
          <div className="zd-console-file-tabs">
            {session.files.map((file) => {
              const isSelected = selectedFile?.fileId === file.fileId;
              return (
                <button
                  key={file.fileId}
                  type="button"
                  onClick={() => setSelectedFileId(file.fileId)}
                  disabled={busy}
                  className={`zd-console-file-tab ${isSelected ? "zd-console-file-tab--active" : ""}`}
                >
                  <FileText size={15} />
                  <span
                    style={{
                      maxWidth: "180px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {file.name}
                  </span>
                  <span
                    style={{
                      font: "11px var(--font-jetbrains), monospace",
                      opacity: 0.7,
                    }}
                  >
                    (
                    {file.pageCount
                      ? `${file.pageCount} ${file.pageCount === 1 ? "page" : "pages"} · `
                      : ""}
                    {formatBytes(file.size)})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Rendered document preview; no branding is added to document pages. */}
          {managed ? (
            <div className="zd-secure-placeholder" role="status">
              <Lock size={28} />
              <h3>Print at the managed station</h3>
              <p>Give the station this code: <strong>{session.accessCode}</strong>. Document pages stay out of this browser. After submission, ZDrop automatically deletes its stored copy. A queued job does not confirm paper output.</p>
            </div>
          ) : selectedFile && (
            <SecureDocumentPreview
              file={selectedFile}
              sessionId={session.id}
              isShielded={isShielded}
              onUnshield={unshieldManually}
              disabled={busy}
            />
          )}
        </div>

        {!managed && <>
        {/* Restricted Mode Information Indicator (Replaces old 'Open in new window' download link) */}
        <div className="zd-secure-preview-notice">
          <ShieldCheck size={14} />
          <span>
            Browser preview only • System screenshots, print-to-file, and
            printer-spool copies cannot be blocked by this page.
          </span>
        </div>

        <p
          style={{
            fontSize: "12px",
            color: "var(--text-secondary)",
            lineHeight: 1.5,
            margin: "14px 0 16px",
          }}
        >
          All selected pages from every PDF or image are prepared in one print
          job. Apply copies, color and sides in the printer dialog. Closing or
          cancelling it ends this job; a two-minute server deadline is the
          fallback. Turn off browser headers and footers for clean pages.
        </p>

        {printProblem && (
          <p role="alert" className="zd-alert-danger">
            {printProblem}
          </p>
        )}
        {(printMessage || session.printStartedAt) && (
          <p role="status" className="zd-print-progress">
            {printMessage ||
              "One-time print access has started in another window. Further page access is blocked; automatic cleanup is due within two minutes."}
          </p>
        )}
        <ConfirmDialog
          isOpen={confirmPrint}
          title="Print once, then auto-delete?"
          message="Every selected page from this job will enter one printer dialog. Closing it—including Cancel—permanently deletes ZDrop’s stored files. Check the printer and payment first. This does not verify physical printing or prevent Save as PDF."
          confirmLabel="Print & auto-delete"
          onConfirm={() => {
            void handlePrintClick();
          }}
          onCancel={closePrintDialog}
        />
        </>}

        {/* Action Hub */}
        <div className="zd-console-actions">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="zd-button zd-button--secondary"
          >
            Close Terminal
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => setConfirmPrint(true)}
              disabled={managed || busy || !!printProblem}
              className="zd-button zd-button--primary"
            >
              <Printer size={16} />
              <span>{managed ? "Use managed station" : "Print job & auto-delete"}</span>
            </button>

            {phase === "failed" && (
              <button
                type="button"
                onClick={() => {
                  void finishAutomatically();
                }}
                disabled={isPurging}
                className="zd-button zd-button--secondary"
              >
                Retry automatic cleanup
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
