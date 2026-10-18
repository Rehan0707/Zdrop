import { createHmac } from 'node:crypto';
import { NextRequest } from 'next/server';
import { isCloud } from './store';
import { metadataRpc } from './supabase';
const limits = new Map<string, { count: number; reset: number }>();
export async function rateLimit(req: NextRequest, operation: string) {
  // Only trust forwarded IPs behind the configured hosting proxy, or x-test-ip in local/test mode.
  const testIp = !isCloud ? req.headers.get('x-test-ip') : null;
  const ip = testIp || (process.env.VERCEL ? req.headers.get('x-vercel-forwarded-for')?.split(',')[0] : process.env.ZDROP_TRUST_PROXY === 'true' ? req.headers.get('x-forwarded-for')?.split(',')[0] : 'local');
  const secret = process.env.RATE_LIMIT_SECRET || process.env.CRON_SECRET;
  if (isCloud && !secret) throw new Error('RATE_LIMIT_SECRET must be configured.');
  const key = createHmac('sha256', secret || 'local-development').update(`${operation}:${ip || 'unknown'}`).digest('hex');
  const max = testIp || isCloud || process.env.VERCEL ? (operation === 'create' || operation === 'register' ? 10 : 30) : 1000;
  const now = Date.now();
  if (isCloud) return metadataRpc<boolean>('zdrop_rate_limit', { p_key: key, p_max: max });
  for (const [k, v] of limits) if (v.reset <= now) limits.delete(k);
  const current = limits.get(key) || { count: 0, reset: now + 60000 };
  if (current.count >= max) return false;
  current.count++; limits.set(key, current); return true;
}
