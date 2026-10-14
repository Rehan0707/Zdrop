import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wrxqpmsimbimoxgmdpel.supabase.co';

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const redirectParam = request.nextUrl.searchParams.get('redirect') || '/';

  // Construct OAuth callback target
  const callbackUrl = `${origin}/api/auth/callback?redirect=${encodeURIComponent(redirectParam)}`;

  // Redirect to Supabase Google OAuth endpoint
  const authUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(callbackUrl)}`;

  return NextResponse.redirect(authUrl);
}
