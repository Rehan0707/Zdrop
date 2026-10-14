import { NextRequest, NextResponse } from 'next/server';
import { getShopByCode } from '@/lib/server/shops-store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const shop = await getShopByCode(code);
    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }
    return NextResponse.json({ shop });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
