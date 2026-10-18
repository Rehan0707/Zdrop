-- Base metadata schema recovered from the verified hosted implementation.
-- Run migrations in filename order as the database owner. No existing data is replaced.
begin;
create schema if not exists zdrop_private;
revoke all on schema zdrop_private from public, anon, authenticated;
grant usage on schema zdrop_private to service_role;
create table if not exists zdrop_private.sessions (
  id text primary key check (id ~ '^ses_[a-f0-9-]{36}$'),
  data jsonb not null,
  expires_at bigint generated always as ((data->>'expiresAt')::bigint) stored not null,
  status text generated always as (data->>'status') stored not null,
  purging boolean generated always as (coalesce((data->>'purging')::boolean,false)) stored,
  deleted_at bigint generated always as ((data->>'deletedAt')::bigint) stored
);
create table if not exists zdrop_private.codes (
 code text primary key check (code ~ '^[0-9]{6}$'), session_id text not null, expires_at bigint not null
);
create table if not exists zdrop_private.locks (
 session_id text primary key, lease text not null, expires_at bigint not null
);
create table if not exists zdrop_private.rate_limits (
 key text primary key, count integer not null, reset_at bigint not null, delete_after bigint not null
);
create index if not exists sessions_expiry on zdrop_private.sessions(expires_at);
create index if not exists sessions_cleanup on zdrop_private.sessions(id) where purging or deleted_at is not null;
create index if not exists rate_limits_expiry on zdrop_private.rate_limits(delete_after);
alter table zdrop_private.sessions enable row level security;
alter table zdrop_private.codes enable row level security;
alter table zdrop_private.locks enable row level security;
alter table zdrop_private.rate_limits enable row level security;
revoke all on all tables in schema zdrop_private from public, anon, authenticated;
grant select,insert,update,delete on all tables in schema zdrop_private to service_role;

CREATE OR REPLACE FUNCTION public.zdrop_acquire_lock(p_id text, p_lease text)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare n bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint; claimed text;
begin
  insert into zdrop_private.locks as l(session_id, lease, expires_at) values (p_id, p_lease, n + 300000)
  on conflict (session_id) do update set lease = excluded.lease, expires_at = excluded.expires_at
    where l.expires_at <= n
  returning session_id into claimed;
  return claimed is not null;
end;
$function$;

CREATE OR REPLACE FUNCTION public.zdrop_activate(p_session jsonb, p_lease text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare old jsonb; c zdrop_private.codes; n bigint; s jsonb;
begin
  n := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  perform 1 from zdrop_private.locks where session_id = p_session->>'id'
    and lease = p_lease and expires_at > n for update;
  if not found then raise exception 'Session lease lost'; end if;
  select data into old from zdrop_private.sessions where id = p_session->>'id' for update;
  select * into c from zdrop_private.codes where code = old->>'accessCode' for update;
  n := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  if old is null or old->>'status' <> 'PENDING_UPLOAD' or (old->>'expiresAt')::bigint <= n
    or coalesce((old->>'purging')::boolean, false) or not coalesce((old->>'uploadSealed')::boolean, false)
    or c.session_id is distinct from old->>'id' or c.expires_at <= n
    or old->>'ownerToken' is distinct from p_session->>'ownerToken'
    or old->>'accessCode' is distinct from p_session->>'accessCode'
    or old->>'createdAt' is distinct from p_session->>'createdAt'
    then raise exception 'Session cannot be activated'; end if;
  s := p_session || jsonb_build_object('status', 'ACTIVE', 'expiresAt', n + 900000, 'uploadSealed', true);
  update zdrop_private.codes set expires_at = n + 900000 where code = c.code;
  update zdrop_private.sessions set data = s where id = old->>'id';
  return s;
end;
$function$;

CREATE OR REPLACE FUNCTION public.zdrop_by_code(p_code text)
 RETURNS jsonb
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  select s.data from zdrop_private.codes c join zdrop_private.sessions s on s.id = c.session_id
  where c.code = p_code;
$function$;

CREATE OR REPLACE FUNCTION public.zdrop_candidates(p_after text DEFAULT ''::text, p_limit integer DEFAULT 200)
 RETURNS SETOF jsonb
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  select data from zdrop_private.sessions
  where id > p_after and (expires_at <= floor(extract(epoch from clock_timestamp()) * 1000)::bigint
    or purging or deleted_at is not null)
  order by id limit greatest(1, least(p_limit, 200));
$function$;

CREATE OR REPLACE FUNCTION public.zdrop_housekeeping()
 RETURNS void
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  delete from zdrop_private.rate_limits where delete_after <= floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  delete from zdrop_private.locks where expires_at <= floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
$function$;

CREATE OR REPLACE FUNCTION public.zdrop_rate_limit(p_key text, p_max integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare n bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint; allowed integer;
begin
  if p_max < 1 or p_max > 1000 then raise exception 'Invalid rate limit'; end if;
  insert into zdrop_private.rate_limits as r(key, count, reset_at, delete_after)
    values (p_key, 1, n + 60000, n + 3660000)
  on conflict (key) do update set
    count = case when r.reset_at <= n then 1 else r.count + 1 end,
    reset_at = case when r.reset_at <= n then n + 60000 else r.reset_at end,
    delete_after = case when r.reset_at <= n then n + 3660000 else r.delete_after end
    where r.reset_at <= n or r.count < p_max
  returning count into allowed;
  return allowed is not null;
end;
$function$;

CREATE OR REPLACE FUNCTION public.zdrop_read_session(p_id text)
 RETURNS jsonb
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  select data from zdrop_private.sessions where id = p_id;
$function$;

CREATE OR REPLACE FUNCTION public.zdrop_release_lock(p_id text, p_lease text)
 RETURNS void
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  delete from zdrop_private.locks where session_id = p_id and lease = p_lease;
$function$;

CREATE OR REPLACE FUNCTION public.zdrop_renew_lock(p_id text, p_lease text)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare n bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint; updated text;
begin
  update zdrop_private.locks set expires_at = n + 300000
  where session_id = p_id and lease = p_lease and expires_at > n returning session_id into updated;
  return updated is not null;
end;
$function$;

CREATE OR REPLACE FUNCTION public.zdrop_reserve(p_session jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  n bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  claimed text;
  s jsonb := p_session || jsonb_build_object('createdAt', n, 'expiresAt', n + 900000);
begin
  if p_session->>'status' <> 'PENDING_UPLOAD' or coalesce((p_session->>'uploadSealed')::boolean, true)
    or coalesce((p_session->>'purging')::boolean, true) then raise exception 'Invalid pending session'; end if;
  insert into zdrop_private.codes as c (code, session_id, expires_at)
  values (s->>'accessCode', s->>'id', n + 900000)
  on conflict (code) do update set session_id = excluded.session_id, expires_at = excluded.expires_at
    where c.expires_at <= n
  returning code into claimed;
  if claimed is null then return null; end if;
  insert into zdrop_private.sessions(id, data) values (s->>'id', s);
  return s;
end;
$function$;

CREATE OR REPLACE FUNCTION public.zdrop_retire(p_id text, p_lease text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare s jsonb; n bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
begin
  perform 1 from zdrop_private.locks where session_id = p_id and lease = p_lease and expires_at > n for update;
  if not found then raise exception 'Session lease lost'; end if;
  select data into s from zdrop_private.sessions where id = p_id for update;
  if s is null then return; end if;
  if s->>'status' not in ('DELETED', 'EXPIRED') or s->>'deletedAt' is null
    or n <= greatest((s->>'expiresAt')::bigint, (s->>'deletedAt')::bigint) + 3600000
    then raise exception 'Receipt not ready for retirement'; end if;
  delete from zdrop_private.codes where code = s->>'accessCode' and session_id = p_id;
  delete from zdrop_private.sessions where id = p_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.zdrop_save_session(p_session jsonb, p_lease text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare old jsonb; n bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
begin
  perform 1 from zdrop_private.locks where session_id = p_session->>'id'
    and lease = p_lease and expires_at > n for update;
  if not found then raise exception 'Session lease lost'; end if;
  select data into old from zdrop_private.sessions where id = p_session->>'id' for update;
  if old is null then raise exception 'Session missing'; end if;
  if old->>'ownerToken' is distinct from p_session->>'ownerToken'
    or old->>'accessCode' is distinct from p_session->>'accessCode'
    or old->>'createdAt' is distinct from p_session->>'createdAt'
    or old->>'expiresAt' is distinct from p_session->>'expiresAt'
    or (old->>'status' in ('DELETED', 'EXPIRED') and old->>'status' is distinct from p_session->>'status')
    or ((old->>'uploadSealed')::boolean and not coalesce((p_session->>'uploadSealed')::boolean, false))
    or (old->>'status' = 'PENDING_UPLOAD' and p_session->>'status' in ('ACTIVE', 'ACCESSED'))
    then raise exception 'Invalid session transition'; end if;
  update zdrop_private.sessions set data = p_session where id = p_session->>'id';
end;
$function$;


-- Postgres grants function execution to PUBLIC by default: explicitly close every RPC.
do $$ declare f record; begin
 for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname like 'zdrop_%'
 loop
  execute format('revoke all on function %s from public, anon, authenticated',f.signature);
  execute format('grant execute on function %s to service_role',f.signature);
 end loop;
end $$;
commit;
