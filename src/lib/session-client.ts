import { FileMetadata, PrintPreferences, SessionData } from './types';

const tokens = new Map<string, string>();

async function request(url: string, options?: RequestInit) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(url, {
      ...options,
      signal: options?.signal || controller.signal,
      cache: 'no-store',
    });
    const text = await response.text();
    let result: any = null;
    try {
      result = text ? JSON.parse(text) : {};
    } catch {
      result = { error: response.statusText || 'Server communication error.' };
    }
    if (!response.ok) {
      throw new Error(result?.error || `Request failed (${response.status}).`);
    }
    return result;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Connection timed out. Please check your network and retry.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function createSession(
  files: FileMetadata[],
  preferences: PrintPreferences,
  progress?: (percent: number) => void,
  shop?: { id: string; name: string }
): Promise<SessionData> {
  const result = await request('/api/sessions/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      files: files.map(f => ({ fileName: f.name, fileSize: f.size, mimeType: f.type, pageCount: f.pageCount })),
      preferences,
      shopId: shop?.id,
      shopName: shop?.name,
    }),
  });

  const s: SessionData = result.session;
  tokens.set(s.id, result.token);

  try {
    if (result.upload) {
      const { uploadCloud } = await import('./cloud-upload');
      await uploadCloud(s, files, result.upload, progress);
    } else {
      for (let i = 0; i < files.length; i++) {
        if (!files[i].file) throw new Error('Please select your files again.');
        await request(`/api/sessions/upload?sessionId=${s.id}&fileId=${s.files[i].fileId}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${result.token}` },
          body: files[i].file,
        });
        progress?.(Math.round(((i + 1) / files.length) * 100));
      }
    }

    const confirmed = await request('/api/sessions/confirm', {
      method: 'POST',
      headers: { Authorization: `Bearer ${result.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: s.id }),
    });

    files.forEach(f => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });

    sessionStorage.setItem('zdrop-session', JSON.stringify({ id: s.id, token: result.token }));
    return confirmed.session;
  } catch (error) {
    await deleteSession(s.id).catch(() => {});
    throw error;
  }
}

export async function resolveByAccessCode(code: string): Promise<SessionData> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const result = await request(`/api/sessions/resolve?code=${encodeURIComponent(code)}`);
      tokens.set(result.session.id, result.token);
      return result.session;
    } catch (e: any) {
      lastError = e;
      const msg = e?.message || '';
      if (attempt < 3 && (msg.includes('busy') || msg.includes('still in progress'))) {
        await new Promise((r) => setTimeout(r, 600 + attempt * 400));
        continue;
      }
      throw e;
    }
  }
  throw lastError || new Error('Session busy. Please retry.');
}

export async function deleteSession(id: string): Promise<SessionData> {
  const result = await request('/api/sessions/delete', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokens.get(id)}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: id }),
  });
  sessionStorage.removeItem('zdrop-session');
  return result.session;
}

export async function updateSessionPayment(
  id: string,
  paymentStatus: "PAID_ONLINE" | "PAID_COUNTER" | "UNPAID",
  paymentMethod: "UPI" | "CASH" | "COUNTER" = "COUNTER"
): Promise<SessionData> {
  const result = await request('/api/sessions/payment', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokens.get(id)}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: id, paymentStatus, paymentMethod }),
  });
  return result.session;
}

export async function restoreSession(): Promise<SessionData | null> {
  const raw = sessionStorage.getItem('zdrop-session');
  if (!raw) return null;
  try {
    const { id, token } = JSON.parse(raw);
    tokens.set(id, token);
    const r = await request(`/api/sessions/status?sessionId=${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r?.session || ['DELETED', 'EXPIRED'].includes(r.session.status)) {
      sessionStorage.removeItem('zdrop-session');
      return null;
    }
    return r.session;
  } catch {
    sessionStorage.removeItem('zdrop-session');
    return null;
  }
}

export function subscribeToSession(
  id: string,
  callback: (s: SessionData) => void,
  onError?: (message: string) => void
) {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout>;

  const poll = async () => {
    try {
      const r = await request(`/api/sessions/status?sessionId=${id}`, {
        headers: { Authorization: `Bearer ${tokens.get(id)}` },
      });
      if (!stopped) {
        callback(r.session);
        if (['DELETED', 'EXPIRED'].includes(r.session.status)) stopped = true;
      }
    } catch (e: any) {
      if (!stopped && e.message !== 'The operation could not be completed. Please retry.') {
        onError?.(e.message || 'Connection interrupted. Retrying session status…');
      }
    }
    if (!stopped) timer = setTimeout(poll, 2000);
  };

  void poll();
  return () => {
    stopped = true;
    clearTimeout(timer);
  };
}
