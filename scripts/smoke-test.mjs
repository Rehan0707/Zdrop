import assert from 'node:assert/strict';
const origin = process.env.ZDROP_TEST_URL || 'http://localhost:3000';
try {
  await fetch(`${origin}/api/auth/me`);
} catch {
  console.error(`\n❌ Error: ZDrop server is not reachable at ${origin}.`);
  console.error(`Please ensure the server is running (e.g. 'npm run dev' or 'npm start') before running tests, or set ZDROP_TEST_URL.\n`);
  process.exit(1);
}
const pdf = Buffer.from('%PDF-1.4\n1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj\n3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources <<>>>> endobj\ntrailer <</Root 1 0 R>>\n%%EOF');
async function call(action, { method = 'POST', token, body, query = '', status = 200 } = {}) {
  const r = await fetch(`${origin}/api/sessions/${action}${query}`, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body && !Buffer.isBuffer(body) ? { 'Content-Type': 'application/json' } : {}) }, body: body ? Buffer.isBuffer(body) ? body : JSON.stringify(body) : undefined });
  const data = await r.json(); assert.equal(r.status, status, JSON.stringify(data)); return data;
}
const input = { files: [{ fileName: 'test.pdf', fileSize: pdf.length, mimeType: 'application/pdf' }], preferences: { copies: 2, colorMode: 'BW', sides: 'DOUBLE', pageRange: 'ALL' } };
await call('create', { body: { ...input, files: [] }, status: 400 });
await call('create', { body: { ...input, preferences: { ...input.preferences, pageRange: '9-2' } }, status: 400 });
const { session: s, token } = await call('create', { body: input, status: 201 });
assert.match(s.accessCode, /^\d{6}$/);
await call('status', { method: 'GET', query: `?sessionId=${s.id}`, status: 403 });
await call('resolve', { method: 'GET', query: `?code=${s.accessCode}`, status: 409 });
await call('upload', { token, query: `?sessionId=${s.id}&fileId=${s.files[0].fileId}`, body: pdf });
await call('confirm', { token, body: { sessionId: s.id } });
const operator = await call('resolve', { method: 'GET', query: `?code=${s.accessCode}` });
assert.equal(operator.session.status, 'ACCESSED');
assert.equal(operator.session.files[0].pageCount, 1);
const download = await fetch(origin + operator.session.files[0].previewUrl);
assert.ok(download.headers.get('cache-control')?.includes('no-store'));
assert.deepEqual(Buffer.from(await download.arrayBuffer()), pdf);
await call('delete', { token: 'wrong', body: { sessionId: s.id }, status: 403 });
await call('delete', { token: operator.token, body: { sessionId: s.id } });
const gone = await fetch(origin + operator.session.files[0].previewUrl); assert.equal(gone.status, 410);
const ended = await call('status', { method: 'GET', token, query: `?sessionId=${s.id}` });
assert.equal(ended.session.status, 'DELETED'); assert.equal(ended.session.files.length, 0); assert.equal(ended.session.totalSizeBytes, 0);
const revoked = await call('create', { body: input, status: 201 });
await call('delete', { token: revoked.token, body: { sessionId: revoked.session.id } });
await call('resolve', { method: 'GET', query: `?code=${revoked.session.accessCode}`, status: 410 });
console.log('PASS: validation, upload, confirmation, operator access, file bytes, authorization, deletion, and revocation.');
