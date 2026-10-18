import type { FileMetadata, PrintPreferences } from "./types";
import { parseSelectedPages } from "./page-ranges";

export const PRINT_CLEANUP_MS = 2 * 60 * 1000;
export const MAX_PRINT_PAGES = 100;

export function supportsRestrictedPrint(file: Pick<FileMetadata, "type">) {
  return ["application/pdf", "image/jpeg", "image/png"].includes(file.type);
}

export function printPages(
  files: FileMetadata[],
  preferences: PrintPreferences,
) {
  if (files.some((file) => !supportsRestrictedPrint(file))) {
    throw new Error(
      "Convert DOCX documents to PDF on the customer's device before using restricted printing.",
    );
  }
  const pages: { fileId: string; page: number; name: string }[] = [];
  const total = files.reduce((sum, file) => sum + (file.pageCount || (file.type.startsWith("image/") ? 1 : 0)), 0);
  const selected = new Set(parseSelectedPages(preferences.pageRange, total));
  let offset = 0;
  for (const file of files) {
    const count = file.pageCount || (file.type.startsWith("image/") ? 1 : 0);
    if (!count)
      throw new Error(
        "Page count unavailable. Upload this document again as a PDF.",
      );
    for (let page = 1; page <= count; page++) {
      const included = selected.has(offset + page);
      if (included) pages.push({ fileId: file.fileId, page, name: file.name });
      if (pages.length > MAX_PRINT_PAGES)
        throw new Error(
          `Restricted browser printing supports up to ${MAX_PRINT_PAGES} selected pages. Split this job into smaller PDFs.`,
        );
    }
    offset += count;
  }
  if (!pages.length)
    throw new Error("The page range does not include any pages in this job.");
  return pages;
}
