import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wrxqpmsimbimoxgmdpel.supabase.co';

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const redirectParam = request.nextUrl.searchParams.get('redirect') || '/';

  // Redirect to application target with auth=google parameter
  const target = new URL(redirectParam, origin);
  target.searchParams.set('auth', 'google');

  return NextResponse.redirect(target);
}
