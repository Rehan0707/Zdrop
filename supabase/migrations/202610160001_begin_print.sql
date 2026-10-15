-- Apply before deploying the one-time browser/managed print flow.
-- Preserve zdrop_save_session's immutable-expiry guard; only this operation
-- can shorten a live, sealed job's deadline for a one-time print attempt.
begin;

create or replace function public.zdrop_begin_print(p_session jsonb, p_lease text)
returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  old jsonb;
  s jsonb;
  n bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  print_fields text[] := array[
    'status', 'accessedAt', 'expiresAt', 'printStartedAt',
    'stationClaimToken', 'stationDeliveredPages', 'stationSubmitAuthorized'
  ];
begin
  perform 1 from zdrop_private.locks
    where session_id = p_session->>'id' and lease = p_lease and expires_at > n
    for update;
  if not found then raise exception 'Session lease lost'; end if;

  select data into old from zdrop_private.sessions
    where id = p_session->>'id' for update;
  n := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  if old is null
    or coalesce(old->>'status', '') not in ('ACTIVE', 'ACCESSED')
    or old->>'printStartedAt' is not null
    or (old->>'expiresAt')::bigint <= n
    or coalesce((old->>'purging')::boolean, false)
    or not coalesce((old->>'uploadSealed')::boolean, false)
    or p_session->>'status' is distinct from 'ACCESSED'
    or (old - print_fields) is distinct from (p_session - print_fields)
  then raise exception 'Session cannot enter print window'; end if;

  if p_session ? 'stationClaimToken' and (
    jsonb_typeof(p_session->'stationClaimToken') is distinct from 'string'
    or length(p_session->>'stationClaimToken') not between 64 and 100
    or p_session->'stationDeliveredPages' is distinct from '[]'::jsonb
    or coalesce((p_session->>'stationSubmitAuthorized')::boolean, false)
  ) then raise exception 'Invalid initial station claim'; end if;

  s := p_session || jsonb_build_object(
    'printStartedAt', n,
    'accessedAt', case when old->>'accessedAt' is null then to_jsonb(n) else old->'accessedAt' end,
    'expiresAt', least((old->>'expiresAt')::bigint, n + 120000)
  );
  -- expires_at is derived from data by the existing schema, so scheduled
  -- candidates see the shortened deadline. Code reservations stay reserved.
  update zdrop_private.sessions set data = s where id = old->>'id';
  return s;
end;
$$;

revoke all on function public.zdrop_begin_print(jsonb, text) from public, anon, authenticated;
grant execute on function public.zdrop_begin_print(jsonb, text) to service_role;

commit;
