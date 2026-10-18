// Isolated production verification: never load local/cloud env files or customer data.
import { cp, mkdtemp, symlink, rm, open, readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:net';
import os from 'node:os';
import path from 'node:path';

const root = process.cwd();
const work = await mkdtemp(path.join(os.tmpdir(), 'zdrop-verify-'));
const ignored = new Set(['.git','node_modules','.next','.next-build','.zdrop-data','output','.playwright-cli','.vercel']);
const children = new Set();
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^(VERCEL|K_SERVICE|SUPABASE_|FIREBASE_|NEXT_PUBLIC_FIREBASE_|ZDROP_)/.test(key)));
Object.assign(env, { ZDROP_STORAGE: 'local', ZDROP_AUTH_SECRET: randomBytes(32).toString('hex'), CRON_SECRET: randomBytes(32).toString('hex') });
function launch(args, options = {}) {
  const { binary = process.execPath, ...spawnOptions } = options;
  const child = spawn(binary, args, { cwd: work, env, detached: true, stdio: 'inherit', ...spawnOptions });
  children.add(child); child.on('exit', () => children.delete(child)); return child;
}
async function run(args, options) {
  const child = launch(args, options);
  const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', resolve); });
  if (code !== 0) throw new Error(`${args.join(' ')} failed (${code})`);
}
async function freePort() {
  const socket = createServer(); await new Promise(resolve => socket.listen(0, '127.0.0.1', resolve));
  const port = socket.address().port; await new Promise(resolve => socket.close(resolve)); return port;
}
async function serve(extra = {}) {
  const port = await freePort();
  const address = `http://127.0.0.1:${port}`;
  const log = await open(path.join(work, `server-${port}.log`), 'w');
  const child = launch(['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)], { env: { ...env, ...extra }, stdio: ['ignore',log.fd,log.fd] });
  await log.close();
  for (let attempt = 0; attempt < 100; attempt++) {
    try { if ((await fetch(`${address}/api/auth/me`)).ok) return { child, address }; } catch { /* starting */ }
    if (child.exitCode !== null) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Production server failed to start.');
}
function stop(child) { if (children.has(child)) { try { process.kill(-child.pid, 'SIGTERM'); } catch {} children.delete(child); } }
for (const signal of ['SIGINT','SIGTERM']) process.once(signal, () => { for (const child of children) stop(child); process.exit(130); });
try {
  await cp(root, work, { recursive: true, filter: source => { const name=path.basename(source); return source===root || !ignored.has(name) && !name.startsWith('.env') && !name.endsWith('.tsbuildinfo'); } });
  await symlink(path.join(root,'node_modules'),path.join(work,'node_modules'),'dir');
  await run(['node_modules/typescript/bin/tsc','--noEmit']);
  await run(['node_modules/next/dist/bin/next','build']);
  for (const route of ['page','station']) {
    const trace = JSON.parse(await readFile(path.join(work,`.next/server/app/api/print/${route}/route.js.nft.json`),'utf8'));
    if (!trace.files.some(file => /sharp.*\.node$/.test(file)) || !trace.files.some(file => /canvas.*\.node$/.test(file)) || !trace.files.some(file => file.includes('standard_fonts/')) || !trace.files.some(file => file.endsWith('pdf.worker.mjs'))) throw new Error(`Missing hosted print assets: ${route}`);
  }
  const browser = await serve();
  await run(['test'], { binary: 'npm', env: { ...env, ZDROP_TEST_URL: browser.address } });
  stop(browser.child);
  const stationKey = randomBytes(32).toString('hex');
  const managed = await serve({ ZDROP_PRINT_MODE:'managed',ZDROP_STATION_KEY:stationKey,ZDROP_DATA_DIR:path.join(work,'.zdrop-managed-test') });
  await run(['scripts/station-api-test.mjs'], { env: { ...env, ZDROP_TEST_URL:managed.address,ZDROP_STATION_KEY:stationKey,ZDROP_DATA_DIR:path.join(work,'.zdrop-managed-test') } });
  stop(managed.child);
  console.log('PASS: isolated typecheck, production build, native asset traces, full API suite, and managed station API.');
} finally {
  for (const child of children) stop(child);
  if (process.env.ZDROP_VERIFY_KEEP === '1') console.log(`Disposable verification copy: ${work}`);
  else await rm(work, { recursive:true,force:true });
}
