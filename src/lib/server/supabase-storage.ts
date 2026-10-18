import 'server-only';

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase configuration missing.');
  return { url: url.replace(/\/$/, ''), key };
}

const BUCKET = 'zdrop-documents';

export async function createSupabaseUploadUrl(filePath: string): Promise<string> {
  const { url, key } = getSupabaseConfig();
  const res = await fetch(`${url}/storage/v1/object/upload/sign/${BUCKET}/${filePath}`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    // A previously issued upload capability must never overwrite confirmed bytes.
    body: JSON.stringify({ upsert: false }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Supabase upload URL creation failed (${res.status})`);
  const data = await res.json();
  return `${url}/storage/v1${data.url}`;
}

export async function getSupabaseSignedUrl(filePath: string, expiresAt: number): Promise<string> {
  const { url, key } = getSupabaseConfig();
  const expiresIn = Math.max(10, Math.min(60, Math.floor((expiresAt - Date.now()) / 1000)));
  const res = await fetch(`${url}/storage/v1/object/sign/${BUCKET}/${filePath}`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ expiresIn }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Supabase signed URL generation failed (${res.status})`);
  const data = await res.json();
  return `${url}/storage/v1${data.signedURL}`;
}

export async function getSupabaseFileBytes(filePath: string): Promise<Buffer> {
  const { url, key } = getSupabaseConfig();
  const res = await fetch(`${url}/storage/v1/object/authenticated/${BUCKET}/${filePath}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Supabase file download failed (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

export async function putSupabaseFileBytes(filePath: string, bytes: Buffer, contentType: string): Promise<void> {
  const { url, key } = getSupabaseConfig();
  const res = await fetch(`${url}/storage/v1/object/${BUCKET}/${filePath}`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
    body: new Uint8Array(bytes),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Supabase file save failed (${res.status})`);
}

export async function deleteSupabaseFiles(paths: string[]): Promise<void> {
  if (!paths.length) return;
  const { url, key } = getSupabaseConfig();
  const res = await fetch(`${url}/storage/v1/object/${BUCKET}`, {
    method: 'DELETE',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    // Storage remove expects exact object paths, not a recursive directory prefix.
    body: JSON.stringify({ prefixes: paths }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Supabase delete failed (${res.status})`);
}
