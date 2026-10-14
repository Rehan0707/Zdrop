import 'server-only';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { ShopProfile } from '../types';
import { metadataRpc } from './supabase';
import { isCloud } from './store';

const localDir = path.resolve(process.env.ZDROP_DATA_DIR || (process.env.VERCEL ? path.join('/tmp', '.zdrop-data') : '.zdrop-data'));
const localShopsFile = path.join(localDir, 'shops.json');

async function readLocalShops(): Promise<Record<string, ShopProfile>> {
  try {
    const raw = await readFile(localShopsFile, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeLocalShops(shops: Record<string, ShopProfile>): Promise<void> {
  await mkdir(localDir, { recursive: true });
  await writeFile(localShopsFile, JSON.stringify(shops, null, 2), 'utf8');
}

export async function createShop(data: {
  ownerId: string;
  ownerEmail: string;
  shopName: string;
  ownerName: string;
  phone: string;
  campusAddress: string;
  shopCode: string;
}): Promise<ShopProfile> {
  const shopId = `shop_${randomUUID()}`;
  const now = Date.now();
  const cleanCode = data.shopCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');

  const shop: ShopProfile = {
    id: shopId,
    ownerId: data.ownerId,
    ownerEmail: data.ownerEmail,
    shopName: data.shopName.trim(),
    ownerName: data.ownerName.trim(),
    phone: data.phone.trim(),
    campusAddress: data.campusAddress.trim(),
    shopCode: cleanCode || `SHOP-${randomUUID().slice(0, 4).toUpperCase()}`,
    createdAt: now,
    isActive: true,
  };

  if (isCloud) {
    try {
      const res = await metadataRpc<ShopProfile>('zdrop_create_shop', { p_shop: shop });
      if (res && res.id) return res;
    } catch (err) {
      console.warn('Supabase zdrop_create_shop failed or unmigrated, falling back to local:', err);
    }
  }

  // Local storage fallback
  const shops = await readLocalShops();
  // Check code uniqueness
  const codeExists = Object.values(shops).some(
    s => s.isActive && s.shopCode.toUpperCase() === shop.shopCode.toUpperCase()
  );
  if (codeExists) {
    throw new Error(`Shop code "${shop.shopCode}" is already taken. Please choose another.`);
  }

  shops[shop.id] = shop;
  await writeLocalShops(shops);
  return shop;
}

export async function getShopByOwnerId(ownerId: string): Promise<ShopProfile | null> {
  if (isCloud) {
    try {
      const res = await metadataRpc<ShopProfile | null>('zdrop_get_shop_by_owner', { p_owner_id: ownerId });
      if (res) return res;
    } catch {
      // Fallback to local
    }
  }

  const shops = await readLocalShops();
  return Object.values(shops).find(s => s.isActive && s.ownerId === ownerId) || null;
}

export async function getShopByCode(code: string): Promise<ShopProfile | null> {
  const cleanCode = code.trim().toUpperCase();
  if (isCloud) {
    try {
      const res = await metadataRpc<ShopProfile | null>('zdrop_get_shop_by_code', { p_code: cleanCode });
      if (res) return res;
    } catch {
      // Fallback to local
    }
  }

  const shops = await readLocalShops();
  return Object.values(shops).find(s => s.isActive && s.shopCode.toUpperCase() === cleanCode) || null;
}

export async function getShopById(id: string): Promise<ShopProfile | null> {
  const shops = await readLocalShops();
  return shops[id] || null;
}

export async function listShops(): Promise<ShopProfile[]> {
  if (isCloud) {
    try {
      const res = await metadataRpc<ShopProfile[]>('zdrop_list_shops', {});
      if (Array.isArray(res) && res.length > 0) return res;
    } catch {
      // Fallback to local
    }
  }

  const shops = await readLocalShops();
  return Object.values(shops).filter(s => s.isActive);
}

export async function updateShopPricing(
  shopId: string,
  pricing: Partial<import('../types').ShopPricing>
): Promise<ShopProfile> {
  const shops = await readLocalShops();
  const shop = shops[shopId];
  if (!shop) throw new Error('Shop not found.');

  shop.pricing = {
    bwRate: Math.max(0.1, Number(pricing.bwRate) || 2),
    colorRate: Math.max(0.1, Number(pricing.colorRate) || 10),
    duplexDiscount: Math.max(0, Number(pricing.duplexDiscount) || 0),
    currencySymbol: pricing.currencySymbol?.trim() || '₹',
    upiId: pricing.upiId?.trim() || '',
  };

  shops[shopId] = shop;
  await writeLocalShops(shops);

  if (isCloud) {
    try {
      await metadataRpc('zdrop_update_shop_pricing', { p_shop_id: shopId, p_pricing: shop.pricing });
    } catch (err) {
      console.warn('Supabase zdrop_update_shop_pricing fallback to local:', err);
    }
  }

  return shop;
}
