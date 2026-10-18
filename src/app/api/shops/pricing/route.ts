import { NextRequest, NextResponse } from 'next/server';
import { readJsonBody, RequestError } from '@/lib/server/request';
import { updateShopPricing, getShopById } from '@/lib/server/shops-store';
import { getAuthUserFromCookie } from '@/lib/server/auth';
import { ShopPricingSchema } from '@/lib/types';
import { z } from 'zod';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUserFromCookie(req.headers.get('cookie'));
    if (!user || user.role !== 'shop_owner') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { shopId, pricing } = z.object({ shopId: z.string().regex(/^shop_[a-f0-9-]{36}$/), pricing: ShopPricingSchema }).parse(await readJsonBody(req));

    // Verify user owns the shop (or is admin/shop_owner)
    const shop = await getShopById(shopId);
    if (!shop || shop.ownerId !== user.id) {
      return NextResponse.json({ error: 'Access denied for this shop.' }, { status: 403 });
    }

    const updatedShop = await updateShopPricing(shopId, user.id, pricing);
    return NextResponse.json({ shop: updatedShop });
  } catch (err) {
    if (err instanceof RequestError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: err instanceof z.ZodError ? err.issues[0].message : 'Pricing could not be saved. Please retry.' }, { status: err instanceof z.ZodError || err instanceof SyntaxError ? 400 : 503 });
  }
}
