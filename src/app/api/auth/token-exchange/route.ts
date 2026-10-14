import { NextRequest, NextResponse } from 'next/server';
import { setAuthCookie } from '@/lib/server/auth';
import { UserProfile } from '@/lib/types';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wrxqpmsimbimoxgmdpel.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBh7JWcsrAd1g9isPWpQSJlyoTHjKuBS20';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, idToken } = body;

    if (!accessToken && !idToken) {
      return NextResponse.json({ error: 'Missing authentication credentials' }, { status: 400 });
    }

    let profile: UserProfile | null = null;

    // Verify Firebase ID tokens with the Firebase Auth API. Never trust client profile fields.
    if (idToken) {
      try {
          const fbVerifyRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });
          if (fbVerifyRes.ok) {
            const fbData = await fbVerifyRes.json();
            const u = fbData.users?.[0];
            if (u) {
              profile = {
                id: u.localId,
                email: u.email,
                name: u.displayName || u.email?.split('@')[0] || 'User',
                avatarUrl: u.photoUrl,
                role: 'user',
                createdAt: Date.now(),
              };
            }
          }
      } catch (err) {
        console.warn('Firebase accounts:lookup check failed:', err);
      }
    }
    // Existing Supabase sessions remain supported.
    if (!profile && accessToken) {
      const userRes = await fetch(new URL('/auth/v1/user', SUPABASE_URL), {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (userRes.ok) {
        const raw = await userRes.json();
        profile = {
          id: raw.id,
          email: raw.email,
          name: raw.user_metadata?.full_name || raw.user_metadata?.name || raw.email.split('@')[0],
          avatarUrl: raw.user_metadata?.avatar_url || raw.user_metadata?.picture,
          role: 'user',
          createdAt: Date.now(),
        };
      }
    }

    if (!profile) {
      return NextResponse.json({ error: 'Failed to verify user credentials' }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true, user: profile });
    setAuthCookie(profile, response.headers);
    return response;
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
