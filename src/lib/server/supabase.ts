import 'server-only';

// Only server route handlers import this module. No Supabase key is sent to clients.
export async function metadataRpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase server configuration is missing.');
  const endpoint = new URL(url);
  if (endpoint.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(endpoint.hostname)) {
    throw new Error('Supabase requires HTTPS.');
  }
  const response = await fetch(new URL(`/rest/v1/rpc/${name}`, endpoint), {
    method: 'POST',
    headers: {
      apikey: key,
      // Supabase secret keys use apikey; legacy service-role keys are JWTs.
      ...(key.startsWith('sb_secret_') ? {} : { Authorization: `Bearer ${key}` }),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });
  // Never include upstream bodies, request headers, or keys in errors/logs.
  if (!response.ok) throw new Error(`Metadata operation ${name} failed (${response.status}).`);
  // PostgREST returns no body for PostgreSQL void functions (save/release/retire).
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
