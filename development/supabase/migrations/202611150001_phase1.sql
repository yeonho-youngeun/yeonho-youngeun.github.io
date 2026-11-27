-- Phase 1. No anonymous access and no service-role key in the application.
begin;
create table public.invitations (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id),
 slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) between 3 and 60),
 created_at timestamptz not null default now()
);
create table public.invitation_members (
 invitation_id uuid references public.invitations on delete cascade,user_id uuid references auth.users on delete cascade,
 role text not null check(role in ('editor','viewer')),primary key(invitation_id,user_id)
);
create function public.can_read_invitation(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.invitations where id=p_id and owner_id=(select auth.uid())) or exists(select 1 from public.invitation_members where invitation_id=p_id and user_id=(select auth.uid()));
$$;
create function public.can_edit_invitation(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.invitations where id=p_id and owner_id=(select auth.uid())) or exists(select 1 from public.invitation_members where invitation_id=p_id and user_id=(select auth.uid()) and role='editor');
$$;
create table public.invitation_drafts (
 invitation_id uuid primary key references public.invitations on delete cascade,
 slug text not null check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) between 3 and 60),
 content jsonb not null check(content->>'schemaVersion'='1'),version integer not null default 1 check(version>0),
 updated_at timestamptz not null default now(),updated_by uuid not null references auth.users
);
create table public.invitation_publications (
 id uuid primary key default gen_random_uuid(), invitation_id uuid not null references public.invitations on delete cascade,
 content jsonb not null check(content->>'schemaVersion'='1'),slug text not null,version integer not null,
 published_at timestamptz not null default now(),revoked_at timestamptz,unique(invitation_id,version)
);
create table public.invitation_assets (
 id uuid primary key default gen_random_uuid(),invitation_id uuid not null references public.invitations on delete cascade,
 bucket text not null,object_path text not null,mime_type text not null,byte_size bigint not null check(byte_size>0),sort_order integer not null default 0,created_at timestamptz not null default now(),unique(bucket,object_path)
);
create table public.guestbook_entries (
 id uuid primary key default gen_random_uuid(),invitation_id uuid not null references public.invitations on delete cascade,
 name text not null check(length(name) between 1 and 40),message text not null check(length(message) between 1 and 1000),
 status text not null default 'visible' check(status in ('visible','hidden','deleted')),created_at timestamptz not null default now()
);
create table public.drive_connections (
 id uuid primary key default gen_random_uuid(),owner_id uuid not null references auth.users,
 provider text not null default 'google_drive', encrypted_credentials bytea not null, key_version integer not null,
 created_at timestamptz not null default now(),revoked_at timestamptz
);
create table public.invitation_storage (
 id uuid primary key default gen_random_uuid(),invitation_id uuid not null references public.invitations on delete cascade,
 drive_connection_id uuid not null references public.drive_connections,folder_id text not null,
 active boolean not null default true,created_at timestamptz not null default now(),unique(id,invitation_id)
);
create unique index one_active_storage on public.invitation_storage(invitation_id) where active;
create table public.upload_sessions (
 id uuid primary key default gen_random_uuid(),invitation_id uuid not null references public.invitations on delete cascade,
 idempotency_key uuid not null, status text not null default 'pending' check(status in ('pending','processing','complete','failed')),
 expires_at timestamptz not null,created_at timestamptz not null default now(),unique(invitation_id,idempotency_key),unique(id,invitation_id)
);
create table public.guest_photos (
 id uuid primary key default gen_random_uuid(),invitation_id uuid not null references public.invitations on delete cascade,
 storage_id uuid not null,upload_session_id uuid not null,drive_file_id text,
 original_name text not null,mime_type text not null,byte_size bigint not null check(byte_size>0),
 status text not null default 'pending' check(status in ('pending','approved','rejected','deleted')),
 created_at timestamptz not null default now(),
 foreign key(storage_id,invitation_id) references public.invitation_storage(id,invitation_id),
 foreign key(upload_session_id,invitation_id) references public.upload_sessions(id,invitation_id),unique(storage_id,drive_file_id)
);
create table public.audit_logs (
 id bigint generated always as identity primary key,invitation_id uuid references public.invitations on delete set null,
 actor_id uuid references auth.users,action text not null,metadata jsonb not null default '{}',created_at timestamptz not null default now()
);
-- Deny by default. Future phases must add narrowly scoped server operations.
do $$ declare t text; begin
 foreach t in array array['invitations','invitation_members','invitation_drafts','invitation_publications','invitation_assets','guestbook_entries','drive_connections','invitation_storage','guest_photos','upload_sessions','audit_logs'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 end loop;
end $$;
grant select on public.invitations,public.invitation_members,public.invitation_drafts,public.invitation_publications,public.invitation_assets,public.guestbook_entries,public.invitation_storage,public.guest_photos,public.upload_sessions,public.audit_logs to authenticated;
create policy read_invitations on public.invitations for select to authenticated using(public.can_read_invitation(id));
create policy read_members on public.invitation_members for select to authenticated using(public.can_read_invitation(invitation_id));
do $$ declare t text; begin
 foreach t in array array['invitation_drafts','invitation_publications','invitation_assets','guestbook_entries','invitation_storage','guest_photos','upload_sessions','audit_logs'] loop
 execute format('create policy member_read on public.%I for select to authenticated using(public.can_read_invitation(invitation_id))',t);
 end loop;
end $$;
-- Tokens cannot be read by browser roles, including the owner.
revoke all on function public.can_read_invitation(uuid),public.can_edit_invitation(uuid) from public,anon;
grant execute on function public.can_read_invitation(uuid),public.can_edit_invitation(uuid) to authenticated;
create function public.validate_draft(p_content jsonb) returns boolean language plpgsql immutable set search_path='' as $$
 declare b jsonb; d jsonb; k text; v jsonb; seen text[] := '{}'; begin
 if jsonb_typeof(p_content) is distinct from 'object' or p_content->'schemaVersion' is distinct from '1'::jsonb or octet_length(p_content::text)>65536 then return false;end if;
 if (select count(*) from jsonb_object_keys(p_content))<>3 then return false;end if;
 b:=p_content->'basic';d:=p_content->'design';
 if jsonb_typeof(b) is distinct from 'object' or jsonb_typeof(d) is distinct from 'object' then return false;end if;
 if (select count(*) from jsonb_object_keys(b))<>11 or (select count(*) from jsonb_object_keys(d))<>5 then return false;end if;
 foreach k in array array['groom','bride','groomFather','groomMother','brideFather','brideMother','date','time','venue','address','invitation'] loop
 if jsonb_typeof(b->k) is distinct from 'string' then return false;end if;
 end loop;
 foreach k in array array['groom','bride','groomFather','groomMother','brideFather','brideMother'] loop
 if length(b->>k)>40 then return false;end if;
 end loop;
 if length(trim(b->>'groom'))=0 or length(trim(b->>'bride'))=0 or length(trim(b->>'venue')) not between 1 and 120 or length(b->>'address')>250 or length(b->>'invitation')>3000 then return false;end if;
 if b->>'date' !~ '^\d{4}-\d{2}-\d{2}$' or b->>'time' !~ '^([01]\d|2[0-3]):[0-5]\d$' then return false;end if;
 if to_char((b->>'date')::date,'YYYY-MM-DD')<>b->>'date' then return false;end if;
 if d->>'font' is null or d->>'font' not in ('serif','sans') then return false;end if;
 foreach k in array array['background','accent','text'] loop
 if jsonb_typeof(d->k) is distinct from 'string' or d->>k !~ '^#[0-9a-fA-F]{6}$' then return false;end if;
 end loop;
 if jsonb_typeof(d->'sections') is distinct from 'array' then return false;end if;
 if jsonb_array_length(d->'sections')<>10 then return false;end if;
 for v in select value from jsonb_array_elements(d->'sections') loop
 if jsonb_typeof(v) is distinct from 'object' then return false;end if;
 if (select count(*) from jsonb_object_keys(v))<>2 or jsonb_typeof(v->'visible') is distinct from 'boolean' or v->>'id' is null or v->>'id' not in ('schedule','profiles','interview','gallery','location','guestbook','photos','contact','accounts','closing') or v->>'id'=any(seen) then return false;end if;
 seen:=array_append(seen,v->>'id');
 end loop;
 return true;
 exception when others then return false;
 end;
$$;
create function public.create_invitation(p_slug text,p_content jsonb) returns uuid language plpgsql security definer set search_path='' as $$
 declare new_id uuid; begin
 if auth.uid() is null then raise exception 'unauthorized' using errcode='42501';end if;
 if not public.validate_draft(p_content) then raise exception 'invalid content' using errcode='22023';end if;
 insert into public.invitations(owner_id,slug) values(auth.uid(),p_slug) returning id into new_id;
 insert into public.invitation_drafts(invitation_id,slug,content,updated_by) values(new_id,p_slug,p_content,auth.uid());
 insert into public.audit_logs(invitation_id,actor_id,action) values(new_id,auth.uid(),'invitation.created');
 return new_id;end;
$$;
create function public.save_invitation_draft(p_id uuid,p_version integer,p_slug text,p_content jsonb) returns integer language plpgsql security definer set search_path='' as $$
 declare next_version integer;begin
 if not public.can_edit_invitation(p_id) then raise exception 'forbidden' using errcode='42501';end if;
 if not public.validate_draft(p_content) then raise exception 'invalid content' using errcode='22023';end if;
 update public.invitation_drafts set content=p_content,slug=p_slug,version=version+1,updated_at=now(),updated_by=auth.uid()
 where invitation_id=p_id and version=p_version returning version into next_version;
 if next_version is null then raise exception 'version conflict' using errcode='40001';end if;
 update public.invitations set slug=p_slug where id=p_id;
 insert into public.audit_logs(invitation_id,actor_id,action,metadata) values(p_id,auth.uid(),'draft.saved',jsonb_build_object('version',next_version));
 return next_version;end;
$$;
revoke all on function public.create_invitation(text,jsonb),public.save_invitation_draft(uuid,integer,text,jsonb),public.validate_draft(jsonb) from public,anon;
grant execute on function public.create_invitation(text,jsonb),public.save_invitation_draft(uuid,integer,text,jsonb) to authenticated;
create index invitation_owner_idx on public.invitations(owner_id);
create index invitation_member_user_idx on public.invitation_members(user_id);
create index guestbook_invitation_idx on public.guestbook_entries(invitation_id,created_at desc);
create index guest_photos_invitation_idx on public.guest_photos(invitation_id,created_at desc);
create index audit_invitation_idx on public.audit_logs(invitation_id,created_at desc);
commit;
