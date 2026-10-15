"use client";

import type { SessionData } from "./types";
import { printPages } from "./print-policy";
import { renderSessionPage } from "./session-client";

export interface PrintPacket {
  frame: HTMLIFrameElement;
  dispose: () => void;
}

/** Only raster pages enter the browser; no original PDFs or cloud URLs. */
export async function preparePrintPacket(
  session: SessionData,
  signal: AbortSignal,
  progress: (value: string) => void,
): Promise<PrintPacket> {
  const pages = printPages(session.files, session.preferences);
  const frame = document.createElement("iframe");
  frame.title = "Temporary print pages";
  frame.className = "zd-restricted-print-frame";
  frame.setAttribute("aria-hidden", "true");
  const urls: string[] = [];
  const dispose = () => {
    frame.remove();
    urls.forEach((url) => URL.revokeObjectURL(url));
    urls.length = 0;
  };
  try {
    document.body.appendChild(frame);
    const content = frame.contentDocument;
    if (!content)
      throw new Error("Your browser could not create the print window.");
    content.open();
    content.write(
      '<!doctype html><html><head><title>ZDrop print job</title><meta name="referrer" content="no-referrer"></head><body></body></html>',
    );
    content.close();
    const style = content.createElement("style");
    style.textContent =
      "html,body{margin:0;padding:0;background:white}section{break-after:page;page-break-after:always}section:last-child{break-after:auto;page-break-after:auto}img{display:block;width:100%;height:100%;object-fit:contain} @media screen{body{visibility:hidden}}";
    content.head.appendChild(style);
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
      const sheet = content.createElement("section");
      const name = `sheet${index}`;
      style.textContent += `@page ${name}{size:${page.width}pt ${page.height}pt;margin:0}`;
      sheet.style.page = name;
      sheet.style.width = `${page.width}pt`;
      sheet.style.height = `${page.height}pt`;
      const image = content.createElement("img");
      image.alt = "Print page";
      image.draggable = false;
      image.src = url;
      sheet.appendChild(image);
      content.body.appendChild(sheet);
      await image.decode();
    }
    signal.throwIfAborted();
    return { frame, dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}

/** afterprint includes cancelling the dialog. It never proves physical output. */
export function runPrintPacket(packet: PrintPacket, closed: () => void) {
  const target = packet.frame.contentWindow;
  if (!target) throw new Error("Print window unavailable.");
  let ended = false;
  const complete = () => {
    if (ended) return;
    ended = true;
    target.removeEventListener("afterprint", complete);
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
    packet.dispose();
  };
}
