import 'server-only';
import { mkdir, readFile, writeFile, rename, rm, stat } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

const root = path.resolve(process.env.ZDROP_DATA_DIR || '.zdrop-data');

export async function readRecords<T>(name: string): Promise<Record<string, T>> {
  try { return JSON.parse(await readFile(path.join(root, `${name}.json`), 'utf8')); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {}; throw error; }
}

// File leases protect local registrations/pricing across concurrent requests and workers.
export async function mutateRecords<T, R>(name: string, change: (records: Record<string, T>) => R): Promise<R> {
  await mkdir(root, { recursive: true, mode: 0o700 });
  const lock = path.join(root, `${name}.lock`);
  let acquired = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    try { await mkdir(lock); acquired = true; break; }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      try { if (Date.now() - (await stat(lock)).mtimeMs > 300000) await rm(lock, { recursive: true, force: true }); } catch { /* lease changed */ }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  if (!acquired) throw new Error('Account data is busy. Please retry.');
  const temporary = path.join(root, `${name}-${randomUUID()}.tmp`);
  try {
    const records = await readRecords<T>(name);
    const result = change(records);
    await writeFile(temporary, JSON.stringify(records), { mode: 0o600 });
    await rename(temporary, path.join(root, `${name}.json`));
    return result;
  } finally {
    await rm(temporary, { force: true });
    await rm(lock, { recursive: true, force: true });
  }
}
