import { NextRequest, NextResponse } from 'next/server';
import { setAuthCookie } from '@/lib/server/auth';
import { safeRedirectTarget } from '@/lib/server/request';
import { UserProfile } from '@/lib/types';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wrxqpmsimbimoxgmdpel.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get('code');
  const redirectTarget = safeRedirectTarget(url.searchParams.get('redirect'), url.origin);
  const errorDesc = url.searchParams.get('error_description') || url.searchParams.get('error');

  if (errorDesc) {
    const errorUrl = new URL('/', url.origin);
    errorUrl.searchParams.set('auth_error', errorDesc);
    return NextResponse.redirect(errorUrl);
  }

  if (code) {
    try {
      // Exchange code for token with Supabase Auth
      const tokenRes = await fetch(new URL('/auth/v1/token?grant_type=authorization_code', SUPABASE_URL), {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
        }),
      });

      if (!tokenRes.ok) {
        throw new Error(`Token exchange failed: ${tokenRes.status}`);
      }

      const tokenData = await tokenRes.json();
      const rawUser = tokenData.user;

      const profile: UserProfile = {
        id: rawUser.id,
        email: rawUser.email,
        name: rawUser.user_metadata?.full_name || rawUser.user_metadata?.name || rawUser.email.split('@')[0],
        avatarUrl: rawUser.user_metadata?.avatar_url || rawUser.user_metadata?.picture,
        role: 'user',
        createdAt: Date.now(),
      };

      const response = NextResponse.redirect(new URL(redirectTarget, url.origin));
      setAuthCookie(profile, response.headers);
      return response;
    } catch (e) {
      console.error('OAuth code exchange error:', e);
      const fallbackUrl = new URL('/', url.origin);
      fallbackUrl.searchParams.set('auth_error', 'OAuth authentication failed. Please try again.');
      return NextResponse.redirect(fallbackUrl);
    }
  }

  // If OAuth returned tokens in the URL hash fragment (#access_token=...),
  // render a tiny helper page to forward it to /api/auth/token-exchange
  const html = `<!DOCTYPE html>
<html>
<head><title>Completing Sign-In...</title></head>
<body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#090d16;color:#fff;">
  <p>Completing Google sign in, please wait...</p>
  <script>
    (async () => {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      if (accessToken) {
        const res = await fetch('/api/auth/token-exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken })
        });
        if (res.ok) {
          window.location.href = ${JSON.stringify(redirectTarget).replace(/</g, '\\u003c')};
          return;
        }
      }
      window.location.href = '/?auth_error=' + encodeURIComponent('Failed to complete sign-in.');
    })();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' },
  });
}
