/**
 * Client-side document page counting utility.
 * Reads actual page count from PDF, Word (DOCX), and Image files directly in the browser.
 */

export async function getClientDocumentPageCount(file: File): Promise<number> {
  const type = file.type || "";
  const name = file.name.toLowerCase();

  // 1. Images are always 1 physical page
  if (type.startsWith("image/")) {
    return 1;
  }

  // 2. PDF Documents: Read full page tree via pdf-lib or binary header parser
  if (type.includes("pdf") || name.endsWith(".pdf")) {
    try {
      const { PDFDocument } = await import("pdf-lib");
      const buffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(buffer, { updateMetadata: false });
      const pages = pdf.getPageCount();
      if (typeof pages === "number" && pages > 0) {
        return pages;
      }
    } catch (err) {
      console.warn("Client pdf-lib reader fallback to regex parser:", err);
    }

    // Fast Regex parser fallback for PDFs
    try {
      const slice = file.slice(0, Math.min(file.size, 1024 * 1024));
      const text = await slice.text();

      // Look for /Count N in page tree
      const countMatch = text.match(/\/Count\s+(\d+)/);
      if (countMatch && countMatch[1]) {
        const count = parseInt(countMatch[1], 10);
        if (count > 0 && count < 10000) return count;
      }

      // Count /Type /Page objects (excluding /Type /Pages)
      const pageMatches = text.match(/\/Type\s*\/Page\b/g);
      if (pageMatches && pageMatches.length > 0) {
        return pageMatches.length;
      }
    } catch {
      // fallback
    }

    return 1;
  }

  // 3. Word Documents (DOCX): Read page count from docProps/app.xml
  if (type.includes("wordprocessing") || name.endsWith(".docx")) {
    try {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(await file.arrayBuffer());
      const appXml = await zip.file("docProps/app.xml")?.async("text");
      if (appXml) {
        const match = appXml.match(/<Pages>(\d+)<\/Pages>/i);
        if (match && match[1]) {
          const count = parseInt(match[1], 10);
          if (count > 0) return count;
        }
      }
    } catch {
      // fallback
    }

    return 1;
  }

  return 1;
}
