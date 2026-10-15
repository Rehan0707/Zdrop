-- Run as the database owner. Every synthetic record is rolled back.
begin;
do $$
declare
  s jsonb;
  started jsonb;
  proposed jsonb;
  lease text := gen_random_uuid()::text || gen_random_uuid()::text;
  failed boolean;
begin
  s := public.zdrop_reserve(jsonb_build_object(
    'id', 'ses_' || gen_random_uuid()::text,
    'accessCode', (100000 + floor(random() * 900000))::integer::text,
    'ownerToken', gen_random_uuid()::text || gen_random_uuid()::text,
    'status', 'PENDING_UPLOAD', 'uploadSealed', false, 'purging', false,
    'files', '[]'::jsonb, 'totalSizeBytes', 0,
    'preferences', jsonb_build_object('copies',1,'colorMode','BW','sides','SINGLE','pageRange','ALL')
  ));
  if s is null then raise exception 'Synthetic code collision; rerun test'; end if;
  if not public.zdrop_acquire_lock(s->>'id', lease) then raise exception 'Test lease unavailable'; end if;

  failed := false;
  begin perform public.zdrop_begin_print(s || '{"status":"ACCESSED"}'::jsonb, lease);
  exception when others then failed := true; end;
  if not failed then raise exception 'Pending upload entered print window'; end if;

  s := s || '{"uploadSealed":true}'::jsonb;
  perform public.zdrop_save_session(s, lease);
  s := public.zdrop_activate(s, lease);
  proposed := s || '{"status":"ACCESSED"}'::jsonb;

  failed := false;
  begin perform public.zdrop_begin_print(proposed, 'wrong-lease');
  exception when others then failed := true; end;
  if not failed then raise exception 'Wrong lease accepted'; end if;

  failed := false;
  begin perform public.zdrop_begin_print(proposed || '{"ownerToken":"changed"}'::jsonb, lease);
  exception when others then failed := true; end;
  if not failed then raise exception 'Owner mutation accepted'; end if;

  failed := false;
  begin perform public.zdrop_save_session(proposed || jsonb_build_object('expiresAt',(s->>'expiresAt')::bigint-1000),lease);
  exception when others then failed := true; end;
  if not failed then raise exception 'Ordinary save changed expiry'; end if;

  failed := false;
  begin perform public.zdrop_begin_print(proposed || jsonb_build_object('stationClaimToken',repeat('a',72),'stationDeliveredPages','[0]'::jsonb),lease);
  exception when others then failed := true; end;
  if not failed then raise exception 'Pre-consumed station pages accepted'; end if;

  started := public.zdrop_begin_print(proposed,lease);
  if (started->>'expiresAt')::bigint > (started->>'printStartedAt')::bigint + 120000
    or (started->>'expiresAt')::bigint > (s->>'expiresAt')::bigint
    or started->>'status' <> 'ACCESSED'
  then raise exception 'Invalid database-owned print deadline'; end if;

  failed := false;
  begin perform public.zdrop_begin_print(started,lease);
  exception when others then failed := true; end;
  if not failed then raise exception 'Repeated print start accepted'; end if;
  perform public.zdrop_save_session(started || '{"purging":true}'::jsonb,lease);
end;
$$;
rollback;
