import 'server-only';
import { randomUUID } from 'node:crypto';
import { ShopProfile, ShopPricing, PublicShop } from '../types';
import { metadataRpc } from './supabase';
import { isCloud } from './store';
import { readRecords, mutateRecords } from './local-records';

export function publicShop(shop: ShopProfile): PublicShop {
  const { id, shopName, campusAddress, shopCode, pricing } = shop;
  return { id, shopName, campusAddress, shopCode, pricing };
}

export async function createShop(data: Omit<ShopProfile, 'id' | 'createdAt' | 'isActive' | 'pricing'>): Promise<ShopProfile> {
  const shop: ShopProfile = { ...data, id: `shop_${randomUUID()}`, createdAt: Date.now(), isActive: true };
  if (isCloud) return metadataRpc<ShopProfile>('zdrop_create_shop', { p_shop: shop });
  return mutateRecords<ShopProfile, ShopProfile>('shops', shops => {
    if (Object.values(shops).some(s => s.isActive && (s.shopCode === shop.shopCode || s.ownerId === shop.ownerId))) {
      throw new Error('Shop code or owner is already registered. Please log in or choose another code.');
    }
    shops[shop.id] = shop;
    return shop;
  });
}

export async function getShopByOwnerId(ownerId: string): Promise<ShopProfile | null> {
  if (isCloud) return metadataRpc('zdrop_get_shop_by_owner', { p_owner_id: ownerId });
  return Object.values(await readRecords<ShopProfile>('shops')).find(s => s.isActive && s.ownerId === ownerId) || null;
}

export async function getShopByCode(code: string): Promise<ShopProfile | null> {
  const cleanCode = code.trim().toUpperCase();
  if (isCloud) return metadataRpc('zdrop_get_shop_by_code', { p_code: cleanCode });
  return Object.values(await readRecords<ShopProfile>('shops')).find(s => s.isActive && s.shopCode === cleanCode) || null;
}

export async function getShopById(id: string): Promise<ShopProfile | null> {
  if (isCloud) return metadataRpc('zdrop_get_shop_by_id', { p_id: id });
  const shop = (await readRecords<ShopProfile>('shops'))[id];
  return shop?.isActive ? shop : null;
}

export async function listShops(): Promise<ShopProfile[]> {
  if (isCloud) return metadataRpc('zdrop_list_shops');
  return Object.values(await readRecords<ShopProfile>('shops')).filter(s => s.isActive).sort((a, b) => a.shopName.localeCompare(b.shopName));
}

export async function updateShopPricing(shopId: string, ownerId: string, pricing: ShopPricing): Promise<ShopProfile> {
  if (isCloud) return metadataRpc('zdrop_update_shop_pricing', { p_shop_id: shopId, p_owner_id: ownerId, p_pricing: pricing });
  return mutateRecords<ShopProfile, ShopProfile>('shops', shops => {
    const shop = shops[shopId];
    if (!shop?.isActive || shop.ownerId !== ownerId) throw new Error('Access denied for this shop.');
    shop.pricing = pricing;
    return shop;
  });
}
