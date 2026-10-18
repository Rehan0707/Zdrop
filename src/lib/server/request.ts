import 'server-only';

export class RequestError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}

export async function readJsonBody(request: Request, max = 16384): Promise<any> {
  if (Number(request.headers.get('content-length')) > max) throw new RequestError('Request too large.', 413);
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError('Request body required.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    size += chunk.value.length;
    if (size > max) { await reader.cancel(); throw new RequestError('Request too large.', 413); }
    chunks.push(chunk.value);
  }
  let result: unknown;
  try { result = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new RequestError('Invalid JSON request.'); }
  if (!result || typeof result !== 'object' || Array.isArray(result)) throw new RequestError('JSON object required.');
  return result;
}

export function safeRedirectTarget(value: string | null, origin: string) {
  try {
    const target = new URL(value || '/', origin);
    if (target.origin === origin) return `${target.pathname}${target.search}${target.hash}`;
  } catch { /* invalid URL */ }
  return '/';
}
