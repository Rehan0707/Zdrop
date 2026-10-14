-- ZDrop shop accounts and directory.
-- Apply as the database owner in the Supabase SQL editor or migration runner.
begin;

create table if not exists zdrop_private.shops (
  id text primary key check (id ~ '^shop_[a-f0-9-]{36}$'),
  owner_id text not null,
  owner_email text not null,
  shop_name text not null,
  owner_name text not null,
  phone text not null,
  campus_address text not null,
  shop_code text not null unique,
  created_at bigint not null,
  is_active boolean not null default true
);

create index if not exists shops_owner on zdrop_private.shops (owner_id);
create index if not exists shops_code on zdrop_private.shops (shop_code);

alter table zdrop_private.shops enable row level security;
revoke all on zdrop_private.shops from public, anon, authenticated;
grant select, insert, update, delete on zdrop_private.shops to service_role;

create or replace function public.zdrop_create_shop(p_shop jsonb) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  s jsonb;
  n bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
begin
  if p_shop->>'id' is null or p_shop->>'ownerId' is null or p_shop->>'shopName' is null or p_shop->>'shopCode' is null then
    raise exception 'Missing required shop fields';
  end if;

  insert into zdrop_private.shops (
    id, owner_id, owner_email, shop_name, owner_name, phone, campus_address, shop_code, created_at, is_active
  ) values (
    p_shop->>'id',
    p_shop->>'ownerId',
    coalesce(p_shop->>'ownerEmail', ''),
    p_shop->>'shopName',
    coalesce(p_shop->>'ownerName', ''),
    coalesce(p_shop->>'phone', ''),
    coalesce(p_shop->>'campusAddress', ''),
    upper(trim(p_shop->>'shopCode')),
    n,
    coalesce((p_shop->>'isActive')::boolean, true)
  );

  return jsonb_build_object(
    'id', p_shop->>'id',
    'ownerId', p_shop->>'ownerId',
    'ownerEmail', coalesce(p_shop->>'ownerEmail', ''),
    'shopName', p_shop->>'shopName',
    'ownerName', coalesce(p_shop->>'ownerName', ''),
    'phone', coalesce(p_shop->>'phone', ''),
    'campusAddress', coalesce(p_shop->>'campusAddress', ''),
    'shopCode', upper(trim(p_shop->>'shopCode')),
    'createdAt', n,
    'isActive', true
  );
end;
$$;

create or replace function public.zdrop_get_shop_by_owner(p_owner_id text) returns jsonb
language sql security invoker set search_path = '' as $$
  select jsonb_build_object(
    'id', id,
    'ownerId', owner_id,
    'ownerEmail', owner_email,
    'shopName', shop_name,
    'ownerName', owner_name,
    'phone', phone,
    'campusAddress', campus_address,
    'shopCode', shop_code,
    'createdAt', created_at,
    'isActive', is_active
  )
  from zdrop_private.shops
  where owner_id = p_owner_id and is_active = true
  limit 1;
$$;

create or replace function public.zdrop_get_shop_by_code(p_code text) returns jsonb
language sql security invoker set search_path = '' as $$
  select jsonb_build_object(
    'id', id,
    'ownerId', owner_id,
    'ownerEmail', owner_email,
    'shopName', shop_name,
    'ownerName', owner_name,
    'phone', phone,
    'campusAddress', campus_address,
    'shopCode', shop_code,
    'createdAt', created_at,
    'isActive', is_active
  )
  from zdrop_private.shops
  where upper(shop_code) = upper(trim(p_code)) and is_active = true
  limit 1;
$$;

create or replace function public.zdrop_list_shops() returns setof jsonb
language sql security invoker set search_path = '' as $$
  select jsonb_build_object(
    'id', id,
    'ownerId', owner_id,
    'ownerEmail', owner_email,
    'shopName', shop_name,
    'ownerName', owner_name,
    'phone', phone,
    'campusAddress', campus_address,
    'shopCode', shop_code,
    'createdAt', created_at,
    'isActive', is_active
  )
  from zdrop_private.shops
  where is_active = true
  order by shop_name asc;
$$;

commit;
