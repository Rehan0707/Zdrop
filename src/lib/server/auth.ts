import 'server-only';
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { UserProfile } from '../types';
import { getShopByOwnerId } from './shops-store';

const AUTH_COOKIE_NAME = 'zdrop_auth';
const AUTH_SECRET = process.env.SUPABASE_SECRET_KEY || process.env.RATE_LIMIT_SECRET || 'zdrop-auth-secure-secret-key-32chars';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wrxqpmsimbimoxgmdpel.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const localDir = path.resolve(process.env.ZDROP_DATA_DIR || (process.env.VERCEL ? path.join('/tmp', '.zdrop-data') : '.zdrop-data'));
const localAccountsFile = path.join(localDir, 'shop_accounts.json');

// --- Token & Cookie Management (HMAC signed payload) ---

export function signToken(user: UserProfile, maxAgeMs = 7 * 24 * 60 * 60 * 1000): string {
  const payload = {
    ...user,
    exp: Date.now() + maxAgeMs,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', AUTH_SECRET).update(body).digest('base64url');
  return `${body}.${signature}`;
}

export function verifyToken(token: string): UserProfile | null {
  try {
    const [body, signature] = token.split('.');
    if (!body || !signature) return null;
    const expected = createHmac('sha256', AUTH_SECRET).update(body).digest('base64url');
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

async function readLocalAccounts(): Promise<Record<string, LocalAccount>> {
  try {
    const raw = await readFile(localAccountsFile, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeLocalAccounts(accounts: Record<string, LocalAccount>): Promise<void> {
  await mkdir(localDir, { recursive: true });
  await writeFile(localAccountsFile, JSON.stringify(accounts, null, 2), 'utf8');
}

// --- Shop Owner Auth Actions ---

export async function registerShopOwnerUser(data: {
  email: string;
  password: string;
  name: string;
}): Promise<UserProfile> {
  const cleanEmail = data.email.trim().toLowerCase();

  // Try Supabase Auth Admin first if configured
  if (SUPABASE_KEY && SUPABASE_URL) {
    try {
      const res = await fetch(new URL('/auth/v1/admin/users', SUPABASE_URL), {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: cleanEmail,
          password: data.password,
          email_confirm: true,
          user_metadata: {
            full_name: data.name,
            role: 'shop_owner',
          },
        }),
      });

      if (res.ok) {
        const json = await res.json();
        return {
          id: json.id,
          email: cleanEmail,
          name: data.name,
          role: 'shop_owner',
          createdAt: Date.now(),
        };
      }
      const errJson = await res.json().catch(() => ({}));
      if (errJson.msg?.includes('already been registered') || errJson.message?.includes('already registered')) {
        throw new Error('An account with this email address already exists. Please log in instead.');
      }
    } catch (e) {
      if ((e as Error).message.includes('already exists')) throw e;
      console.warn('Supabase auth register error, fallback to local accounts:', e);
    }
  }

  // Local fallback
  const accounts = await readLocalAccounts();
  if (accounts[cleanEmail]) {
    throw new Error('An account with this email address already exists. Please log in instead.');
  }

  const accountId = `usr_${randomBytes(16).toString('hex')}`;
  const now = Date.now();
  accounts[cleanEmail] = {
    id: accountId,
    email: cleanEmail,
    name: data.name,
    passwordHash: hashPassword(data.password),
    role: 'shop_owner',
    createdAt: now,
  };
  await writeLocalAccounts(accounts);

  return {
    id: accountId,
    email: cleanEmail,
    name: data.name,
    role: 'shop_owner',
    createdAt: now,
  };
}

export async function loginShopOwnerUser(email: string, password: string): Promise<UserProfile> {
  const cleanEmail = email.trim().toLowerCase();

  // Try Supabase Auth login if configured
  if (SUPABASE_KEY && SUPABASE_URL) {
    try {
      const res = await fetch(new URL('/auth/v1/token?grant_type=password', SUPABASE_URL), {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      if (res.ok) {
        const json = await res.json();
        const user = json.user;
        const shop = await getShopByOwnerId(user.id);
        return {
          id: user.id,
          email: cleanEmail,
          name: user.user_metadata?.full_name || cleanEmail.split('@')[0],
          role: 'shop_owner',
          shopId: shop?.id,
          createdAt: Date.now(),
        };
      }
    } catch {
      // Fallback to local
    }
  }

  // Local accounts check
  const accounts = await readLocalAccounts();
  const account = accounts[cleanEmail];
  if (!account || !verifyPassword(password, account.passwordHash)) {
    throw new Error('Invalid email or password. Please try again.');
  }

  const shop = await getShopByOwnerId(account.id);
  return {
    id: account.id,
    email: account.email,
    name: account.name,
    role: 'shop_owner',
    shopId: shop?.id,
    createdAt: account.createdAt,
  };
}
