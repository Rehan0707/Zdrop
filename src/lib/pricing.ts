import { FileMetadata, PrintPreferences, ShopPricing, CostEstimate } from "./types";
import { parseSelectedPages, formatPageRanges } from "./page-ranges";

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
  return parseSelectedPages(pageRange, documentPages).length;
}

export function getColorPrintPlan(files: FileMetadata[], pageRange: string) {
  const totalPages = files.reduce((sum, file) => sum + Math.max(1, file.pageCount || 1), 0);
  const selectedPages = new Set(parseSelectedPages(pageRange, totalPages));
  let offset = 0;

  return files.map((file) => {
    const pageCount = Math.max(1, file.pageCount || 1);
    const detectedColorPages = file.colorPages === undefined ? null : new Set(file.colorPages);
    const colorPages: number[] = [];
    const bwPages: number[] = [];
    for (let page = 1; page <= pageCount; page++) {
      if (!selectedPages.has(offset + page)) continue;
      if (detectedColorPages === null || detectedColorPages.has(page)) colorPages.push(page);
      else bwPages.push(page);
    }
    offset += pageCount;
    return {
      fileId: file.fileId,
      name: file.name,
      colorRange: formatPageRanges(colorPages),
      bwRange: formatPageRanges(bwPages),
      needsReview: detectedColorPages === null,
    };
  });
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

  // Page ranges are expressed against the concatenated documents, matching the estimate.
  const selectedPages = parseSelectedPages(preferences.pageRange, rawDocPages || 1);
  const selectedSet = new Set(selectedPages);
  let documentOffset = 0;
  let colorPagesPerCopy = 0;
  let bwPagesPerCopy = 0;

  for (const file of files) {
    const pageCount = Math.max(1, file.pageCount || 1);
    const detectedColorPages = file.colorPages === undefined ? null : new Set(file.colorPages);
    for (let page = 1; page <= pageCount; page++) {
      if (!selectedSet.has(documentOffset + page)) continue;
      const isColor = preferences.colorMode === "COLOR" ||
        (preferences.colorMode === "AUTO" && (detectedColorPages === null || detectedColorPages.has(page)));
      if (isColor) colorPagesPerCopy++;
      else bwPagesPerCopy++;
    }
    documentOffset += pageCount;
  }

  const effectivePagesPerCopy = colorPagesPerCopy + bwPagesPerCopy;

  // Multiply page classes by the requested number of copies.
  const copies = Math.max(1, preferences.copies || 1);
  const totalPages = effectivePagesPerCopy * copies;
  const colorPages = colorPagesPerCopy * copies;
  const bwPages = bwPagesPerCopy * copies;
  const subtotal = Math.round((colorPages * pricing.colorRate + bwPages * pricing.bwRate) * 100) / 100;
  const ratePerPage = totalPages ? Math.round((subtotal / totalPages) * 100) / 100 : pricing.bwRate;

  // 5. Duplex savings (if double-sided discount is configured)
  let discount = 0;
  if (preferences.sides === "DOUBLE" && pricing.duplexDiscount > 0) {
    const physicalSheets = preferences.colorMode === "AUTO"
      ? (Math.ceil(colorPagesPerCopy / 2) + Math.ceil(bwPagesPerCopy / 2)) * copies
      : Math.ceil(effectivePagesPerCopy / 2) * copies;
    discount = Math.min(subtotal - 1, physicalSheets * pricing.duplexDiscount);
    discount = Math.round(discount * 100) / 100;
  }

  const totalAmount = Math.max(1, Math.round((subtotal - discount) * 100) / 100);

  const sym = pricing.currencySymbol || "₹";
  const sidesLabel = preferences.sides === "DOUBLE" ? " · 2-Sided" : "";
  const formula = preferences.colorMode === "AUTO"
    ? `${colorPagesPerCopy} color + ${bwPagesPerCopy} B&W ${effectivePagesPerCopy === 1 ? "page" : "pages"} × ${copies} ${copies === 1 ? "copy" : "copies"} (${sym}${pricing.colorRate.toFixed(2)} color / ${sym}${pricing.bwRate.toFixed(2)} B&W${sidesLabel})`
    : `${effectivePagesPerCopy} ${effectivePagesPerCopy === 1 ? "page" : "pages"} × ${copies} ${copies === 1 ? "copy" : "copies"} @ ${sym}${ratePerPage.toFixed(2)} (${preferences.colorMode === "COLOR" ? "Color" : "B&W"}${sidesLabel})`;

  return {
    totalPages,
    copies,
    colorPages,
    bwPages,
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
