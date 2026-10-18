import { NextRequest, NextResponse } from 'next/server';
import { readJsonBody, RequestError } from '@/lib/server/request';
import { loginShopOwnerUser, setAuthCookie } from '@/lib/server/auth';
import { getShopByOwnerId } from '@/lib/server/shops-store';
import { z } from 'zod';
import { rateLimit } from '@/lib/server/rate-limit';

const LoginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(1, 'Please enter your password').max(256),
});

export async function POST(request: NextRequest) {
  try {
    if (!await rateLimit(request, 'login')) return NextResponse.json({ error: 'Too many attempts. Please wait one minute.' }, { status: 429 });
    const json = await readJsonBody(request);
    const parsed = LoginSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid email or password' },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const user = await loginShopOwnerUser(email, password);
    const shop = await getShopByOwnerId(user.id);

    const response = NextResponse.json({ ok: true, user, shop });
    setAuthCookie(user, response.headers);
    return response;
  } catch (err) {
    if (err instanceof RequestError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json(
      { error: (err as Error).message || 'Invalid email or password' },
      { status: 401 }
    );
  }
}
