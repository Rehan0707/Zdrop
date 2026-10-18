import { NextRequest, NextResponse } from 'next/server';
import { printPages, PRINT_CLEANUP_MS } from '@/lib/print-policy';
import { z } from 'zod';
import { PrintPreferencesSchema, AllowedMimeTypesEnum } from '@/lib/types';
import { active, byCode, newId, newToken, publicSession, purge, putFile, readSession, reserve, saveSession, withSessionLock, StoredSession, cloudUpload, isCloud, enforceFileNoStore, activateSession, beginPrintSession } from '@/lib/server/store';
import { inspectDocument, DocumentError } from '@/lib/server/documents';
import { rateLimit } from '@/lib/server/rate-limit';
import { getAuthUserFromCookie } from '@/lib/server/auth';
import { printMode } from '@/lib/server/print-mode';
import { readJsonBody, RequestError } from '@/lib/server/request';
import { getShopById } from '@/lib/server/shops-store';
import { DEFAULT_PRICING, calculatePrintCost } from '@/lib/pricing';
export const runtime = 'nodejs';
export const maxDuration = 300;
const metadata = z.object({
  fileName: z.string().min(1).max(120),
  fileSize: z.number().int().positive().max(25 * 1024 * 1024),
  mimeType: AllowedMimeTypesEnum,
  pageCount: z.number().int().positive().max(2000).optional(),
  colorPages: z.array(z.number().int().positive().max(2000)).max(2000).optional(),
});
const createSchema = z.object({
  files: z.array(metadata).min(1).max(3),
  preferences: PrintPreferencesSchema,
  shopId: z.string().regex(/^shop_[a-f0-9-]{36}$/).optional(),
});
const paymentSchema = z.object({
  paymentStatus: z.enum(['UNPAID', 'PENDING_CONFIRMATION', 'PAID_ONLINE', 'PAID_COUNTER']),
  paymentMethod: z.enum(['UPI', 'CASH', 'COUNTER']),
});
const reply = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
async function handle(req: NextRequest, action: string, json?: any) {
  try {
    const authUser = getAuthUserFromCookie(req.headers.get('cookie'));
    if (action === 'create' && req.method === 'POST') {
      const input = createSchema.parse(json);
      const shop = input.shopId ? await getShopById(input.shopId) : null;
      if (input.shopId && !shop) return reply({ error: 'This shop is unavailable. Choose another counter.' }, 400);
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
          type: f.mimeType,
          pageCount: typeof f.pageCount === 'number' && f.pageCount > 0 ? f.pageCount : undefined,
          colorPages: f.colorPages ? [...new Set(f.colorPages)] : undefined,
        })),
        userId: authUser?.id,
        userEmail: authUser?.email,
        userName: authUser?.name,
        userAvatar: authUser?.avatarUrl,
        shopId: shop?.id,
        shopName: shop?.shopName,
        shopPricing: { ...DEFAULT_PRICING, ...shop?.pricing },
        paymentStatus: 'UNPAID',
      };
      s.costEstimate = calculatePrintCost(s.files, s.preferences, s.shopPricing);

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
      if (s.printStartedAt) return reply({ error: 'This job has already entered its one-time print window.' }, 410);
      s.status = 'ACCESSED';
      s.accessedAt ||= Date.now();
      s.operatorToken ||= newToken();
      if (authUser?.role === 'shop_owner') {
        s.operatorId = authUser.id;
      }
      await saveSession(s);
      return reply({ session: publicSession(s, s.operatorToken), token: s.operatorToken });
    }
    const input = req.method === 'GET' ? Object.fromEntries(req.nextUrl.searchParams) : action === 'upload' ? Object.fromEntries(req.nextUrl.searchParams) : json;
    const s = await readSession(String(input.sessionId));
    const token = req.headers.get('authorization')?.replace(/^Bearer /, '');
    if (!s || !token || (token !== s.ownerToken && token !== s.operatorToken)) return reply({ error: 'Session access denied.' }, 403);
    const live = await active(s);
    if (action === 'status' && req.method === 'GET') return reply({ session: publicSession(s, token === s.operatorToken ? token : undefined) });
    if (action === 'print-finish' && req.method === 'POST') {
      if (printMode() === 'managed') return reply({ error: 'Use the managed station to submit and finish this job.' }, 409);
      if (token !== s.operatorToken) return reply({ error: 'Operator access required.' }, 403);
      if (!s.printStartedAt) return reply({ error: 'Start the print window first.' }, 409);
      if (!live) return reply({ session: publicSession(s) });
      s.printClosedAt = Date.now();
      await purge(s, 'OPERATOR_PRINT');
      return reply({ session: publicSession(s) });
    }
    if (!live) return reply({ error: 'Session expired or deleted.' }, 410);
    if (action === 'print-start' && req.method === 'POST') {
      if (printMode() === 'managed') return reply({ error: 'Use the managed station. Browser printing is disabled.' }, 409);
      if (token !== s.operatorToken) return reply({ error: 'Operator access required.' }, 403);
      if (s.printStartedAt || s.status !== 'ACCESSED') return reply({ error: 'This job can only enter one print window.' }, 409);
      try { printPages(s.files, s.preferences); }
      catch (error) { return reply({ error: (error as Error).message }, 415); }
      s.printStartedAt = Date.now();
      // Revoke further page access immediately and bound cleanup if the browser disappears.
      s.expiresAt = Math.min(s.expiresAt, Date.now() + PRINT_CLEANUP_MS);
      await beginPrintSession(s);
      return reply({ session: publicSession(s) });
    }
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
        for (const f of s.files) { if (isCloud) await enforceFileNoStore(s.id, f.fileId); const bytes = await getFile(s.id, f.fileId); if (bytes.length !== f.size) throw new DocumentError('Upload incomplete or file size mismatch.'); const pages = await inspectDocument(bytes, f.type); if (pages) { f.pageCount = pages; if (f.colorPages) f.colorPages = f.colorPages.filter(page => page <= pages); } }
        if (s.files.every(file => !file.type.includes('wordprocessing'))) {
          try { printPages(s.files, s.preferences); }
          catch (error) { throw new DocumentError((error as Error).message); }
        }
        // Update accurate cost estimate now that page counts are verified
        s.costEstimate = calculatePrintCost(s.files, s.preferences, s.shopPricing);
      } catch (error) { await purge(s, 'STUDENT_REVOKE'); throw error; }
      await activateSession(s); return reply({ session: publicSession(s) });
    }
    if (action === 'payment' && req.method === 'POST') {
      if (s.status !== 'ACCESSED' && s.status !== 'ACTIVE' || s.printStartedAt) return reply({ error: 'Payment cannot be changed for this job.' }, 409);
      const payment = paymentSchema.parse(input);
      if (token === s.ownerToken) {
        if (payment.paymentStatus !== 'PENDING_CONFIRMATION' || payment.paymentMethod !== 'UPI') return reply({ error: 'Only the operator can confirm money received.' }, 403);
        if (!s.shopPricing?.upiId || s.shopPricing.currencySymbol !== '₹') return reply({ error: 'This shop has not configured INR UPI payments.' }, 409);
        if (s.paymentStatus === 'PAID_ONLINE' || s.paymentStatus === 'PAID_COUNTER') return reply({ error: 'Payment is already recorded by the operator.' }, 409);
      } else if (payment.paymentStatus === 'PENDING_CONFIRMATION' ||
        payment.paymentStatus === 'PAID_ONLINE' && payment.paymentMethod !== 'UPI' ||
        payment.paymentStatus === 'PAID_COUNTER' && payment.paymentMethod === 'UPI') {
        return reply({ error: 'Choose a matching payment status and method.' }, 400);
      }
      s.paymentStatus = payment.paymentStatus;
      s.paymentMethod = payment.paymentMethod;
      s.paymentTimestamp = Date.now();
      await saveSession(s);
      return reply({ session: publicSession(s, token === s.operatorToken ? token : undefined) });
    }
    if (action === 'delete' && req.method === 'POST') {
      const source = token === s.ownerToken ? 'STUDENT_REVOKE' : 'OPERATOR_PRINT';
      await purge(s, source); return reply({ session: publicSession(s) });
    }
    return reply({ error: 'Unknown operation.' }, 404);
  } catch (e) {
    console.error('[sessions error]:', e);
    if (e instanceof RequestError) return reply({ error: e.message }, e.status);
    if (e instanceof DocumentError) return reply({ error: e.message }, 400);
    if (e instanceof z.ZodError) return reply({ error: e.issues[0].message }, 400);
    return reply({ error: (e as Error)?.message || 'The operation could not be completed. Please retry.' }, 500);
  }
}
async function dispatch(req: NextRequest, action: string) {
  try {
    if ((action === 'create' || action === 'resolve') && !await rateLimit(req, action)) return reply({ error: 'Too many attempts. Please wait one minute.' }, 429);
    const json = req.method === 'POST' && action !== 'upload' ? await readJsonBody(req) : undefined;
    let id = req.nextUrl.searchParams.get('sessionId');
    if (action === 'resolve') {
      const code = req.nextUrl.searchParams.get('code') || '';
      if (/^\d{6}$/.test(code)) id = (await byCode(code))?.id || null;
    } else if (!id && action !== 'create' && req.method === 'POST') {
      id = typeof json?.sessionId === 'string' ? json.sessionId : null;
    }
    if (id && action !== 'resolve') {
      const token = req.headers.get('authorization')?.replace(/^Bearer /, '');
      const session = await readSession(id);
      if (!session || !token || (token !== session.ownerToken && token !== session.operatorToken)) return reply({ error: 'Session access denied.' }, 403);
    }
    return id ? await withSessionLock(id, () => handle(req, action, json)) : await handle(req, action, json);
  } catch (err) {
    if (err instanceof RequestError) return reply({ error: err.message }, err.status);
    console.error(`[dispatch error ${action}]:`, err);
    return reply({ error: 'Session is busy. Please retry.' }, 409);
  }
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ action: string }> }) { return dispatch(req, (await ctx.params).action); }
export async function GET(req: NextRequest, ctx: { params: Promise<{ action: string }> }) { return dispatch(req, (await ctx.params).action); }
