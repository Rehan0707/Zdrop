import { NextRequest } from 'next/server';
import { active, getFile, readSession, withSessionLock, signedFileUrl } from '@/lib/server/store';
export const runtime = 'nodejs';
async function serve(req: NextRequest) {
  const s = await readSession(req.nextUrl.searchParams.get('sessionId') || '');
  const token = req.nextUrl.searchParams.get('token');
  if (!s || !token || token !== s.operatorToken || !await active(s)) return new Response('File unavailable', { status: 410 });
  const f = s.files.find(f => f.fileId === req.nextUrl.searchParams.get('fileId'));
  if (!f) return new Response('Not found', { status: 404 });
  const signed = await signedFileUrl(s, f.fileId);
  if (signed) return new Response(null, { status: 302, headers: { Location: signed, 'Cache-Control': 'no-store, no-cache, must-revalidate, private, max-age=0', 'Referrer-Policy': 'no-referrer', 'X-Download-Options': 'noopen' } });
  return new Response(new Uint8Array(await getFile(s.id, f.fileId)), {
    headers: {
      'Content-Type': f.type,
      'Cache-Control': 'no-store, no-cache, must-revalidate, private, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Content-Disposition': `${f.type.includes('wordprocessing') ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(f.name)}`,
      'X-Content-Type-Options': 'nosniff',
      'X-Download-Options': 'noopen',
      'Referrer-Policy': 'no-referrer',
    },
  });
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('sessionId') || '';
  const session = await readSession(id);
  const token = req.nextUrl.searchParams.get('token');
  if (!session || !token || token !== session.operatorToken) return new Response('File unavailable', { status: 410 });
  return serve(req);
}
