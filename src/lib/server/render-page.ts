import "server-only";
import path from "node:path";
import * as moduleRuntime from "node:module";
import { pathToFileURL } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";

// Keep this native require out of webpack's createRequire rewriting.
const requireModule = Reflect.get(
  moduleRuntime,
  "createRequire",
)(path.join(process.cwd(), "package.json")) as NodeRequire;
const pdfRoot = path.dirname(requireModule.resolve("pdfjs-dist/package.json"));
const MAX_PIXELS = 8_000_000;

export class RenderError extends Error {}
function dimensions(width: number, height: number, scale: number) {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0 ||
    width > 20_000 ||
    height > 20_000
  ) {
    throw new RenderError("This page is too large to render safely.");
  }
  const bounded = Math.min(scale, Math.sqrt(MAX_PIXELS / (width * height)));
  return {
    width: Math.max(1, Math.ceil(width * bounded)),
    height: Math.max(1, Math.ceil(height * bounded)),
    scale: bounded,
  };
}

export async function renderPage(
  bytes: Buffer,
  type: string,
  pageNumber: number,
  quality: "preview" | "print",
) {
  if (type === "application/pdf") {
    // Let Node load the server-only ESM build without externalizing the customer's PDF.js worker bundle.
    const moduleUrl = pathToFileURL(
      requireModule.resolve("pdfjs-dist/legacy/build/pdf.mjs"),
    ).href;
    const { getDocument }: typeof import("pdfjs-dist/legacy/build/pdf.mjs") =
      await import(/* webpackIgnore: true */ moduleUrl);
    const loading = getDocument({
      data: new Uint8Array(bytes),
      isEvalSupported: false,
      verbosity: 0,
      useSystemFonts: false,
      standardFontDataUrl: path.join(pdfRoot, "standard_fonts") + path.sep,
      cMapUrl: path.join(pdfRoot, "cmaps") + path.sep,
      cMapPacked: true,
    });
    try {
      const document = await loading.promise;
      if (pageNumber > document.numPages)
        throw new RenderError("Unknown page.");
      const page = await document.getPage(pageNumber);
      const original = page.getViewport({ scale: 1 });
      const size = dimensions(
        original.width,
        original.height,
        quality === "print" ? 2 : 1,
      );
      const viewport = page.getViewport({ scale: size.scale });
      const canvas = createCanvas(size.width, size.height);
      try {
        await page.render({
          canvasContext: canvas.getContext(
            "2d",
          ) as unknown as CanvasRenderingContext2D,
          viewport,
          background: "white",
        }).promise;
        return {
          bytes: canvas.toBuffer("image/png"),
          width: original.width,
          height: original.height,
        };
      } finally {
        canvas.width = 1;
        canvas.height = 1;
        page.cleanup();
      }
    } finally {
      await loading.destroy();
    }
  }
  if (type !== "image/jpeg" && type !== "image/png")
    throw new RenderError("Convert this document to PDF before printing.");
  if (pageNumber !== 1) throw new RenderError("Unknown page.");
  // Inspect dimensions before decoding image pixels.
  let width = 0,
    height = 0;
  if (type === "image/png" && bytes.length >= 24) {
    width = bytes.readUInt32BE(16);
    height = bytes.readUInt32BE(20);
  } else if (type === "image/jpeg") {
    let offset = 2;
    while (offset + 8 < bytes.length) {
      if (bytes[offset++] !== 0xff) continue;
      const marker = bytes[offset++];
      if (marker === 0xda || marker === 0xd9) break;
      if (
        marker === 0x00 ||
        marker === 0x01 ||
        (marker >= 0xd0 && marker <= 0xd7)
      )
        continue;
      const length = bytes.readUInt16BE(offset);
      if (length < 2) break;
      if (
        [
          0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd,
          0xce, 0xcf,
        ].includes(marker)
      ) {
        height = bytes.readUInt16BE(offset + 3);
        width = bytes.readUInt16BE(offset + 5);
        break;
      }
      offset += length;
    }
  }
  dimensions(width, height, 1);
  if (width * height > 40_000_000)
    throw new RenderError("This image is too large to render safely.");
  const image = await loadImage(bytes);
  // Fit images onto an A4 sheet without stretching.
  const scale = Math.min(595 / image.width, 842 / image.height);
  const ratio = quality === "print" ? 2 : 1;
  const canvas = createCanvas(595 * ratio, 842 * ratio);
  const context = canvas.getContext("2d");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  const targetW = image.width * scale * ratio,
    targetH = image.height * scale * ratio;
  context.drawImage(
    image,
    (canvas.width - targetW) / 2,
    (canvas.height - targetH) / 2,
    targetW,
    targetH,
  );
  return { bytes: canvas.toBuffer("image/png"), width: 595, height: 842 };
}
