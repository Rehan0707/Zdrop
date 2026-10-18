import { NextResponse } from 'next/server';
import { listShops, publicShop } from '@/lib/server/shops-store';

export async function GET() {
  try {
    const shops = await listShops();
    return NextResponse.json({ shops: shops.map(publicShop) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
