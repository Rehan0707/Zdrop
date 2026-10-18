begin;
do $$
declare s jsonb; q jsonb;
begin
 s := public.zdrop_create_shop(jsonb_build_object('id','shop_'||gen_random_uuid(),'ownerId','test-'||gen_random_uuid(),
 'ownerEmail','test@example.test','shopName','Synthetic Test Counter','shopCode','T'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))));
 q := public.zdrop_update_shop_pricing(s->>'id',s->>'ownerId',
  '{"bwRate":0.5,"colorRate":3,"duplexDiscount":0,"currencySymbol":"₹","upiId":"synthetic@upi"}'::jsonb);
 if (public.zdrop_get_shop_by_id(s->>'id')->'pricing'->>'bwRate')::numeric <> 0.5 then raise exception 'Rates not durable'; end if;
 if public.zdrop_get_shop_by_code(s->>'shopCode')->>'id' <> s->>'id' then raise exception 'Code lookup failed'; end if;
 begin
  perform public.zdrop_update_shop_pricing(s->>'id','wrong-owner',q->'pricing');
  raise exception 'Wrong owner accepted' using errcode='XX000';
 exception when raise_exception then null; end;
 begin
  perform public.zdrop_update_shop_pricing(s->>'id',s->>'ownerId','{"bwRate":-1,"colorRate":3,"duplexDiscount":0,"currencySymbol":"₹"}'::jsonb);
  raise exception 'Invalid price accepted' using errcode='XX000';
 exception when raise_exception then null; end;
end $$;
select 'shop pricing and ownership passed' as result;
select bool_and(not has_function_privilege('anon',p.oid,'execute') and not has_function_privilege('authenticated',p.oid,'execute') and has_function_privilege('service_role',p.oid,'execute')) as server_only
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'zdrop_%';
rollback;
