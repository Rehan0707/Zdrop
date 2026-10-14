import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromCookie } from '@/lib/server/auth';
import { getShopByOwnerId } from '@/lib/server/shops-store';

export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie');
  const user = getAuthUserFromCookie(cookieHeader);

  if (!user) {
    return NextResponse.json({ user: null, shop: null });
  }

  let shop = null;
  if (user.role === 'shop_owner') {
    shop = await getShopByOwnerId(user.id);
  }

  return NextResponse.json({ user, shop });
}
