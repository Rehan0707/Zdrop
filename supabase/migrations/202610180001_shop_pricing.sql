-- Durable shop pricing. Run after 202610140001_shops.sql.
-- Additive only: existing shop records are preserved.
begin;
alter table zdrop_private.shops add column if not exists pricing jsonb;

create or replace function zdrop_private.shop_json(s zdrop_private.shops) returns jsonb
language sql security invoker set search_path = '' as $$
  select jsonb_build_object('id',s.id,'ownerId',s.owner_id,'ownerEmail',s.owner_email,
    'shopName',s.shop_name,'ownerName',s.owner_name,'phone',s.phone,
    'campusAddress',s.campus_address,'shopCode',s.shop_code,
    'createdAt',s.created_at,'isActive',s.is_active,'pricing',s.pricing);
$$;

create or replace function public.zdrop_create_shop(p_shop jsonb) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare s zdrop_private.shops;
begin
  if coalesce(p_shop->>'ownerId','') = '' or length(trim(p_shop->>'shopName')) not between 2 and 60
    or coalesce(p_shop->>'shopCode','') !~ '^[A-Z0-9]{3,10}$'
  then raise exception 'Invalid shop'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_shop->>'ownerId',0));
  if exists(select 1 from zdrop_private.shops where owner_id=p_shop->>'ownerId' and is_active)
  then raise exception 'Owner already has a shop'; end if;
  insert into zdrop_private.shops(id,owner_id,owner_email,shop_name,owner_name,phone,campus_address,shop_code,created_at,is_active)
  values(p_shop->>'id',p_shop->>'ownerId',coalesce(p_shop->>'ownerEmail',''),trim(p_shop->>'shopName'),
    coalesce(p_shop->>'ownerName',''),coalesce(p_shop->>'phone',''),coalesce(p_shop->>'campusAddress',''),
    p_shop->>'shopCode',floor(extract(epoch from clock_timestamp())*1000)::bigint,true)
  returning * into s;
  return zdrop_private.shop_json(s);
end;
$$;

create or replace function public.zdrop_get_shop_by_owner(p_owner_id text) returns jsonb
language sql security invoker set search_path = '' as $$
  select zdrop_private.shop_json(s) from zdrop_private.shops s where owner_id=p_owner_id and is_active order by created_at limit 1;
$$;
create or replace function public.zdrop_get_shop_by_code(p_code text) returns jsonb
language sql security invoker set search_path = '' as $$
  select zdrop_private.shop_json(s) from zdrop_private.shops s where shop_code=upper(trim(p_code)) and is_active limit 1;
$$;
create or replace function public.zdrop_get_shop_by_id(p_id text) returns jsonb
language sql security invoker set search_path = '' as $$
  select zdrop_private.shop_json(s) from zdrop_private.shops s where id=p_id and is_active;
$$;
create or replace function public.zdrop_list_shops() returns setof jsonb
language sql security invoker set search_path = '' as $$
  select zdrop_private.shop_json(s) from zdrop_private.shops s where is_active order by shop_name;
$$;
create or replace function public.zdrop_update_shop_pricing(p_shop_id text,p_owner_id text,p_pricing jsonb) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare s zdrop_private.shops;
begin
  if jsonb_typeof(p_pricing) is distinct from 'object'
    or jsonb_typeof(p_pricing->'bwRate') is distinct from 'number'
    or jsonb_typeof(p_pricing->'colorRate') is distinct from 'number'
    or jsonb_typeof(p_pricing->'duplexDiscount') is distinct from 'number'
    or (p_pricing->>'bwRate')::numeric not between 0.1 and 1000
    or (p_pricing->>'colorRate')::numeric not between 0.1 and 1000
    or (p_pricing->>'duplexDiscount')::numeric not between 0 and 100
    or length(trim(coalesce(p_pricing->>'currencySymbol',''))) not between 1 and 4
    or length(coalesce(p_pricing->>'upiId',''))>100
    or (coalesce(p_pricing->>'upiId','')<>'' and p_pricing->>'upiId' !~ '^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$')
  then raise exception 'Invalid shop rates'; end if;
  update zdrop_private.shops set pricing=p_pricing where id=p_shop_id and owner_id=p_owner_id and is_active returning * into s;
  if not found then raise exception 'Shop access denied'; end if;
  return zdrop_private.shop_json(s);
end;
$$;

revoke all on function zdrop_private.shop_json(zdrop_private.shops) from public, anon, authenticated;
grant execute on function zdrop_private.shop_json(zdrop_private.shops) to service_role;
revoke all on function public.zdrop_create_shop(jsonb), public.zdrop_get_shop_by_owner(text),
 public.zdrop_get_shop_by_code(text), public.zdrop_get_shop_by_id(text), public.zdrop_list_shops(),
 public.zdrop_update_shop_pricing(text,text,jsonb) from public, anon, authenticated;
grant execute on function public.zdrop_create_shop(jsonb), public.zdrop_get_shop_by_owner(text),
 public.zdrop_get_shop_by_code(text), public.zdrop_get_shop_by_id(text), public.zdrop_list_shops(),
 public.zdrop_update_shop_pricing(text,text,jsonb) to service_role;
commit;
