import "server-only";
import { validateImageDimensions } from "./image-dimensions";
import path from "node:path";
import * as moduleRuntime from "node:module";
import { pathToFileURL } from "node:url";
import sharp from "sharp";
import { createCanvas } from "@napi-rs/canvas";

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
  validateImageDimensions(bytes, type);
  const ratio = quality === "print" ? 2 : 1;
  const output = await sharp(bytes, { failOn: "warning", limitInputPixels: 40_000_000 })
    .rotate()
    .resize(595 * ratio, 842 * ratio, { fit: "contain", background: "#ffffff" })
    .flatten({ background: "#ffffff" })
    .png().toBuffer();
  return { bytes: output, width: 595, height: 842 };
}
