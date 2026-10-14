import 'server-only';
import { AsyncLocalStorage } from 'node:async_hooks';
import { metadataRpc } from './supabase';
import { enforceNoStore } from './firebase-storage-policy';
import { randomInt, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, rm, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import { SessionData } from '../types';
import {
  createSupabaseUploadUrl,
  getSupabaseSignedUrl,
  getSupabaseFileBytes,
  putSupabaseFileBytes,
  deleteSupabasePrefix,
} from './supabase-storage';

export interface StoredSession extends SessionData {
  ownerToken: string;
  operatorToken?: string;
  purging?: boolean;
  uploadSealed?: boolean;
  purgeSource?: SessionData['deletionSource'];
  uploadSlots?: Record<string, { size: number; type: string }>;
}

const root = path.resolve(process.env.ZDROP_DATA_DIR || (process.env.VERCEL ? path.join('/tmp', '.zdrop-data') : '.zdrop-data'));
const storageMode = process.env.ZDROP_STORAGE || (process.env.VERCEL || process.env.K_SERVICE ? 'supabase' : 'local');
const isSupabaseStorage = storageMode === 'supabase';
const isFirebaseStorage = storageMode === 'firebase';
const cloud = isSupabaseStorage || isFirebaseStorage;
export const isCloud = cloud;

if ((process.env.VERCEL || process.env.K_SERVICE) && !cloud) {
  throw new Error('Hosted deployments require ZDROP_STORAGE=supabase or ZDROP_STORAGE=firebase.');
}

const leases = new AsyncLocalStorage<{ id: string; lease: string }>();

function currentLease(id: string) {
  const current = leases.getStore();
  if (!current || current.id !== id) throw new Error('Session mutation requires a lease.');
  return current.lease;
}

function firebase() {
  if (!getApps().length) {
    initializeApp({
      credential: process.env.FIREBASE_PRIVATE_KEY
        ? cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          })
        : applicationDefault(),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  }
  return { db: getFirestore(), bucket: getStorage().bucket() };
}

export async function readSession(id: string): Promise<StoredSession | null> {
  if (!/^ses_[a-f0-9-]{36}$/.test(id)) return null;
  if (cloud) return metadataRpc<StoredSession | null>('zdrop_read_session', { p_id: id });
  try {
    return JSON.parse(await readFile(path.join(root, id, 'session.json'), 'utf8'));
  } catch {
    return null;
  }
}

export async function saveSession(s: StoredSession) {
  if (cloud) {
    if (isFirebaseStorage && (s.uploadSealed || s.purging || s.deletedAt)) {
      await closeUploadGrant(s.id);
    }
    await metadataRpc('zdrop_save_session', { p_session: s, p_lease: currentLease(s.id) });
    return;
  }
  await mkdir(path.join(root, s.id), { recursive: true, mode: 0o700 });
  const temporary = path.join(root, s.id, `metadata-${randomUUID()}.tmp`);
  await writeFile(temporary, JSON.stringify(s), { mode: 0o600 });
  await (await import('node:fs/promises')).rename(temporary, path.join(root, s.id, 'session.json'));
}

export async function allSessions(): Promise<StoredSession[]> {
  if (cloud) {
    const result: StoredSession[] = [];
    let after = '';
    while (true) {
      const page = await metadataRpc<StoredSession[]>('zdrop_candidates', { p_after: after, p_limit: 200 });
      result.push(...page);
      if (page.length < 200) return result;
      after = page[page.length - 1].id;
    }
  }
  await mkdir(root, { recursive: true });
  return (await Promise.all((await readdir(root)).map(readSession))).filter((s): s is StoredSession => !!s);
}

export async function reserve(s: StoredSession) {
  for (let attempt = 0; attempt < 20; attempt++) {
    s.accessCode = String(randomInt(100000, 1000000));
    if (cloud) {
      const reserved = await metadataRpc<StoredSession | null>('zdrop_reserve', { p_session: s });
      if (reserved) {
        Object.assign(s, reserved);
        if (isFirebaseStorage) {
          await firebase().db.collection('uploadGrants').doc(s.id).create({
            expiresAt: s.expiresAt,
            uploadSlots: s.uploadSlots,
          });
        }
        return;
      }
    } else {
      await mkdir(path.join(root, 'codes'), { recursive: true });
      try {
        await writeFile(path.join(root, 'codes', s.accessCode), s.id, { flag: 'wx', mode: 0o600 });
        try {
          await saveSession(s);
        } catch (error) {
          await rm(path.join(root, 'codes', s.accessCode), { force: true });
          throw error;
        }
        return;
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e;
      }
    }
  }
  throw new Error('Unable to reserve a code. Please retry.');
}

export async function byCode(code: string) {
  if (cloud) return metadataRpc<StoredSession | null>('zdrop_by_code', { p_code: code });
  try {
    return await readSession(await readFile(path.join(root, 'codes', code), 'utf8'));
  } catch {
    return null;
  }
}

export async function putFile(id: string, fileId: string, bytes: Buffer, type: string) {
  if (isSupabaseStorage) {
    await putSupabaseFileBytes(`sessions/${id}/${fileId}`, bytes, type);
  } else if (isFirebaseStorage) {
    await firebase().bucket.file(`sessions/${id}/${fileId}`).save(bytes, {
      resumable: false,
      metadata: { contentType: type, cacheControl: 'no-store' },
    });
  } else {
    await writeFile(path.join(root, id, fileId), bytes, { mode: 0o600 });
  }
}

export async function enforceFileNoStore(id: string, fileId: string) {
  if (isFirebaseStorage) {
    await enforceNoStore(firebase().bucket.file(`sessions/${id}/${fileId}`));
  }
}

export async function getFile(id: string, fileId: string): Promise<Buffer> {
  if (isSupabaseStorage) {
    return getSupabaseFileBytes(`sessions/${id}/${fileId}`);
  }
  if (isFirebaseStorage) {
    return (await firebase().bucket.file(`sessions/${id}/${fileId}`).download())[0];
  }
  return readFile(path.join(root, id, fileId));
}

export async function purge(s: StoredSession, source: StoredSession['deletionSource']) {
  s.purging = true;
  s.purgeSource ||= source;
  await saveSession(s);

  if (isSupabaseStorage) {
    await deleteSupabasePrefix(`sessions/${s.id}`).catch(() => {});
  } else if (isFirebaseStorage) {
    await firebase().bucket.deleteFiles({ prefix: `sessions/${s.id}/` }).catch(() => {});
  } else {
    await Promise.all(s.files.map((f) => rm(path.join(root, s.id, f.fileId), { force: true })));
  }

  source = s.purgeSource;
  s.status = source === 'TTL_PURGE' ? 'EXPIRED' : 'DELETED';
  s.deletedAt = Date.now();
  s.deletionSource = source;
  s.preferences = { copies: 1, colorMode: 'BW', sides: 'DOUBLE', pageRange: 'ALL' };
  s.files = [];
  s.totalSizeBytes = 0;
  s.uploadSlots = {};
  s.purging = false;
  await saveSession(s);

  if (isFirebaseStorage) {
    await getAuth().deleteUser(s.id).catch((error) => {
      if (error.code !== 'auth/user-not-found') throw error;
    });
  }
  return s;
}

export async function active(s: StoredSession) {
  if (s.purging) {
    await purge(s, s.purgeSource);
    return false;
  }
  if (!['DELETED', 'EXPIRED'].includes(s.status) && s.expiresAt <= Date.now()) {
    await purge(s, 'TTL_PURGE');
  }
  return !['DELETED', 'EXPIRED'].includes(s.status);
}

export function publicSession(s: StoredSession, token?: string): SessionData {
  const { ownerToken, operatorToken, purging, purgeSource, uploadSlots, uploadSealed, ...result } = s;
  return {
    ...result,
    files: result.files.map((f) => ({
      ...f,
      previewUrl: token ? `/api/files?sessionId=${s.id}&fileId=${f.fileId}&token=${token}` : undefined,
    })),
  };
}

export const newId = () => `ses_${randomUUID()}`;
export const newToken = () => randomUUID() + randomUUID();

export async function withSessionLock<T>(id: string, operation: () => Promise<T>): Promise<T> {
  if (!/^ses_[a-f0-9-]{36}$/.test(id)) return operation();
  const lease = newToken();
  const lockPath = path.join(root, `${id}.lock`);
  if (cloud) {
    let acquired = false;
    for (let attempt = 0; attempt < 6; attempt++) {
      if (await metadataRpc<boolean>('zdrop_acquire_lock', { p_id: id, p_lease: lease })) {
        acquired = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 200 + attempt * 200));
    }
    if (!acquired) {
      throw new Error('Session busy');
    }
  } else {
    await mkdir(root, { recursive: true });
    try {
      await mkdir(lockPath);
    } catch {
      const info = await stat(lockPath);
      if (Date.now() - info.mtimeMs < 300000) throw new Error('Session busy');
      await rm(lockPath, { recursive: true, force: true });
      await mkdir(lockPath);
    }
  }
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let renewal = Promise.resolve();
  if (cloud) {
    heartbeat = setInterval(() => {
      renewal = renewal
        .then(async () => {
          await metadataRpc('zdrop_renew_lock', { p_id: id, p_lease: lease });
        })
        .catch(() => {});
    }, 30000);
    heartbeat.unref();
  }
  try {
    return await leases.run({ id, lease }, operation);
  } finally {
    if (heartbeat) clearInterval(heartbeat);
    await renewal;
    if (cloud) await metadataRpc('zdrop_release_lock', { p_id: id, p_lease: lease });
    else await rm(lockPath, { recursive: true, force: true });
  }
}

export async function cloudUpload(s: StoredSession) {
  if (!cloud) return null;
  if (isSupabaseStorage) {
    const slots: Record<string, string> = {};
    for (const file of s.files) {
      slots[file.fileId] = await createSupabaseUploadUrl(`sessions/${s.id}/${file.fileId}`);
    }
    return { provider: 'supabase' as const, slots };
  }

  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  if (!apiKey || !process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_STORAGE_BUCKET) {
    throw new Error('Firebase web upload configuration is missing.');
  }
  firebase();
  return {
    provider: 'firebase' as const,
    customToken: await getAuth().createCustomToken(s.id, { uploader: true }),
    config: {
      apiKey,
      authDomain: `${process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    },
  };
}

export async function retire(s: StoredSession) {
  if (cloud) {
    if (isFirebaseStorage) {
      firebase();
      await getAuth().deleteUser(s.id).catch((error) => {
        if (error.code !== 'auth/user-not-found') throw error;
      });
      await closeUploadGrant(s.id);
    }
    await metadataRpc('zdrop_retire', { p_id: s.id, p_lease: currentLease(s.id) });
  } else {
    const code = path.join(root, 'codes', s.accessCode);
    try {
      if ((await readFile(code, 'utf8')) === s.id) await rm(code, { force: true });
    } catch {}
    await rm(path.join(root, s.id), { recursive: true, force: true });
  }
}

export async function maintenance() {
  if (cloud) await metadataRpc('zdrop_housekeeping');
  let purged = 0,
    retired = 0,
    failed = 0;
  for (const candidate of await allSessions()) {
    if (candidate.expiresAt > Date.now() && !candidate.purging && !candidate.deletedAt) continue;
    await withSessionLock(candidate.id, async () => {
      const s = await readSession(candidate.id);
      if (!s) return;
      if (s.purging || (!s.deletedAt && s.expiresAt <= Date.now())) {
        await purge(s, s.purgeSource || 'TTL_PURGE');
        purged++;
      }
      if (s.deletedAt && Date.now() > Math.max(s.expiresAt, s.deletedAt) + 3600000) {
        await retire(s);
        retired++;
      }
    }).catch(() => {
      failed++;
    });
  }
  return { purged, retired, failed };
}

export async function signedFileUrl(s: StoredSession, fileId: string) {
  if (!cloud) return null;
  if (isSupabaseStorage) {
    return getSupabaseSignedUrl(`sessions/${s.id}/${fileId}`, s.expiresAt);
  }
  return (
    await firebase()
      .bucket.file(`sessions/${s.id}/${fileId}`)
      .getSignedUrl({
        action: 'read',
        expires: Math.min(s.expiresAt, Date.now() + 60000),
        responseDisposition: `${s.files.find((f) => f.fileId === fileId)?.type.includes('wordprocessing') ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(s.files.find((f) => f.fileId === fileId)?.name || 'document')}`,
      })
  )[0];
}

export async function activateSession(s: StoredSession) {
  if (cloud) {
    Object.assign(s, await metadataRpc<StoredSession>('zdrop_activate', { p_session: s, p_lease: currentLease(s.id) }));
  } else {
    if (s.expiresAt <= Date.now()) throw new Error('Upload expired');
    s.expiresAt = Date.now() + 900000;
    s.status = 'ACTIVE';
    await saveSession(s);
  }
}

async function closeUploadGrant(id: string) {
  await firebase().db.collection('uploadGrants').doc(id).delete();
}
