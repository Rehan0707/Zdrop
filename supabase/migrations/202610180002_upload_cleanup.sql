-- Private storage limits and cleanup candidates; delete bytes through Storage API.
begin;
update storage.buckets set public=false, file_size_limit=26214400,
 allowed_mime_types=array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/jpeg','image/png']
 where id='zdrop-documents';

create or replace function public.zdrop_orphaned_uploads(p_limit integer default 200) returns setof text
language sql security invoker set search_path = '' as $$
 select o.name from storage.objects o
 left join zdrop_private.sessions s on s.id=split_part(o.name,'/',2)
 where o.bucket_id='zdrop-documents' and o.name like 'sessions/%'
   and o.created_at < clock_timestamp() - interval '1 minute'
   and not coalesce(s.expires_at > floor(extract(epoch from clock_timestamp())*1000)::bigint
     and s.status in ('PENDING_UPLOAD','ACTIVE','ACCESSED') and not s.purging
     and array_length(string_to_array(o.name,'/'),1)=3
     and s.data->'files' @> jsonb_build_array(jsonb_build_object('fileId',split_part(o.name,'/',3))),false)
 order by o.created_at, o.name limit greatest(1,least(p_limit,200));
$$;
revoke all on function public.zdrop_orphaned_uploads(integer) from public,anon,authenticated;
grant execute on function public.zdrop_orphaned_uploads(integer) to service_role;
commit;
