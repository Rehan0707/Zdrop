import { NextRequest, NextResponse } from 'next/server';
import { registerShopOwnerUser, setAuthCookie } from '@/lib/server/auth';
import { createShop, getShopByCode } from '@/lib/server/shops-store';
import { z } from 'zod';

const RegisterShopSchema = z.object({
  shopName: z.string().min(2, 'Shop name must be at least 2 characters').max(60),
  ownerName: z.string().min(2, 'Owner name must be at least 2 characters').max(60),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().min(7, 'Please enter a valid phone number').max(20),
  campusAddress: z.string().min(3, 'Please specify campus or location address').max(150),
  shopCode: z.string().min(3, 'Shop code must be at least 3 characters').max(20).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = RegisterShopSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid input data' },
        { status: 400 }
      );
    }

    const { shopName, ownerName, email, password, phone, campusAddress, shopCode } = parsed.data;

    // Generate code if not supplied
    const cleanCode = (shopCode || shopName.slice(0, 8))
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 10);

    const existingShop = await getShopByCode(cleanCode);
    if (existingShop) {
      return NextResponse.json(
        { error: `Shop code "${cleanCode}" is already in use. Please select a custom shop code.` },
        { status: 400 }
      );
    }

    // 1. Create or register user in Auth
    const user = await registerShopOwnerUser({
      email,
      password,
      name: ownerName,
    });

    // 2. Create Shop record
    const shop = await createShop({
      ownerId: user.id,
      ownerEmail: user.email,
      shopName,
      ownerName,
      phone,
      campusAddress,
      shopCode: cleanCode,
    });

    user.shopId = shop.id;

    const response = NextResponse.json({ ok: true, user, shop });
    setAuthCookie(user, response.headers);
    return response;
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to create shop account' },
      { status: 400 }
    );
  }
}
