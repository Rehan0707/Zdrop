import { NextRequest, NextResponse } from 'next/server';
import { setAuthCookie } from '@/lib/server/auth';
import { UserProfile } from '@/lib/types';
import { randomUUID } from 'node:crypto';

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse(null, { status: 404 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const email = body.email || 'sample.customer@example.test';
    const name = body.name || 'Sample Customer';

    const profile: UserProfile = {
      id: `usr_${randomUUID()}`,
      email,
      name,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
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
