import assert from "node:assert/strict";
import { readFile, writeFile, access } from "node:fs/promises";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import { PDFDocument, rgb } from "pdf-lib";
import JSZip from "jszip";
import { loadImage, createCanvas } from "@napi-rs/canvas";

const base = process.env.ZDROP_TEST_URL || "http://localhost:3000";
const pdf = await PDFDocument.create();
const first = pdf.addPage([300, 400]);
first.drawText("Original PDF stays on server", { x: 20, y: 350, size: 13 });
first.drawRectangle({
  x: 20,
  y: 100,
  width: 80,
  height: 80,
  color: rgb(1, 0, 0),
});
pdf.addPage([300, 400]).drawText("Second page", { x: 20, y: 350 });
const bytes = Buffer.from(await pdf.save());
async function call(action, token, body, status = 200, method = "POST") {
  const response = await fetch(base + "/api/sessions/" + action, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    body: method === "POST" ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  assert.equal(response.status, status, JSON.stringify(data));
  return data;
}
async function ready(fileBytes = bytes, type = "application/pdf") {
  const owner = await call(
    "create",
    null,
    {
      files: [
        {
          fileName: type === "application/pdf" ? "private.pdf" : "private.docx",
          fileSize: fileBytes.length,
          mimeType: type,
        },
      ],
      preferences: {
        copies: 2,
        colorMode: "COLOR",
        sides: "DOUBLE",
        pageRange: "ALL",
      },
    },
    201,
  );
  const upload = await fetch(
    base +
      "/api/sessions/upload?sessionId=" +
      owner.session.id +
      "&fileId=" +
      owner.session.files[0].fileId,
    {
      method: "POST",
      headers: { Authorization: "Bearer " + owner.token },
      body: fileBytes,
    },
  );
  assert.equal(upload.status, 200, await upload.text());
  const confirmed = await call("confirm", owner.token, {
    sessionId: owner.session.id,
  });
  assert.equal(confirmed.session.files[0].previewUrl, undefined);
  const response = await fetch(
    base + "/api/sessions/resolve?code=" + owner.session.accessCode,
  );
  const operator = await response.json();
  assert.equal(response.status, 200, JSON.stringify(operator));
  return { owner, operator };
}
async function page(job, token, number = 1, quality = "preview") {
  return fetch(base + "/api/print/page", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    body: JSON.stringify({
      sessionId: job.owner.session.id,
      fileId: job.operator.session.files[0].fileId,
      page: number,
      quality,
    }),
  });
}
const oversized = await fetch(base + "/api/print/page", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ padding: "x".repeat(3000) }),
});
assert.equal(oversized.status, 413);
const job = await ready();
assert.equal(job.operator.session.files[0].previewUrl, undefined);
assert.equal((await page(job)).status, 403);
assert.equal((await page(job, job.owner.token)).status, 403);
assert.equal(
  (
    await fetch(
      base +
        "/api/files?sessionId=" +
        job.owner.session.id +
        "&fileId=" +
        job.operator.session.files[0].fileId +
        "&token=" +
        job.operator.token,
    )
  ).status,
  403,
);
assert.equal((await page(job, job.operator.token, 3)).status, 400);
const rendered = await page(job, job.operator.token);
assert.equal(rendered.status, 200, await rendered.clone().text());
assert.equal(rendered.headers.get("content-type"), "image/png");
assert.ok(rendered.headers.get("cache-control").includes("no-store"));
assert.equal(rendered.headers.get("location"), null);
const png = Buffer.from(await rendered.arrayBuffer());
assert.ok(
  png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
);
assert.ok(!png.equals(bytes));
const image = await loadImage(png);
const canvas = createCanvas(image.width, image.height),
  context = canvas.getContext("2d");
context.drawImage(image, 0, 0);
const pixels = context.getImageData(0, 0, image.width, image.height).data;
let ink = 0;
for (let y = 20; y < 80; y++)
  for (let x = 10; x < 290; x++) {
    const i = (y * image.width + x) * 4;
    if (pixels[i] < 150 && pixels[i + 1] < 150 && pixels[i + 2] < 150) ink++;
  }
assert.ok(ink > 50, "PDF text must render, not just an empty white page.");
assert.equal((await page(job, job.operator.token, 2, "print")).status, 200);
await call(
  "print-start",
  job.owner.token,
  { sessionId: job.owner.session.id },
  403,
);
await call(
  "print-finish",
  job.operator.token,
  { sessionId: job.owner.session.id },
  409,
);
const starts = await Promise.all(
  [0, 1].map(() =>
    fetch(base + "/api/sessions/print-start", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + job.operator.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionId: job.owner.session.id }),
    }),
  ),
);
assert.deepEqual(starts.map((response) => response.status).sort(), [200, 409]);
const started = await starts.find((response) => response.status === 200).json();
assert.ok(started.session.printStartedAt);
assert.ok(started.session.expiresAt <= Date.now() + 120000);
assert.equal((await page(job, job.operator.token)).status, 410);
assert.equal(
  (
    await fetch(
      base + "/api/sessions/resolve?code=" + job.owner.session.accessCode,
    )
  ).status,
  410,
);
await call(
  "print-finish",
  job.owner.token,
  { sessionId: job.owner.session.id },
  403,
);
const finished = await call("print-finish", job.operator.token, {
  sessionId: job.owner.session.id,
});
assert.equal(finished.session.status, "DELETED");
assert.equal(finished.session.files.length, 0);
assert.ok(finished.session.printClosedAt);
await call("print-finish", job.operator.token, {
  sessionId: job.owner.session.id,
}); // idempotent
await assert.rejects(
  access(
    ".zdrop-data/" +
      job.owner.session.id +
      "/" +
      job.operator.session.files[0].fileId,
  ),
);

const abandoned = await ready();
await call("print-start", abandoned.operator.token, {
  sessionId: abandoned.owner.session.id,
});
const metadata = ".zdrop-data/" + abandoned.owner.session.id + "/session.json";
const stored = JSON.parse(await readFile(metadata, "utf8"));
stored.expiresAt = Date.now() - 1;
await writeFile(metadata, JSON.stringify(stored));
const ended = await fetch(
  base + "/api/sessions/status?sessionId=" + stored.id,
  { headers: { Authorization: "Bearer " + abandoned.owner.token } },
);
assert.equal((await ended.json()).session.status, "EXPIRED");
await assert.rejects(
  access(".zdrop-data/" + stored.id + "/" + stored.files[0].fileId),
);

const zip = new JSZip();
zip.file("[Content_Types].xml", "<Types/>");
zip.file("word/document.xml", "<document/>");
const office = await ready(
  await zip.generateAsync({ type: "nodebuffer" }),
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
);
assert.equal((await page(office, office.operator.token)).status, 415);
await call(
  "print-start",
  office.operator.token,
  { sessionId: office.owner.session.id },
  415,
);
await call("delete", office.owner.token, {
  sessionId: office.owner.session.id,
});

// Run the actual cloud purge implementation with failing storage, never cloud credentials.
const realRequire = createRequire(import.meta.url);
function loadSource(file, imports, globals = {}) {
  const output = ts.transpileModule(
    realRequire("node:fs").readFileSync(file, "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    },
  ).outputText;
  const module = { exports: {} };
  vm.runInNewContext(
    output,
    {
      module,
      exports: module.exports,
      require: (name) =>
        name === "server-only"
          ? {}
          : name in imports
            ? imports[name]
            : realRequire(name),
      process: { env: { ZDROP_STORAGE: "supabase" } },
      Buffer,
      console,
      setInterval,
      clearInterval,
      setTimeout,
      ...globals,
    },
    { filename: file },
  );
  return module.exports;
}
let failRemoval = true,
  removedPaths,
  saves = [];
const store = loadSource("src/lib/server/store.ts", {
  "./print-mode": { printMode: () => "browser" },
  "./supabase": {
    metadataRpc: async (name, params) => {
      if (name === "zdrop_acquire_lock") return true;
      if (name === "zdrop_save_session")
        saves.push(JSON.parse(JSON.stringify(params.p_session)));
    },
  },
  "./firebase-storage-policy": {},
  "./supabase-storage": {
    deleteSupabaseFiles: async (paths) => {
      removedPaths = paths;
      if (failRemoval) throw new Error("Storage unavailable");
    },
  },
});
const cloudSession = {
  ...job.operator.session,
  id: job.owner.session.id,
  ownerToken: "test-owner",
  status: "ACCESSED",
};
await assert.rejects(
  store.withSessionLock(cloudSession.id, () =>
    store.purge(cloudSession, "OPERATOR_PRINT"),
  ),
  /Storage unavailable/,
);
assert.equal(saves.at(-1).purging, true);
assert.equal(saves.at(-1).deletedAt, undefined);
assert.ok(saves.at(-1).files.length > 0);
assert.deepEqual(
  Array.from(removedPaths),
  cloudSession.files.map(
    (file) => "sessions/" + cloudSession.id + "/" + file.fileId,
  ),
);
failRemoval = false;
await store.withSessionLock(cloudSession.id, () =>
  store.purge(cloudSession, "OPERATOR_PRINT"),
);
assert.equal(saves.at(-1).status, "DELETED");
assert.equal(saves.at(-1).files.length, 0);
let deleteBody;
const storage = loadSource(
  "src/lib/server/supabase-storage.ts",
  {},
  {
    process: {
      env: {
        SUPABASE_URL: "https://storage.invalid",
        SUPABASE_SECRET_KEY: "test-placeholder",
      },
    },
    fetch: async (_url, options) => {
      deleteBody = JSON.parse(options.body);
      return { ok: true };
    },
  },
);
await storage.deleteSupabaseFiles([
  "sessions/test/file-a",
  "sessions/test/file-b",
]);
assert.deepEqual(deleteBody.prefixes, [
  "sessions/test/file-a",
  "sessions/test/file-b",
]);
const ranges = loadSource("src/lib/page-ranges.ts", {});
const policy = loadSource("src/lib/print-policy.ts", { "./page-ranges": ranges });
const summary = [
  { fileId: "pdf", name: "pdf", type: "application/pdf", pageCount: 2 },
  { fileId: "image", name: "image", type: "image/png", pageCount: 1 },
];
assert.equal(policy.printPages(summary, { pageRange: "ALL" }).length, 3);
assert.deepEqual(
  JSON.parse(JSON.stringify(policy.printPages(summary, { pageRange: "2" }))),
  [{ fileId: "pdf", name: "pdf", page: 2 }],
);
assert.throws(
  () =>
    policy.printPages([{ ...summary[0], pageCount: 101 }], {
      pageRange: "ALL",
    }),
  /100/,
);
assert.deepEqual(JSON.parse(JSON.stringify(policy.printPages(summary, { pageRange: "3" }))), [{ fileId: "image", name: "image", page: 1 }]);
assert.throws(
  () => policy.printPages(summary, { pageRange: "8" }),
  /does not include/,
);
console.log(
  "PASS: operator-only raster pages with PDF text, blocked originals, one-time atomic print start, idempotent finish, physical cleanup, abandoned-dialog expiry, DOCX rejection, and honest cloud purge failure/recovery.",
);
