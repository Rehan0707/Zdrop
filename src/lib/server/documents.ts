import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import sharp from 'sharp';
import { validateImageDimensions } from './image-dimensions';
export class DocumentError extends Error {}
export async function inspectDocument(bytes: Uint8Array, type: string): Promise<number | undefined> {
  if (type === 'application/pdf') {
    try { const pdf = await PDFDocument.load(bytes, { updateMetadata: false }); const pages = pdf.getPageCount(); if (!pages) throw new Error(); return pages; }
    catch { throw new DocumentError('This PDF is invalid or password protected. Upload an unlocked PDF.'); }
  }
  if (type.includes('wordprocessing')) {
    try { const zip = await JSZip.loadAsync(bytes); if (!zip.file('[Content_Types].xml') || !zip.file('word/document.xml')) throw new Error(); return undefined; }
    catch { throw new DocumentError('This file is not a valid DOCX document.'); }
  }
  const valid = type === 'image/png' ? bytes.length >= 24 && Buffer.from(bytes.slice(0, 8)).equals(Buffer.from([137,80,78,71,13,10,26,10])) : type === 'image/jpeg' && bytes.length > 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[bytes.length - 2] === 255 && bytes[bytes.length - 1] === 217;
  if (!valid) throw new DocumentError('The image is invalid or does not match its format.');
  try {
    const buffer = Buffer.from(bytes);
    validateImageDimensions(buffer, type);
    await sharp(buffer, { failOn: 'warning', limitInputPixels: 40_000_000 }).stats();
  } catch { throw new DocumentError('This image cannot be decoded safely. Use a valid JPG or PNG up to 40 megapixels.'); }
  return 1;
}
