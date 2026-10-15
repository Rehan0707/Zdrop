import { NextRequest } from "next/server";
import { z } from "zod";
import { getFile, readSession } from "@/lib/server/store";
import { renderPage, RenderError } from "@/lib/server/render-page";
import { supportsRestrictedPrint } from "@/lib/print-policy";
import { printMode } from "@/lib/server/print-mode";

export const runtime = "nodejs";
const inputSchema = z.object({
  sessionId: z.string().regex(/^ses_[a-f0-9-]{36}$/),
  fileId: z.string().max(100),
  page: z.number().int().min(1).max(2000),
  quality: z.enum(["preview", "print"]).default("preview"),
});
const headers = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "Cross-Origin-Resource-Policy": "same-origin",
};
const fail = (message: string, status: number) =>
  Response.json({ error: message }, { status, headers });
export async function POST(request: NextRequest) {
  try {
    if (printMode() === "managed")
      return fail("Document pages are available only to the managed station.", 403);
    if (Number(request.headers.get("content-length")) > 2048)
      return fail("Request too large.", 413);
    const reader = request.body?.getReader();
    if (!reader) return fail("Request body required.", 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.length;
      if (size > 2048) {
        await reader.cancel();
        return fail("Request too large.", 413);
      }
      chunks.push(chunk.value);
    }
    let body: unknown;
    try {
      body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      return fail("Invalid request body.", 400);
    }
    const input = inputSchema.parse(body);
    const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
    const session = await readSession(input.sessionId);
    if (!token || !session || token !== session.operatorToken)
      return fail("Operator access required.", 403);
    if (
      session.purging ||
      session.printStartedAt ||
      session.expiresAt <= Date.now() ||
      session.status !== "ACCESSED"
    )
      return fail("Print access ended.", 410);
    const file = session.files.find((file) => file.fileId === input.fileId);
    if (!file) return fail("Unknown document.", 404);
    if (!supportsRestrictedPrint(file))
      return fail(
        "Convert DOCX to PDF on the customer's device before printing.",
        415,
      );
    if (input.page > (file.pageCount || 1)) return fail("Unknown page.", 400);
    const page = await renderPage(
      await getFile(session.id, file.fileId),
      file.type,
      input.page,
      input.quality,
    );
    const latest = await readSession(session.id);
    if (
      !latest ||
      latest.purging ||
      latest.printStartedAt ||
      latest.status !== "ACCESSED" ||
      latest.expiresAt <= Date.now() ||
      latest.operatorToken !== token
    )
      return fail("Print access ended.", 410);
    return new Response(new Uint8Array(page.bytes), {
      headers: {
        ...headers,
        "Content-Type": "image/png",
        "Content-Disposition": "inline",
        "X-ZDrop-Page-Width": String(page.width),
        "X-ZDrop-Page-Height": String(page.height),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof RenderError)
      return fail(error.message, 400);
    console.error("Restricted page rendering failed.");
    return fail(
      "Could not render this page. It may be unavailable or unsupported.",
      422,
    );
  }
}
