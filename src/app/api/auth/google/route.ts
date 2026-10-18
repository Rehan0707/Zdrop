import { NextRequest, NextResponse } from 'next/server';

import { safeRedirectTarget } from '@/lib/server/request';

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const redirectParam = safeRedirectTarget(request.nextUrl.searchParams.get('redirect'), origin);

  // Redirect to application target with auth=google parameter
  const target = new URL(redirectParam, origin);
  target.searchParams.set('auth', 'google');

  return NextResponse.redirect(target);
}
