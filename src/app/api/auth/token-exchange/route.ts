import { NextRequest, NextResponse } from 'next/server';
import { setAuthCookie } from '@/lib/server/auth';
import { UserProfile } from '@/lib/types';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wrxqpmsimbimoxgmdpel.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json();
    if (!accessToken) {
      return NextResponse.json({ error: 'Missing access token' }, { status: 400 });
    }

    const userRes = await fetch(new URL('/auth/v1/user', SUPABASE_URL), {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userRes.ok) {
      return NextResponse.json({ error: 'Invalid user token' }, { status: 401 });
    }

    const rawUser = await userRes.json();
    const profile: UserProfile = {
      id: rawUser.id,
      email: rawUser.email,
      name: rawUser.user_metadata?.full_name || rawUser.user_metadata?.name || rawUser.email.split('@')[0],
      avatarUrl: rawUser.user_metadata?.avatar_url || rawUser.user_metadata?.picture,
      role: 'user',
      createdAt: Date.now(),
    };

    const response = NextResponse.json({ ok: true, user: profile });
    setAuthCookie(profile, response.headers);
    return response;
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
