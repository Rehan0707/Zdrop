import { NextRequest } from "next/server";
import { z } from "zod";
import { printMode, stationAuthorized } from "@/lib/server/print-mode";
import { active, beginPrintSession, byCode, getFile, newToken, publicSession, purge, readSession, saveSession, withSessionLock } from "@/lib/server/store";
import { printPages, PRINT_CLEANUP_MS } from "@/lib/print-policy";
import { renderPage } from "@/lib/server/render-page";
import { rateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store, private", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" };
const reply = (data: unknown, status = 200) => Response.json(data, { status, headers });
const sessionId = z.string().regex(/^ses_[a-f0-9-]{36}$/);
const claim = z.string().min(64).max(100);
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("claim"), code: z.string().regex(/^\d{6}$/) }),
  z.object({ action: z.literal("page"), sessionId, claim, index: z.number().int().min(0).max(99) }),
  z.object({ action: z.literal("authorize-submit"), sessionId, claim }),
  z.object({ action: z.literal("finish"), sessionId, claim, outcome: z.enum(["SPOOLED", "CANCELLED", "FAILED"]) }),
]);

export async function POST(request: NextRequest) {
  try {
    if (printMode() !== "managed") return reply({ error: "Managed printing is disabled." }, 409);
    if (!stationAuthorized(request.headers.get("authorization"))) return reply({ error: "Station access required." }, 403);
    // Bound streamed bodies too; a caller-controlled Content-Length is insufficient.
    const reader = request.body?.getReader();
    if (!reader) return reply({ error: "Request body required." }, 400);
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      length += chunk.value.length;
      if (length > 2048) { await reader.cancel(); return reply({ error: "Request too large." }, 413); }
      chunks.push(chunk.value);
    }
    const input = schema.parse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    if (input.action === "claim" && !await rateLimit(request, "station-claim")) return reply({ error: "Too many code attempts." }, 429);
    const initial = input.action === "claim" ? await byCode(input.code) : await readSession(input.sessionId);
    if (!initial) return reply({ error: "Job unavailable." }, 404);
    return await withSessionLock(initial.id, async () => {
      const session = await readSession(initial.id);
      if (!session) return reply({ error: "Job unavailable." }, 404);
      if (input.action !== "claim" && session.stationClaimToken !== input.claim) return reply({ error: "Invalid station claim." }, 403);
      const live = await active(session);
      if (input.action === "finish") {
        if (!live) return reply({ session: publicSession(session) });
        if (input.outcome === "SPOOLED" && !session.stationSubmitAuthorized) return reply({ error: "Submission was not authorized." }, 409);
        session.printSubmission = input.outcome;
        session.printClosedAt = Date.now();
        await purge(session, "OPERATOR_PRINT");
        return reply({ session: publicSession(session) });
      }
      if (!live) return reply({ error: "Print access ended." }, 410);
      if (input.action === "authorize-submit") {
        if (session.stationSubmitAuthorized) return reply({ error: "Submission was already authorized. Do not replay." }, 409);
        if (session.stationDeliveredPages?.length !== printPages(session.files, session.preferences).length) return reply({ error: "Prepare every page before submission." }, 409);
        session.stationSubmitAuthorized = true;
        await saveSession(session);
        return reply({ expiresAt: session.expiresAt });
      }
      if (input.action === "claim") {
        if (session.printStartedAt || !["ACTIVE", "ACCESSED"].includes(session.status)) return reply({ error: "Job cannot be claimed again." }, 409);
        const pages = printPages(session.files, session.preferences);
        session.status = "ACCESSED";
        session.accessedAt ||= Date.now();
        session.printStartedAt = Date.now();
        session.expiresAt = Math.min(session.expiresAt, Date.now() + PRINT_CLEANUP_MS);
        session.stationClaimToken = newToken();
        session.stationDeliveredPages = [];
        await beginPrintSession(session);
        return reply({ sessionId: session.id, claim: session.stationClaimToken, expiresAt: session.expiresAt, pageCount: pages.length, preferences: { copies: session.preferences.copies, colorMode: session.preferences.colorMode, sides: session.preferences.sides } });
      }
      const page = printPages(session.files, session.preferences)[input.index];
      if (session.stationSubmitAuthorized) return reply({ error: "Page delivery ended." }, 410);
      if (!page) return reply({ error: "Unknown page." }, 400);
      if (session.stationDeliveredPages?.includes(input.index)) return reply({ error: "Page already delivered; this job cannot be replayed." }, 409);
      const file = session.files.find(file => file.fileId === page.fileId)!;
      const rendered = await renderPage(await getFile(session.id, page.fileId), file.type, page.page, "print");
      if (session.expiresAt <= Date.now()) { await active(session); return reply({ error: "Print access ended." }, 410); }
      session.stationDeliveredPages = [...(session.stationDeliveredPages || []), input.index];
      await saveSession(session);
      return new Response(new Uint8Array(rendered.bytes), { headers: { ...headers, "Content-Type": "image/png", "X-ZDrop-Page-Width": String(rendered.width), "X-ZDrop-Page-Height": String(rendered.height) } });
    });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) return reply({ error: "Invalid station request." }, 400);
    if (error instanceof Error && error.message === "Session busy") return reply({ error: "Session busy. Do not replay an uncertain submission." }, 409);
    console.error("Managed print request failed.");
    return reply({ error: "Station operation failed. Do not automatically resubmit; cleanup will retry at expiry." }, 503);
  }
}
