import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrintPreferencesSchema, AllowedMimeTypesEnum } from '@/lib/types';
import { active, byCode, newId, newToken, publicSession, purge, putFile, readSession, reserve, saveSession, withSessionLock, StoredSession, cloudUpload, isCloud, enforceFileNoStore, activateSession } from '@/lib/server/store';
import { inspectDocument, DocumentError } from '@/lib/server/documents';
import { rateLimit } from '@/lib/server/rate-limit';
import { getAuthUserFromCookie } from '@/lib/server/auth';
export const runtime = 'nodejs';
export const maxDuration = 300;
const metadata = z.object({ fileName: z.string().min(1).max(120), fileSize: z.number().int().positive().max(25 * 1024 * 1024), mimeType: AllowedMimeTypesEnum });
const createSchema = z.object({
  files: z.array(metadata).min(1).max(3),
  preferences: PrintPreferencesSchema,
  shopId: z.string().optional(),
  shopName: z.string().optional(),
});
const reply = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
async function handle(req: NextRequest, action: string) {
  try {
    const authUser = getAuthUserFromCookie(req.headers.get('cookie'));
    if (action === 'create' && req.method === 'POST') {
      const input = createSchema.parse(await req.json());
      const s: StoredSession = {
        id: newId(),
        accessCode: '',
        ownerToken: newToken(),
        status: 'PENDING_UPLOAD',
        createdAt: Date.now(),
        expiresAt: Date.now() + 900000,
        preferences: input.preferences,
        totalSizeBytes: input.files.reduce((n, f) => n + f.fileSize, 0),
        files: input.files.map(f => ({
          fileId: `file_${newToken().replaceAll('-', '').slice(0, 16)}`,
          name: f.fileName.replace(/[\x00-\x1f/\\]/g, '_'),
          size: f.fileSize,
          type: f.mimeType
        })),
        userId: authUser?.id,
        userEmail: authUser?.email,
        userName: authUser?.name,
        userAvatar: authUser?.avatarUrl,
        shopId: input.shopId,
        shopName: input.shopName,
      };
      s.uploadSlots = Object.fromEntries(s.files.map(f => [f.fileId, { size: f.size, type: f.type }]));
      s.purging = false; s.uploadSealed = false;
      const upload = await cloudUpload(s);
      await reserve(s);
      return reply({ session: publicSession(s), token: s.ownerToken, upload }, 201);
    }
    if (action === 'resolve' && req.method === 'GET') {
      const code = z.string().regex(/^\d{6}$/).parse(req.nextUrl.searchParams.get('code'));
      const s = await byCode(code);
      if (!s) return reply({ error: 'Code not found.' }, 404);
      if (!await active(s)) return reply({ error: 'Code expired or files deleted.' }, 410);
      if (s.status === 'PENDING_UPLOAD') return reply({ error: 'Upload is still in progress.' }, 409);
      s.status = 'ACCESSED';
      s.accessedAt ||= Date.now();
      s.operatorToken ||= newToken();
      if (authUser?.role === 'shop_owner') {
        s.operatorId = authUser.id;
      }
      await saveSession(s);
      return reply({ session: publicSession(s, s.operatorToken), token: s.operatorToken });
    }
    const input = req.method === 'GET' ? Object.fromEntries(req.nextUrl.searchParams) : action === 'upload' ? Object.fromEntries(req.nextUrl.searchParams) : await req.json();
    const s = await readSession(String(input.sessionId));
    const token = req.headers.get('authorization')?.replace(/^Bearer /, '');
    if (!s || !token || (token !== s.ownerToken && token !== s.operatorToken)) return reply({ error: 'Session access denied.' }, 403);
    const live = await active(s);
    if (action === 'status' && req.method === 'GET') return reply({ session: publicSession(s, token === s.operatorToken ? token : undefined) });
    if (!live) return reply({ error: 'Session expired or deleted.' }, 410);
    if (action === 'upload' && req.method === 'POST') {
      if (isCloud) return reply({ error: 'Use direct cloud upload.' }, 409);
      if (token !== s.ownerToken || s.status !== 'PENDING_UPLOAD' || s.uploadSealed) return reply({ error: 'Upload not permitted.' }, 409);
      const f = s.files.find(f => f.fileId === input.fileId);
      if (!f) return reply({ error: 'Unknown file.' }, 400);
      const length = Number(req.headers.get('content-length'));
      if (length > 25 * 1024 * 1024) return reply({ error: 'File too large.' }, 413);
      const chunks: Uint8Array[] = []; let size = 0;
      const reader = req.body?.getReader();
      if (!reader) return reply({ error: 'File is empty.' }, 400);
      while (true) { const chunk = await reader.read(); if (chunk.done) break; size += chunk.value.length; if (size > f.size || size > 25 * 1024 * 1024) { await reader.cancel(); return reply({ error: 'File too large.' }, 413); } chunks.push(chunk.value); }
      const bytes = Buffer.concat(chunks);
      if (bytes.length !== f.size) return reply({ error: 'File size does not match.' }, 400);
      await inspectDocument(bytes, f.type);
      await putFile(s.id, f.fileId, bytes, f.type);
      return reply({ success: true });
    }
    if (action === 'confirm' && req.method === 'POST') {
      if (token !== s.ownerToken || s.status !== 'PENDING_UPLOAD') return reply({ error: 'Session cannot be activated.' }, 409);
      const { getFile } = await import('@/lib/server/store');
      s.uploadSealed = true; await saveSession(s); // Seal direct uploads before inspecting immutable contents.
      try {
        for (const f of s.files) { if (isCloud) await enforceFileNoStore(s.id, f.fileId); const bytes = await getFile(s.id, f.fileId); if (bytes.length !== f.size) throw new DocumentError('Upload incomplete or file size mismatch.'); const pages = await inspectDocument(bytes, f.type); if (pages) f.pageCount = pages; }
      } catch (error) { await purge(s, 'STUDENT_REVOKE'); throw error; }
      await activateSession(s); return reply({ session: publicSession(s) });
    }
    if (action === 'delete' && req.method === 'POST') {
      const source = token === s.ownerToken ? 'STUDENT_REVOKE' : 'OPERATOR_PRINT';
      await purge(s, source); return reply({ session: publicSession(s) });
    }
    return reply({ error: 'Unknown operation.' }, 404);
  } catch (e) {
    console.error('[sessions error]:', e);
    if (e instanceof DocumentError) return reply({ error: e.message }, 400);
    if (e instanceof z.ZodError) return reply({ error: e.issues[0].message }, 400);
    return reply({ error: (e as Error)?.message || 'The operation could not be completed. Please retry.' }, 500);
  }
}
async function dispatch(req: NextRequest, action: string) {
  try {
    if ((action === 'create' || action === 'resolve') && !await rateLimit(req, action)) return reply({ error: 'Too many attempts. Please wait one minute.' }, 429);
    if (req.method === 'POST' && action !== 'upload' && Number(req.headers.get('content-length')) > 16384) return reply({ error: 'Request too large.' }, 413);
    let id = req.nextUrl.searchParams.get('sessionId');
    if (action === 'resolve') {
      const code = req.nextUrl.searchParams.get('code') || '';
      if (/^\d{6}$/.test(code)) id = (await byCode(code))?.id || null;
    } else if (!id && action !== 'create' && req.method === 'POST') {
      id = (await req.clone().json()).sessionId;
    }
    if (id && action !== 'resolve') {
      const token = req.headers.get('authorization')?.replace(/^Bearer /, '');
      const session = await readSession(id);
      if (!session || !token || (token !== session.ownerToken && token !== session.operatorToken)) return reply({ error: 'Session access denied.' }, 403);
    }
    return (id && action !== 'status') ? await withSessionLock(id, () => handle(req, action)) : await handle(req, action);
  } catch (err) {
    console.error(`[dispatch error ${action}]:`, err);
    return reply({ error: 'Session is busy. Please retry.' }, 409);
  }
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ action: string }> }) { return dispatch(req, (await ctx.params).action); }
export async function GET(req: NextRequest, ctx: { params: Promise<{ action: string }> }) { return dispatch(req, (await ctx.params).action); }
