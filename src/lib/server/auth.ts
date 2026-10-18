import 'server-only';
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { UserProfile } from '../types';
import { getShopByOwnerId } from './shops-store';
import { isCloud } from './store';
import { readRecords, mutateRecords } from './local-records';

const AUTH_COOKIE_NAME = 'zdrop_auth';
const AUTH_SECRET = process.env.ZDROP_AUTH_SECRET || process.env.SUPABASE_SECRET_KEY || process.env.RATE_LIMIT_SECRET || (process.env.NODE_ENV !== 'production' ? 'zdrop-auth-secure-secret-key-32chars' : '');

function authSecret(): string {
  if (!AUTH_SECRET) {
    throw new Error('ZDROP_AUTH_SECRET must be configured before issuing or verifying sessions');
  }
  return AUTH_SECRET;
}
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// --- Token & Cookie Management (HMAC signed payload) ---

export function signToken(user: UserProfile, maxAgeMs = 7 * 24 * 60 * 60 * 1000): string {
  const payload = {
    ...user,
    exp: Date.now() + maxAgeMs,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', authSecret()).update(body).digest('base64url');
  return `${body}.${signature}`;
}

export function verifyToken(token: string): UserProfile | null {
  try {
    const [body, signature] = token.split('.');
    if (!body || !signature) return null;
    const expected = createHmac('sha256', authSecret()).update(body).digest('base64url');
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload.exp || Date.now() > payload.exp) return null;

    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      avatarUrl: payload.avatarUrl,
      role: payload.role,
      shopId: payload.shopId,
      createdAt: payload.createdAt,
    };
  } catch {
    return null;
  }
}

export function getAuthUserFromCookie(cookieHeader: string | null): UserProfile | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.split(';').map(c => c.trim()).find(c => c.startsWith(`${AUTH_COOKIE_NAME}=`));
  if (!match) return null;
  const token = match.substring(`${AUTH_COOKIE_NAME}=`.length);
  return verifyToken(token);
}

export function setAuthCookie(user: UserProfile, headers: Headers): void {
  const token = signToken(user);
  const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds
  const isSecure = process.env.NODE_ENV === 'production';
  const cookieValue = `${AUTH_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${isSecure ? '; Secure' : ''}`;
  headers.append('Set-Cookie', cookieValue);
}

export function clearAuthCookie(headers: Headers): void {
  const cookieValue = `${AUTH_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  headers.append('Set-Cookie', cookieValue);
}

// --- Local Password Hashing (Fallback for offline shop accounts) ---

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, key] = stored.split(':');
    if (!salt || !key) return false;
    const hash = scryptSync(password, salt, 64);
    return timingSafeEqual(Buffer.from(key, 'hex'), hash);
  } catch {
    return false;
  }
}

interface LocalAccount {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: 'shop_owner';
  createdAt: number;
}

async function authRequest(endpoint: string, body: unknown, admin = false) {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Shop authentication is not configured.');
  const res = await fetch(new URL(`/auth/v1/${endpoint}`, SUPABASE_URL), {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, ...(admin && !SUPABASE_KEY.startsWith('sb_secret_') ? { Authorization: `Bearer ${SUPABASE_KEY}` } : {}), 'Content-Type': 'application/json' },
    body: JSON.stringify(body), cache: 'no-store', signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    // Never persist hosted accounts to ephemeral disk or log upstream auth payloads.
    if (admin && res.status === 422) throw new Error('This account could not be created. If already registered, log in instead.');
    if (!admin && res.status === 400) throw new Error('Invalid email or password. Please try again.');
    throw new Error('Shop authentication is unavailable. Please retry.');
  }
  return res.json();
}

export async function registerShopOwnerUser(data: { email: string; password: string; name: string }): Promise<UserProfile> {
  const email = data.email.trim().toLowerCase();
  if (isCloud) {
    const user = await authRequest('admin/users', { email, password: data.password, email_confirm: true, user_metadata: { full_name: data.name } }, true);
    return { id: user.id, email, name: data.name, role: 'shop_owner', createdAt: Date.now() };
  }
  return mutateRecords<LocalAccount, UserProfile>('shop_accounts', accounts => {
    if (accounts[email]) throw new Error('An account with this email address already exists. Please log in instead.');
    const account: LocalAccount = { id: `usr_${randomBytes(16).toString('hex')}`, email, name: data.name, passwordHash: hashPassword(data.password), role: 'shop_owner', createdAt: Date.now() };
    accounts[email] = account;
    return { id: account.id, email, name: account.name, role: account.role, createdAt: account.createdAt };
  });
}

// Compensate only an account just created by an unsuccessful registration.
export async function rollbackShopRegistration(user: UserProfile) {
  if (isCloud) {
    if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Shop authentication is not configured.');
    const res = await fetch(new URL(`/auth/v1/admin/users/${encodeURIComponent(user.id)}`, SUPABASE_URL), {
      method: 'DELETE', headers: { apikey: SUPABASE_KEY, ...(!SUPABASE_KEY.startsWith('sb_secret_') ? { Authorization: `Bearer ${SUPABASE_KEY}` } : {}) }, signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error('Registration rollback failed.');
  } else {
    await mutateRecords<LocalAccount, void>('shop_accounts', accounts => { if (accounts[user.email]?.id === user.id) delete accounts[user.email]; });
  }
}

export async function loginShopOwnerUser(email: string, password: string): Promise<UserProfile> {
  const cleanEmail = email.trim().toLowerCase();
  if (isCloud) {
    const { user } = await authRequest('token?grant_type=password', { email: cleanEmail, password });
    const shop = await getShopByOwnerId(user.id);
    // A normal Supabase user cannot gain shop privileges via this endpoint.
    if (!shop) throw new Error('No print shop is registered to this account.');
    return { id: user.id, email: user.email, name: shop.ownerName, role: 'shop_owner', shopId: shop.id, createdAt: shop.createdAt };
  }
  const account = (await readRecords<LocalAccount>('shop_accounts'))[cleanEmail];
  if (!account || !verifyPassword(password, account.passwordHash)) throw new Error('Invalid email or password. Please try again.');
  const shop = await getShopByOwnerId(account.id);
  if (!shop) throw new Error('No print shop is registered to this account.');
  return { id: account.id, email: account.email, name: account.name, role: 'shop_owner', shopId: shop.id, createdAt: account.createdAt };
}
