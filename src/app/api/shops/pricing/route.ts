import { NextRequest, NextResponse } from 'next/server';
import { updateShopPricing } from '@/lib/server/shops-store';
import { getAuthUserFromCookie } from '@/lib/server/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUserFromCookie(req.headers.get('cookie'));
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { shopId, pricing } = await req.json();
    if (!shopId || !pricing) {
      return NextResponse.json({ error: 'Shop ID and pricing are required.' }, { status: 400 });
    }

    // Verify user owns the shop (or is admin/shop_owner)
    if (user.role === 'shop_owner' && user.shopId && user.shopId !== shopId) {
      return NextResponse.json({ error: 'Access denied for this shop.' }, { status: 403 });
    }

    const updatedShop = await updateShopPricing(shopId, pricing);
    return NextResponse.json({ shop: updatedShop });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
