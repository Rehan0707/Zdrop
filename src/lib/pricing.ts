import { FileMetadata, PrintPreferences, ShopPricing, CostEstimate } from "./types";

export const DEFAULT_PRICING: ShopPricing = {
  bwRate: 2,           // ₹2 per page for B&W
  colorRate: 10,       // ₹10 per page for Color
  duplexDiscount: 0,   // ₹0 discount per sheet for duplex
  currencySymbol: "₹",
  upiId: "",
};

/**
 * Parses a page range string (e.g. "1-5, 8, 10-12") against document total pages.
 */
export function parsePageRangeCount(pageRange: string, documentPages: number): number {
  if (!pageRange || pageRange.trim().toUpperCase() === "ALL") {
    return Math.max(1, documentPages);
  }

  const parts = pageRange.split(",");
  const uniquePages = new Set<number>();

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (trimmed.includes("-")) {
      const [startStr, endStr] = trimmed.split("-").map((s) => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end) && start > 0) {
        const from = Math.min(start, end);
        const to = Math.min(Math.max(start, end), documentPages > 0 ? documentPages : 9999);
        for (let p = from; p <= to; p++) {
          uniquePages.add(p);
        }
      }
    } else {
      const p = parseInt(trimmed, 10);
      if (!isNaN(p) && p > 0 && (documentPages <= 0 || p <= documentPages)) {
        uniquePages.add(p);
      }
    }
  }

  return uniquePages.size > 0 ? uniquePages.size : Math.max(1, documentPages);
}

/**
 * Calculates complete, accurate print cost and itemized breakdown.
 */
export function calculatePrintCost(
  files: FileMetadata[],
  preferences: PrintPreferences,
  customPricing?: Partial<ShopPricing> | null
): CostEstimate {
  const pricing: ShopPricing = {
    ...DEFAULT_PRICING,
    ...(customPricing || {}),
  };

  // 1. Calculate raw document page count across all files
  const rawDocPages = files.reduce((acc, file) => {
    return acc + (file.pageCount && file.pageCount > 0 ? file.pageCount : 1);
  }, 0);

  // 2. Adjust for custom page ranges
  const effectivePagesPerCopy = parsePageRangeCount(
    preferences.pageRange,
    rawDocPages > 0 ? rawDocPages : 1
  );

  // 3. Multiplied by number of copies
  const copies = Math.max(1, preferences.copies || 1);
  const totalPages = effectivePagesPerCopy * copies;

  // 4. Rate per page based on Color vs B&W
  const isColor = preferences.colorMode === "COLOR";
  const ratePerPage = isColor ? pricing.colorRate : pricing.bwRate;
  const subtotal = Math.round(totalPages * ratePerPage * 100) / 100;

  // 5. Duplex savings (if double-sided discount is configured)
  let discount = 0;
  if (preferences.sides === "DOUBLE" && pricing.duplexDiscount > 0) {
    const physicalSheets = Math.ceil(effectivePagesPerCopy / 2) * copies;
    discount = Math.min(subtotal - 1, physicalSheets * pricing.duplexDiscount);
    discount = Math.round(discount * 100) / 100;
  }

  const totalAmount = Math.max(1, Math.round((subtotal - discount) * 100) / 100);

  const sym = pricing.currencySymbol || "₹";
  const modeLabel = isColor ? "Color" : "B&W";
  const sidesLabel = preferences.sides === "DOUBLE" ? " · 2-Sided" : "";
  const formula = `${effectivePagesPerCopy} ${
    effectivePagesPerCopy === 1 ? "page" : "pages"
  } × ${copies} ${copies === 1 ? "copy" : "copies"} @ ${sym}${ratePerPage.toFixed(
    2
  )} (${modeLabel}${sidesLabel})`;

  return {
    totalPages,
    copies,
    ratePerPage,
    subtotal,
    discount,
    totalAmount,
    currencySymbol: sym,
    formula,
  };
}

/**
 * Generates an official UPI Payment URL (supported by GPay, PhonePe, Paytm, BHIM, etc.)
 */
export function generateUpiUrl({
  upiId,
  payeeName = "ZDrop Print",
  amount,
  accessCode,
  currency = "INR",
}: {
  upiId: string;
  payeeName?: string;
  amount: number;
  accessCode?: string;
  currency?: string;
}): string {
  const cleanUpi = upiId.trim();
  if (!cleanUpi) return "";

  const note = accessCode ? `ZDrop Print #${accessCode}` : "ZDrop Document Print";

  return `upi://pay?pa=${encodeURIComponent(cleanUpi)}&pn=${encodeURIComponent(
    payeeName
  )}&am=${amount.toFixed(2)}&cu=${encodeURIComponent(currency)}&tn=${encodeURIComponent(
    note
  )}`;
}
