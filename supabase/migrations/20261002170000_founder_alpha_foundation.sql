-- Founder Alpha production foundation.
-- Apply with the Supabase CLI or SQL editor before enabling the client workflow.

create extension if not exists pgcrypto;

create type public.matter_role as enum ('owner', 'editor', 'viewer');
create type public.confirmation_state as enum (
  'ai_suggested',
  'user_confirmed',
  'disputed',
  'unverified',
  'needs_source'
);
create type public.content_type as enum (
  'original_source',
  'source_assertion',
  'user_recollection',
  'legal_authority',
  'user_interpretation',
  'ai_summary',
  'ai_inference',
  'conflicting_account',
  'unknown',
  'draft'
);

create table public.matters (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  name text not null check (char_length(trim(name)) between 1 and 200),
  jurisdiction text,
  court text,
  case_number text,
  stage text,
  active_proceeding text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table public.matter_members (
  matter_id uuid not null references public.matters(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.matter_role not null,
  created_at timestamptz not null default now(),
  primary key (matter_id, user_id)
);

create or replace function public.is_matter_member(target_matter_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.matter_members membership
    where membership.matter_id = target_matter_id
      and membership.user_id = (select auth.uid())
  );
$$;

create or replace function public.can_edit_matter(target_matter_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.matter_members membership
    where membership.matter_id = target_matter_id
      and membership.user_id = (select auth.uid())
      and membership.role in ('owner', 'editor')
  );
$$;

create or replace function public.owns_matter(target_matter_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.matters matter
    where matter.id = target_matter_id
      and matter.owner_id = (select auth.uid())
  );
$$;

revoke all on function public.is_matter_member(uuid) from public;
revoke all on function public.can_edit_matter(uuid) from public;
revoke all on function public.owns_matter(uuid) from public;
grant execute on function public.is_matter_member(uuid) to authenticated;
grant execute on function public.can_edit_matter(uuid) to authenticated;
grant execute on function public.owns_matter(uuid) to authenticated;

create or replace function public.add_matter_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.matter_members (matter_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

create trigger matter_add_owner
after insert on public.matters
for each row execute function public.add_matter_owner();

create table public.parties (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.matters(id),
  party_type text not null check (party_type in ('person', 'organization')),
  display_name text not null check (char_length(trim(display_name)) > 0),
  roles text[] not null default '{}',
  details jsonb not null default '{}',
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (id, matter_id)
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.matters(id),
  title text not null check (char_length(trim(title)) > 0),
  source_type text not null,
  origin text,
  source_date date,
  received_at timestamptz,
  custody_notes text,
  content_type public.content_type not null default 'original_source',
  confirmation_state public.confirmation_state not null default 'unverified',
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (id, matter_id)
);

create table public.source_files (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.matters(id),
  source_id uuid not null,
  bucket_id text not null default 'matter-originals'
    check (bucket_id = 'matter-originals'),
  object_path text not null unique,
  original_name text not null,
  media_type text,
  byte_size bigint check (byte_size is null or byte_size >= 0),
  sha256 text check (sha256 is null or sha256 ~ '^[0-9a-f]{64}$'),
  uploaded_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  unique (id, matter_id),
  foreign key (source_id, matter_id)
    references public.sources(id, matter_id)
);

create table public.derivatives (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.matters(id),
  source_id uuid not null,
  source_file_id uuid,
  derivative_type text not null
    check (derivative_type in ('ocr', 'transcript', 'thumbnail', 'summary', 'extraction')),
  body text,
  object_path text,
  process_name text,
  process_version text,
  content_type public.content_type not null,
  confirmation_state public.confirmation_state not null default 'ai_suggested',
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (body is not null or object_path is not null),
  unique (id, matter_id),
  foreign key (source_id, matter_id)
    references public.sources(id, matter_id),
  foreign key (source_file_id, matter_id)
    references public.source_files(id, matter_id)
);

create table public.statements (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.matters(id),
  source_id uuid,
  derivative_id uuid,
  speaker_party_id uuid,
  body text not null check (char_length(trim(body)) > 0),
  locator jsonb not null default '{}',
  content_type public.content_type not null default 'source_assertion',
  confirmation_state public.confirmation_state not null default 'unverified',
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (id, matter_id),
  foreign key (source_id, matter_id)
    references public.sources(id, matter_id),
  foreign key (derivative_id, matter_id)
    references public.derivatives(id, matter_id),
  foreign key (speaker_party_id, matter_id)
    references public.parties(id, matter_id)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.matters(id),
  title text not null check (char_length(trim(title)) > 0),
  description text,
  date_kind text not null
    check (date_kind in ('exact', 'approximate', 'range', 'disputed', 'undated')),
  starts_at timestamptz,
  ends_at timestamptz,
  date_text text,
  content_type public.content_type not null default 'user_interpretation',
  confirmation_state public.confirmation_state not null default 'unverified',
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table public.recollections (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.matters(id),
  title text not null check (char_length(trim(title)) > 0),
  body text not null check (char_length(trim(body)) > 0),
  recalled_at timestamptz,
  content_type public.content_type not null default 'user_recollection',
  confirmation_state public.confirmation_state not null default 'unverified',
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table public.legal_authorities (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.matters(id),
  title text not null check (char_length(trim(title)) > 0),
  authority_type text not null,
  citation text,
  jurisdiction text,
  effective_on date,
  checked_at timestamptz,
  source_url text,
  excerpt text,
  content_type public.content_type not null default 'legal_authority',
  confirmation_state public.confirmation_state not null default 'needs_source',
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table public.issues (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.matters(id),
  title text not null check (char_length(trim(title)) > 0),
  description text,
  status text not null default 'open'
    check (status in ('open', 'monitoring', 'resolved', 'archived')),
  content_type public.content_type not null default 'user_interpretation',
  confirmation_state public.confirmation_state not null default 'unverified',
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table public.evidence_items (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.matters(id),
  title text not null check (char_length(trim(title)) > 0),
  relevance text,
  foundation_questions text,
  analysis text,
  content_type public.content_type not null default 'user_interpretation',
  confirmation_state public.confirmation_state not null default 'unverified',
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.matters(id),
  title text not null check (char_length(trim(title)) > 0),
  description text,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'blocked', 'completed', 'archived')),
  due_at timestamptz,
  assigned_to uuid references auth.users(id),
  confirmation_state public.confirmation_state not null default 'unverified',
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table public.strategy_items (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.matters(id),
  strategy_type text not null check (
    strategy_type in (
      'objective', 'requirement', 'fact', 'gap', 'counterposition',
      'risk', 'option', 'preservation_need', 'next_step'
    )
  ),
  title text not null check (char_length(trim(title)) > 0),
  body text,
  status text not null default 'active'
    check (status in ('active', 'resolved', 'archived')),
  content_type public.content_type not null default 'user_interpretation',
  confirmation_state public.confirmation_state not null default 'unverified',
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table public.work_products (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.matters(id),
  title text not null check (char_length(trim(title)) > 0),
  work_product_type text not null,
  body text not null default '',
  version integer not null default 1 check (version > 0),
  content_type public.content_type not null default 'draft',
  confirmation_state public.confirmation_state not null default 'unverified',
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table public.relationships (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.matters(id),
  relationship_type text not null check (
    relationship_type in (
      'contains', 'authored_by', 'describes', 'supports', 'conflicts_with',
      'repeats', 'modifies', 'corrects', 'relates_to', 'governs',
      'informs', 'arises_from', 'cites'
    )
  ),
  from_type text not null,
  from_id uuid not null,
  to_type text not null,
  to_id uuid not null,
  notes text,
  confirmation_state public.confirmation_state not null default 'unverified',
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (matter_id, relationship_type, from_type, from_id, to_type, to_id)
);

create table public.confirmations (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.matters(id),
  entity_type text not null,
  entity_id uuid not null,
  state public.confirmation_state not null,
  note text,
  confirmed_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.processing_jobs (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.matters(id),
  source_id uuid not null,
  job_type text not null,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  process_version text,
  error_code text,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (source_id, matter_id)
    references public.sources(id, matter_id)
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  matter_id uuid not null references public.matters(id),
  table_name text not null,
  record_id uuid not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  actor_id uuid references auth.users(id),
  changed_at timestamptz not null default now(),
  old_record jsonb,
  new_record jsonb
);

create index matter_members_user_idx on public.matter_members(user_id, matter_id);
create index sources_matter_idx on public.sources(matter_id, created_at desc);
create index statements_matter_idx on public.statements(matter_id, created_at desc);
create index events_matter_idx on public.events(matter_id, starts_at);
create index tasks_matter_idx on public.tasks(matter_id, status, due_at);
create index relationships_from_idx on public.relationships(matter_id, from_type, from_id);
create index relationships_to_idx on public.relationships(matter_id, to_type, to_id);
create index confirmations_entity_idx on public.confirmations(matter_id, entity_type, entity_id, created_at desc);
create index audit_log_record_idx on public.audit_log(matter_id, table_name, record_id, changed_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.protect_record_scope()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.matter_id <> old.matter_id then
    raise exception 'matter_id cannot be changed';
  end if;
  if to_jsonb(new) ? 'created_by'
    and new.created_by <> old.created_by then
    raise exception 'created_by cannot be changed';
  end if;
  return new;
end;
$$;

create or replace function public.protect_matter_owner()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.owner_id <> old.owner_id then
    raise exception 'matter ownership cannot be changed';
  end if;
  return new;
end;
$$;

create or replace function public.protect_original_file()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.matter_id <> old.matter_id
    or new.source_id <> old.source_id
    or new.bucket_id <> old.bucket_id
    or new.object_path <> old.object_path
    or new.sha256 is distinct from old.sha256
    or new.byte_size is distinct from old.byte_size
    or new.uploaded_by <> old.uploaded_by then
    raise exception 'original file identity and integrity fields are immutable';
  end if;
  return new;
end;
$$;

create trigger source_files_protect_original
before update on public.source_files
for each row execute function public.protect_original_file();

create trigger matters_protect_owner
before update on public.matters
for each row execute function public.protect_matter_owner();

create or replace function public.entity_in_matter(
  entity_type text,
  entity_id uuid,
  target_matter_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  case entity_type
    when 'party' then
      return exists (select 1 from public.parties where id = entity_id and matter_id = target_matter_id);
    when 'source' then
      return exists (select 1 from public.sources where id = entity_id and matter_id = target_matter_id);
    when 'source_file' then
      return exists (select 1 from public.source_files where id = entity_id and matter_id = target_matter_id);
    when 'derivative' then
      return exists (select 1 from public.derivatives where id = entity_id and matter_id = target_matter_id);
    when 'statement' then
      return exists (select 1 from public.statements where id = entity_id and matter_id = target_matter_id);
    when 'event' then
      return exists (select 1 from public.events where id = entity_id and matter_id = target_matter_id);
    when 'recollection' then
      return exists (select 1 from public.recollections where id = entity_id and matter_id = target_matter_id);
    when 'legal_authority' then
      return exists (select 1 from public.legal_authorities where id = entity_id and matter_id = target_matter_id);
    when 'issue' then
      return exists (select 1 from public.issues where id = entity_id and matter_id = target_matter_id);
    when 'evidence_item' then
      return exists (select 1 from public.evidence_items where id = entity_id and matter_id = target_matter_id);
    when 'task' then
      return exists (select 1 from public.tasks where id = entity_id and matter_id = target_matter_id);
    when 'strategy_item' then
      return exists (select 1 from public.strategy_items where id = entity_id and matter_id = target_matter_id);
    when 'work_product' then
      return exists (select 1 from public.work_products where id = entity_id and matter_id = target_matter_id);
    when 'relationship' then
      return exists (select 1 from public.relationships where id = entity_id and matter_id = target_matter_id);
    else
      return false;
  end case;
end;
$$;

create or replace function public.validate_relationship_scope()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not public.entity_in_matter(new.from_type, new.from_id, new.matter_id)
    or not public.entity_in_matter(new.to_type, new.to_id, new.matter_id) then
    raise exception 'relationship endpoints must exist in the same matter';
  end if;
  return new;
end;
$$;

create or replace function public.validate_confirmation_scope()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not public.entity_in_matter(new.entity_type, new.entity_id, new.matter_id) then
    raise exception 'confirmation target must exist in the same matter';
  end if;
  return new;
end;
$$;

revoke all on function public.entity_in_matter(text, uuid, uuid) from public;
revoke all on function public.validate_relationship_scope() from public;
revoke all on function public.validate_confirmation_scope() from public;

create trigger relationships_validate_scope
before insert or update on public.relationships
for each row execute function public.validate_relationship_scope();

create trigger confirmations_validate_scope
before insert on public.confirmations
for each row execute function public.validate_confirmation_scope();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'matters', 'parties', 'sources', 'derivatives', 'statements', 'events',
    'recollections', 'legal_authorities', 'issues', 'evidence_items', 'tasks',
    'strategy_items', 'work_products', 'relationships', 'processing_jobs'
  ]
  loop
    execute format(
      'create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      table_name, table_name
    );
  end loop;

  foreach table_name in array array[
    'parties', 'sources', 'derivatives', 'statements', 'events',
    'recollections', 'legal_authorities', 'issues', 'evidence_items', 'tasks',
    'strategy_items', 'work_products', 'relationships', 'processing_jobs'
  ]
  loop
    execute format(
      'create trigger %I_protect_scope before update on public.%I for each row execute function public.protect_record_scope()',
      table_name, table_name
    );
  end loop;
end;
$$;

create or replace function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_data jsonb;
  new_data jsonb;
  target_data jsonb;
begin
  old_data := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  new_data := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  target_data := coalesce(new_data, old_data);

  insert into public.audit_log (
    matter_id,
    table_name,
    record_id,
    action,
    actor_id,
    old_record,
    new_record
  )
  values (
    case
      when tg_table_name = 'matters' then (target_data ->> 'id')::uuid
      else (target_data ->> 'matter_id')::uuid
    end,
    tg_table_name,
    case
      when tg_table_name = 'matter_members' then (target_data ->> 'user_id')::uuid
      else (target_data ->> 'id')::uuid
    end,
    tg_op,
    auth.uid(),
    old_data,
    new_data
  );
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'matters', 'matter_members', 'parties', 'sources', 'source_files',
    'derivatives', 'statements', 'events', 'recollections',
    'legal_authorities', 'issues', 'evidence_items', 'tasks', 'strategy_items',
    'work_products', 'relationships', 'confirmations', 'processing_jobs'
  ]
  loop
    execute format(
      'create trigger %I_audit after insert or update or delete on public.%I for each row execute function public.write_audit_log()',
      table_name, table_name
    );
  end loop;
end;
$$;

alter table public.matters enable row level security;
alter table public.matter_members enable row level security;

create policy "members read matters"
on public.matters for select to authenticated
using (public.is_matter_member(id) or owner_id = (select auth.uid()));

create policy "users create their own matters"
on public.matters for insert to authenticated
with check (owner_id = (select auth.uid()));

create policy "editors update matters"
on public.matters for update to authenticated
using (public.can_edit_matter(id))
with check (public.can_edit_matter(id));

create policy "members read membership"
on public.matter_members for select to authenticated
using (public.is_matter_member(matter_id));

create policy "owners add members"
on public.matter_members for insert to authenticated
with check (public.owns_matter(matter_id));

create policy "owners update members"
on public.matter_members for update to authenticated
using (public.owns_matter(matter_id))
with check (public.owns_matter(matter_id));

create policy "owners remove members"
on public.matter_members for delete to authenticated
using (
  public.owns_matter(matter_id)
  and user_id <> (select auth.uid())
);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'parties', 'sources', 'source_files', 'derivatives', 'statements', 'events',
    'recollections', 'legal_authorities', 'issues', 'evidence_items', 'tasks',
    'strategy_items', 'work_products', 'relationships', 'confirmations',
    'processing_jobs'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format(
      'create policy "members read %1$s" on public.%1$I for select to authenticated using (public.is_matter_member(matter_id))',
      table_name
    );
    execute format(
      'create policy "editors create %1$s" on public.%1$I for insert to authenticated with check (public.can_edit_matter(matter_id))',
      table_name
    );
    if table_name <> 'confirmations' then
      execute format(
        'create policy "editors update %1$s" on public.%1$I for update to authenticated using (public.can_edit_matter(matter_id)) with check (public.can_edit_matter(matter_id))',
        table_name
      );
    end if;
  end loop;
end;
$$;

alter table public.audit_log enable row level security;
create policy "members read audit log"
on public.audit_log for select to authenticated
using (public.is_matter_member(matter_id));

insert into storage.buckets (id, name, public, file_size_limit)
values ('matter-originals', 'matter-originals', false, 52428800)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit;

create or replace function public.path_matter_id(object_name text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
begin
  return split_part(object_name, '/', 1)::uuid;
exception
  when invalid_text_representation then
    return null;
end;
$$;

revoke all on function public.path_matter_id(text) from public;
grant execute on function public.path_matter_id(text) to authenticated;

create policy "members read original objects"
on storage.objects for select to authenticated
using (
  bucket_id = 'matter-originals'
  and public.is_matter_member(public.path_matter_id(name))
);

create policy "editors upload original objects"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'matter-originals'
  and public.can_edit_matter(public.path_matter_id(name))
  and owner_id = (select auth.uid()::text)
);

grant usage on schema public to authenticated;
grant select, insert, update on all tables in schema public to authenticated;
revoke delete on all tables in schema public from authenticated;
revoke insert, update, delete on public.audit_log from authenticated;
revoke update on public.confirmations from authenticated;
