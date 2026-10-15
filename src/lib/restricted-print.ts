"use client";

import type { SessionData } from "./types";
import { printPages } from "./print-policy";
import { renderSessionPage } from "./session-client";

export interface PrintPacket {
  container: HTMLDivElement;
  dispose: () => void;
}

/** Only raster pages enter the browser; no original PDFs or cloud URLs. */
export async function preparePrintPacket(
  session: SessionData,
  signal: AbortSignal,
  progress: (value: string) => void,
): Promise<PrintPacket> {
  const pages = printPages(session.files, session.preferences);
  if (document.getElementById("zdrop-document-print"))
    throw new Error("Another print job is already being prepared.");
  const container = document.createElement("div");
  container.id = "zdrop-document-print";
  container.setAttribute("aria-hidden", "true");
  const urls: string[] = [];
  const dispose = () => {
    container.remove();
    delete document.body.dataset.zdropDocumentPrint;
    urls.forEach((url) => URL.revokeObjectURL(url));
    urls.length = 0;
  };
  try {
    // Print a dedicated top-level surface: Safari can otherwise print the
    // surrounding dashboard when asked to print an off-screen iframe.
    document.body.appendChild(container);
    const style = document.createElement("style");
    container.appendChild(style);
    for (let index = 0; index < pages.length; index++) {
      signal.throwIfAborted();
      progress(`Preparing print pages ${index + 1} of ${pages.length}…`);
      const page = await renderSessionPage(
        session.id,
        pages[index].fileId,
        pages[index].page,
        "print",
        signal,
      );
      const url = URL.createObjectURL(page.blob);
      urls.push(url);
      const sheet = document.createElement("section");
      const name = `zdDocumentSheet${index}`;
      style.textContent += `@page ${name}{size:${page.width}pt ${page.height}pt;margin:0}`;
      sheet.style.page = name;
      sheet.style.width = `${page.width}pt`;
      sheet.style.height = `${page.height}pt`;
      const image = document.createElement("img");
      image.alt = "Print page";
      image.draggable = false;
      image.src = url;
      sheet.appendChild(image);
      container.appendChild(sheet);
      await image.decode();
    }
    signal.throwIfAborted();
    return { container, dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}

/** afterprint includes cancelling the dialog. It never proves physical output. */
export function runPrintPacket(packet: PrintPacket, closed: () => void) {
  if (!packet.container.isConnected)
    throw new Error("Print pages are no longer available.");
  const target = window;
  const originalTitle = document.title;
  document.title = "";
  document.body.dataset.zdropDocumentPrint = "active";
  let ended = false;
  const complete = () => {
    if (ended) return;
    ended = true;
    target.removeEventListener("afterprint", complete);
    document.title = originalTitle;
    // Blank/remove page buffers before the asynchronous server purge.
    packet.dispose();
    closed();
  };
  target.addEventListener("afterprint", complete, { once: true });
  try {
    target.focus();
    target.print();
  } catch (error) {
    complete();
    throw error;
  }
  return () => {
    target.removeEventListener("afterprint", complete);
    document.title = originalTitle;
    packet.dispose();
  };
}
