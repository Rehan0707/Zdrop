import { PDFDocument } from "pdf-lib";

export function stationClient(base, key, transport = fetch) {
  const url = new URL(base);
  if (url.username || url.password || url.search || url.hash || url.pathname !== "/") throw new Error("ZDROP_STATION_URL must contain only the application origin.");
  if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))) throw new Error("Station connections require HTTPS, except on loopback localhost.");
  if (typeof key !== "string" || key.length < 32 || key.length > 256) throw new Error("Configure a server-only station key of 32–256 characters.");
  return async (body, signal) => {
    const response = await transport(new URL("/api/print/station", url), {
      method: "POST", redirect: "error", cache: "no-store",
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(30_000)]) : AbortSignal.timeout(30_000),
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`Station request rejected (${response.status}). Do not automatically resubmit this job.`);
    return response;
  };
}

export async function printAtStation({ code, printer, cups, call, signal, progress = () => {} }) {
  if (!/^\d{6}$/.test(code)) throw new Error("Enter a six-digit job code.");
  // Fail before claiming/deleting a customer's job when no printer is installed.
  await cups.inspect(printer);
  signal?.throwIfAborted();
  const job = await (await call({ action: "claim", code }, signal)).json();
  let pdfBytes;
  let queueId;
  let outcome = "FAILED";
  let failure;
  try {
    if (!Number.isInteger(job.pageCount) || job.pageCount < 1 || job.pageCount > 100) throw new Error("Invalid station page count.");
    const pdf = await PDFDocument.create();
    let totalBytes = 0;
    let totalPixels = 0;
    for (let index = 0; index < job.pageCount; index++) {
      signal?.throwIfAborted();
      progress(`Preparing page ${index + 1} of ${job.pageCount}`);
      const response = await call({ action: "page", sessionId: job.sessionId, claim: job.claim, index }, signal);
      if (response.headers.get("content-type") !== "image/png") throw new Error("Invalid station page response.");
      const width = Number(response.headers.get("x-zdrop-page-width"));
      const height = Number(response.headers.get("x-zdrop-page-height"));
      if (![width, height].every(v => Number.isFinite(v) && v > 0 && v <= 20_000)) throw new Error("Invalid station page dimensions.");
      totalPixels += Math.min(8_000_000, Math.ceil(width * 2) * Math.ceil(height * 2));
      if (totalPixels > 64_000_000) { await response.body.cancel(); throw new Error("Station job exceeds the raster pixel budget. Split this job into smaller PDFs."); }
      const reader = response.body.getReader();
      const chunks = [];
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        totalBytes += chunk.value.length;
        if (totalBytes > 64 * 1024 * 1024) { await reader.cancel(); throw new Error("Station job exceeds the 64 MiB raster memory limit. Split this job."); }
        chunks.push(Buffer.from(chunk.value));
      }
      const raster = Buffer.concat(chunks);
      try {
        const image = await pdf.embedPng(raster);
        pdf.addPage([width, height]).drawImage(image, { x: 0, y: 0, width, height });
      } finally { raster.fill(0); chunks.forEach(chunk => chunk.fill(0)); }
    }
    pdfBytes = Buffer.from(await pdf.save());
    signal?.throwIfAborted();
    // Recheck revocation/expiry immediately before the irreversible local action.
    const permit = await (await call({ action: "authorize-submit", sessionId: job.sessionId, claim: job.claim }, signal)).json();
    signal?.throwIfAborted();
    if (Date.now() >= permit.expiresAt) throw new Error("Print window expired. Do not submit this job.");
    queueId = await cups.submit(printer, pdfBytes, job.preferences);
    outcome = "SPOOLED";
    if (signal?.aborted) { await cups.cancel(printer, queueId); outcome = "CANCELLED"; }
  } catch (error) {
    outcome = signal?.aborted ? "CANCELLED" : "FAILED";
    failure = error;
  } finally {
    pdfBytes?.fill(0);
    let deleted = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await (await call({ action: "finish", sessionId: job.sessionId, claim: job.claim, outcome })).json();
        deleted = ["DELETED", "EXPIRED"].includes(result.session?.status) && result.session?.files?.length === 0;
        if (deleted) break;
      } catch { /* Keep contents out of logs and retry the idempotent deletion only. */ }
    }
    if (!deleted) throw new Error("Stored-file deletion could not be confirmed. Access has ended; expiry cleanup must retry. Do not resubmit.");
  }
  if (failure) throw failure;
  return { queueId, outcome };
}
