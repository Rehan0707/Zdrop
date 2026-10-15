import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import { createCanvas } from "@napi-rs/canvas";
import { createCups } from "./station/cups.mjs";
import { printAtStation, stationClient } from "./station/client.mjs";

const commands = [];
const cups = createCups(async (binary, args, input) => {
  commands.push({ binary, args, input });
  if (binary.endsWith("lpstat")) return "device for Shop: ipp://printer.local/ipp/print\n";
  return "request id is Shop-42 (1 file(s))\n";
});
await cups.inspect("Shop");
for (const colorMode of ["BW", "COLOR", "AUTO"]) {
  for (const sides of ["SINGLE", "DOUBLE"]) {
    assert.equal(await cups.submit("Shop", Buffer.from("fixture"), { copies: 2, colorMode, sides }), "Shop-42");
    const sent = commands.at(-1);
    assert.equal(sent.binary, "/usr/bin/lp");
    assert.ok(sent.args.includes("2"));
    assert.ok(sent.args.includes(`sides=${sides === "DOUBLE" ? "two-sided-long-edge" : "one-sided"}`));
    assert.ok(sent.args.includes(`print-color-mode=${({ BW: "monochrome", COLOR: "color", AUTO: "auto" })[colorMode]}`));
    assert.ok(!sent.args.includes("fixture"));
    assert.equal(sent.input.toString(), "fixture");
  }
}
await cups.cancel("Shop", "Shop-42");
assert.deepEqual(commands.at(-1).args, ["-h", "localhost", "-x", "Shop-42"]);
await assert.rejects(cups.cancel("Shop", "Other-42"));
await assert.rejects(cups.inspect("Shop; touch /tmp/injection"));
await assert.rejects(createCups(async () => "device for Shop: file:/tmp/copy.pdf").inspect("Shop"));
await assert.rejects(cups.submit("Shop", Buffer.alloc(0), { copies: 100, colorMode: "BW", sides: "DOUBLE" }));
assert.throws(() => stationClient("http://shop.lan", "x".repeat(40)), /HTTPS/);
assert.throws(() => stationClient("https://host.test/?key=private", "x".repeat(40)));
assert.throws(() => stationClient("https://host.test", "short"));
const secureCall = stationClient("https://host.test", "x".repeat(40), async (url, options) => {
  assert.equal(url.pathname, "/api/print/station");
  assert.equal(url.search, "");
  assert.equal(options.redirect, "error");
  assert.equal(options.headers.Authorization, "Bearer " + "x".repeat(40));
  return Response.json({});
});
await secureCall({ action: "claim", code: "123456" });

const png = createCanvas(20, 20).toBuffer("image/png");
async function simulate({ failPage = false, failFinish = false, abort = false, revoke = false, noPrinter = false } = {}) {
  const events = [];
  let printed = 0;
  let streamed;
  const controller = new AbortController();
  const promise = printAtStation({
    code: "123456", printer: "Shop", signal: controller.signal,
    cups: {
      inspect: async () => { if (noPrinter) throw new Error("No printer"); },
      submit: async (printer, bytes, preferences) => {
        printed++;
        streamed = bytes;
        assert.equal((await PDFDocument.load(bytes)).getPageCount(), 2);
        assert.deepEqual(preferences, { copies: 2, colorMode: "BW", sides: "DOUBLE" });
        return "Shop-42";
      },
      cancel: async () => {},
    },
    call: async body => {
      events.push(body);
      if (body.action === "claim") return Response.json({ sessionId: "test", claim: "private", pageCount: 2, expiresAt: Date.now() + 120000, preferences: { copies: 2, colorMode: "BW", sides: "DOUBLE" } });
      if (body.action === "page") {
        if (failPage) throw new Error("Page delivery failed");
        if (abort) controller.abort();
        return new Response(png, { headers: { "Content-Type": "image/png", "X-ZDrop-Page-Width": "300", "X-ZDrop-Page-Height": "400" } });
      }
      if (body.action === "authorize-submit") { if (revoke) throw new Error("Job revoked"); return Response.json({ expiresAt: Date.now() + 120000 }); }
      if (failFinish) throw new Error("Storage unavailable");
      return Response.json({ session: { status: "DELETED", files: [] } });
    },
  });
  return { promise, events, printed: () => printed, streamed: () => streamed };
}
const success = await simulate();
assert.equal((await success.promise).outcome, "SPOOLED");
assert.equal(success.printed(), 1);
assert.equal(success.events.at(-1).outcome, "SPOOLED");
assert.ok(success.streamed().every(byte => byte === 0));
for (const option of ["failPage", "abort", "revoke", "noPrinter"]) {
  const failure = await simulate({ [option]: true });
  await assert.rejects(failure.promise);
  assert.equal(failure.printed(), 0);
  if (option === "noPrinter") assert.equal(failure.events.length, 0);
  else assert.equal(failure.events.at(-1).outcome, option === "abort" ? "CANCELLED" : "FAILED");
}
const cleanupFailure = await simulate({ failFinish: true });
await assert.rejects(cleanupFailure.promise, /deletion could not be confirmed/);
assert.equal(cleanupFailure.printed(), 1);
assert.equal(cleanupFailure.events.filter(e => e.action === "finish").length, 3);
console.log("PASS: hardware-free station simulation, copies/color/duplex arguments, cancellation, no browser/redirect credentials, memory buffer cleanup, revocation check, missing-printer refusal, and deletion retries without duplicate printing.");
