create table if not exists public.handoff_files (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.matters(id) on delete cascade,
  drive_file_id text not null check (char_length(trim(drive_file_id)) > 0),
  full_tree_path text not null check (char_length(trim(full_tree_path)) > 0),
  file_name text not null check (char_length(trim(file_name)) > 0),
  file_url text,
  mime_type text,
  last_updated timestamptz,
  review_status text not null default 'unverified'
    check (review_status in ('unverified', 'in_review', 'verified', 'archived')),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  assigned_to uuid references auth.users(id) on delete set null,
  notes text,
  preservation_flag boolean not null default false,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (matter_id, drive_file_id),
  unique (id, matter_id)
);

create index if not exists handoff_files_matter_status_idx
  on public.handoff_files(matter_id, review_status, priority);

create table if not exists public.evidence_pathways (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.matters(id) on delete cascade,
  handoff_file_id uuid not null references public.handoff_files(id) on delete cascade,
  clerk_filing_status text not null default 'unknown'
    check (clerk_filing_status in ('unknown', 'filed', 'not_filed', 'unverified')),
  proffer_status text not null default 'unknown'
    check (proffer_status in ('unknown', 'offered', 'not_offered', 'unverified')),
  admission_status text not null default 'unknown'
    check (admission_status in ('unknown', 'admitted', 'not_admitted', 'unverified')),
  transmitted_roa_status text not null default 'unknown'
    check (transmitted_roa_status in ('unknown', 'included', 'not_included', 'unverified')),
  pathway_rule text,
  citations text[] not null default '{}',
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (handoff_file_id),
  unique (id, matter_id),
  foreign key (handoff_file_id, matter_id)
    references public.handoff_files(id, matter_id)
);

create index if not exists evidence_pathways_matter_idx
  on public.evidence_pathways(matter_id, admission_status, transmitted_roa_status);

create table if not exists public.counsel_qa_items (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.matters(id) on delete cascade,
  handoff_file_id uuid,
  question text not null check (char_length(trim(question)) > 0),
  status text not null default 'active'
    check (status in ('active', 'resolved', 'archived', 'unverified')),
  answer text,
  assigned_to uuid references auth.users(id) on delete set null,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (handoff_file_id, matter_id)
    references public.handoff_files(id, matter_id)
    on delete cascade
);

create index if not exists counsel_qa_items_active_idx
  on public.counsel_qa_items(matter_id, status, updated_at desc);

alter table public.handoff_files enable row level security;
alter table public.evidence_pathways enable row level security;
alter table public.counsel_qa_items enable row level security;

create policy "members read handoff files"
on public.handoff_files for select to authenticated
using (public.is_matter_member(matter_id));

create policy "editors create handoff files"
on public.handoff_files for insert to authenticated
with check (public.can_edit_matter(matter_id));

create policy "editors update handoff files"
on public.handoff_files for update to authenticated
using (public.can_edit_matter(matter_id))
with check (public.can_edit_matter(matter_id));

create policy "editors delete handoff files"
on public.handoff_files for delete to authenticated
using (public.can_edit_matter(matter_id));

create policy "members read evidence pathways"
on public.evidence_pathways for select to authenticated
using (public.is_matter_member(matter_id));

create policy "editors create evidence pathways"
on public.evidence_pathways for insert to authenticated
with check (public.can_edit_matter(matter_id));

create policy "editors update evidence pathways"
on public.evidence_pathways for update to authenticated
using (public.can_edit_matter(matter_id))
with check (public.can_edit_matter(matter_id));

create policy "editors delete evidence pathways"
on public.evidence_pathways for delete to authenticated
using (public.can_edit_matter(matter_id));

create policy "members read counsel qa"
on public.counsel_qa_items for select to authenticated
using (public.is_matter_member(matter_id));

create policy "editors create counsel qa"
on public.counsel_qa_items for insert to authenticated
with check (public.can_edit_matter(matter_id));

create policy "editors update counsel qa"
on public.counsel_qa_items for update to authenticated
using (public.can_edit_matter(matter_id))
with check (public.can_edit_matter(matter_id));

create policy "editors delete counsel qa"
on public.counsel_qa_items for delete to authenticated
using (public.can_edit_matter(matter_id));

create trigger handoff_files_set_updated_at
before update on public.handoff_files
for each row execute function public.set_updated_at();

create trigger handoff_files_protect_scope
before update on public.handoff_files
for each row execute function public.protect_record_scope();

create trigger evidence_pathways_set_updated_at
before update on public.evidence_pathways
for each row execute function public.set_updated_at();

create trigger evidence_pathways_protect_scope
before update on public.evidence_pathways
for each row execute function public.protect_record_scope();

create trigger counsel_qa_items_set_updated_at
before update on public.counsel_qa_items
for each row execute function public.set_updated_at();

create trigger counsel_qa_items_protect_scope
before update on public.counsel_qa_items
for each row execute function public.protect_record_scope();

create or replace function public.upsert_handoff_file_scan(
  p_matter_id uuid,
  p_drive_file_id text,
  p_full_tree_path text,
  p_file_name text,
  p_file_url text default null,
  p_mime_type text default null,
  p_last_updated timestamptz default null
)
returns public.handoff_files
language plpgsql
security invoker
set search_path = ''
as $$
declare
  result public.handoff_files;
begin
  if not public.can_edit_matter(p_matter_id) then
    raise exception 'Matter edit access is required for handoff imports';
  end if;

  insert into public.handoff_files (
    matter_id,
    drive_file_id,
    full_tree_path,
    file_name,
    file_url,
    mime_type,
    last_updated,
    created_by
  )
  values (
    p_matter_id,
    p_drive_file_id,
    p_full_tree_path,
    p_file_name,
    p_file_url,
    p_mime_type,
    p_last_updated,
    auth.uid()
  )
  on conflict (matter_id, drive_file_id) do update
  set
    full_tree_path = excluded.full_tree_path,
    file_name = excluded.file_name,
    file_url = excluded.file_url,
    mime_type = excluded.mime_type,
    last_updated = excluded.last_updated,
    updated_at = now()
  returning * into result;

  return result;
end;
$$;

revoke all on function public.upsert_handoff_file_scan(
  uuid, text, text, text, text, text, timestamptz
) from public;
grant execute on function public.upsert_handoff_file_scan(
  uuid, text, text, text, text, text, timestamptz
) to authenticated;

create trigger handoff_files_audit
after insert or update or delete on public.handoff_files
for each row execute function public.write_audit_log();

create trigger evidence_pathways_audit
after insert or update or delete on public.evidence_pathways
for each row execute function public.write_audit_log();

create trigger counsel_qa_items_audit
after insert or update or delete on public.counsel_qa_items
for each row execute function public.write_audit_log();
