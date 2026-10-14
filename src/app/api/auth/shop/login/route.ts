import { NextRequest, NextResponse } from 'next/server';
import { loginShopOwnerUser, setAuthCookie } from '@/lib/server/auth';
import { getShopByOwnerId } from '@/lib/server/shops-store';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Please enter your password'),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
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
    return NextResponse.json(
      { error: (err as Error).message || 'Invalid email or password' },
      { status: 401 }
    );
  }
}
