import assert from "node:assert/strict";
import { access, readFile, writeFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { printAtStation, stationClient } from "./station/client.mjs";
const base = process.env.ZDROP_TEST_URL || "http://localhost:3103";
const key = process.env.ZDROP_STATION_KEY;
const dataRoot = process.env.ZDROP_DATA_DIR || ".zdrop-data";
assert.ok(key?.length >= 32, "Use a disposable managed-mode server and station key.");
const pdf = await PDFDocument.create();
pdf.addPage([300, 400]).drawText("Station page one", { x: 20, y: 350, size: 15 });
pdf.addPage([300, 400]).drawText("Station page two", { x: 20, y: 350, size: 15 });
const bytes = Buffer.from(await pdf.save());
async function json(path, token, body, expected = 200, method = "POST") {
  const response = await fetch(base + path, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: method === "POST" ? JSON.stringify(body) : undefined });
  const data = await response.json();
  assert.equal(response.status, expected, JSON.stringify(data));
  return data;
}
const action = (name, token, body, status) => json("/api/sessions/" + name, token, body, status);
const station = (body, status = 200, token = key) => json("/api/print/station", token, body, status);
async function ready() {
  const owner = await action("create", null, { files: [{ fileName: "fixture.pdf", fileSize: bytes.length, mimeType: "application/pdf" }], preferences: { copies: 2, colorMode: "BW", sides: "DOUBLE", pageRange: "ALL" } }, 201);
  assert.equal(owner.session.printMode, "managed");
  const response = await fetch(base + `/api/sessions/upload?sessionId=${owner.session.id}&fileId=${owner.session.files[0].fileId}`, { method: "POST", headers: { Authorization: `Bearer ${owner.token}` }, body: bytes });
  assert.equal(response.status, 200);
  await action("confirm", owner.token, { sessionId: owner.session.id });
  return owner;
}
const owner = await ready();
const operator = await json("/api/sessions/resolve?code=" + owner.session.accessCode, null, null, 200, "GET");
await json("/api/print/page", operator.token, { sessionId: owner.session.id, fileId: owner.session.files[0].fileId, page: 1 }, 403);
await action("print-start", operator.token, { sessionId: owner.session.id }, 409);
await action("print-finish", operator.token, { sessionId: owner.session.id }, 409);
await station({ action: "claim", code: owner.session.accessCode }, 403, owner.token);
await station({ action: "claim", code: owner.session.accessCode }, 403, operator.token);
await station({ action: "claim", code: owner.session.accessCode }, 403, "wrong");
const concurrent = await Promise.all([0, 1].map(() => fetch(base + "/api/print/station", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "claim", code: owner.session.accessCode }) })));
assert.deepEqual(concurrent.map(r => r.status).sort(), [200, 409]);
const job = await concurrent.find(r => r.status === 200).json();
assert.equal(job.pageCount, 2);
const ref = { sessionId: job.sessionId, claim: job.claim };
const status = await json("/api/sessions/status?sessionId=" + job.sessionId, owner.token, null, 200, "GET");
assert.equal(status.session.stationClaimToken, undefined);
assert.equal(status.session.stationDeliveredPages, undefined);
assert.equal(status.session.stationSubmitAuthorized, undefined);
assert.ok(!JSON.stringify(status).includes(job.claim));
await station({ action: "page", ...ref, claim: "wrong".repeat(16), index: 0 }, 403);
await station({ action: "authorize-submit", ...ref }, 409);
await station({ action: "finish", ...ref, outcome: "SPOOLED" }, 409);
for (let index = 0; index < 2; index++) {
  const page = await fetch(base + "/api/print/station", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "page", ...ref, index }) });
  assert.equal(page.status, 200);
  assert.match(page.headers.get("cache-control"), /no-store/);
  assert.equal(page.headers.get("content-type"), "image/png");
  assert.deepEqual(Buffer.from(await page.arrayBuffer()).subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
}
await station({ action: "page", ...ref, index: 0 }, 409);
await station({ action: "authorize-submit", ...ref });
await station({ action: "authorize-submit", ...ref }, 409);
await station({ action: "page", ...ref, index: 0 }, 410);
const finished = await station({ action: "finish", ...ref, outcome: "SPOOLED" });
assert.equal(finished.session.status, "DELETED");
assert.equal(finished.session.printSubmission, "SPOOLED");
await station({ action: "finish", ...ref, outcome: "SPOOLED" });
await assert.rejects(access(`${dataRoot}/${job.sessionId}/${owner.session.files[0].fileId}`));
for (const outcome of ["CANCELLED", "FAILED"]) {
  const owner = await ready();
  const job = await station({ action: "claim", code: owner.session.accessCode });
  const response = await station({ action: "finish", sessionId: job.sessionId, claim: job.claim, outcome });
  assert.equal(response.session.status, "DELETED");
  assert.equal(response.session.printSubmission, outcome);
}
const revoked = await ready();
const revokedJob = await station({ action: "claim", code: revoked.session.accessCode });
await action("delete", revoked.token, { sessionId: revoked.session.id });
await station({ action: "authorize-submit", sessionId: revokedJob.sessionId, claim: revokedJob.claim }, 410);
const expired = await ready();
const expiredJob = await station({ action: "claim", code: expired.session.accessCode });
const path = `${dataRoot}/${expiredJob.sessionId}/session.json`;
const metadata = JSON.parse(await readFile(path, "utf8"));
metadata.expiresAt = Date.now() - 1;
await writeFile(path, JSON.stringify(metadata));
await station({ action: "authorize-submit", sessionId: expiredJob.sessionId, claim: expiredJob.claim }, 410);
await assert.rejects(access(`${dataRoot}/${expiredJob.sessionId}/${expired.session.files[0].fileId}`));
// Exercise the actual station client against real rendering/deletion, fake hardware only.
const endToEnd = await ready();
let submitted = 0;
await printAtStation({
  code: endToEnd.session.accessCode, printer: "Simulated",
  call: stationClient(base, key),
  cups: {
    inspect: async () => {},
    submit: async (printer, bytes, preferences) => {
      submitted++;
      const prepared = await PDFDocument.load(bytes);
      assert.equal(prepared.getPageCount(), 2);
      assert.deepEqual(prepared.getPage(0).getSize(), { width: 300, height: 400 });
      assert.deepEqual(preferences, { copies: 2, colorMode: "BW", sides: "DOUBLE" });
      return "Simulated-1";
    },
  },
});
assert.equal(submitted, 1);
await assert.rejects(access(`${dataRoot}/${endToEnd.session.id}/${endToEnd.session.files[0].fileId}`));
console.log("PASS: managed API rejects browser access, atomic claims, secret redaction, one-time pages/submission, expiry/revocation, idempotent purge and physical local-byte removal.");
