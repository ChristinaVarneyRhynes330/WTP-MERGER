create extension if not exists vector with schema extensions;

alter table public.matters
  add column if not exists representation text
    check (representation in ('represented_by_counsel', 'self_represented')),
  add column if not exists counsel_name text,
  add column if not exists counsel_contact text;

create table if not exists public.source_chunks (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.matters(id) on delete cascade,
  source_id uuid not null,
  derivative_id uuid,
  page_number integer check (page_number is null or page_number > 0),
  chunk_index integer not null default 0 check (chunk_index >= 0),
  content text not null check (char_length(trim(content)) > 0),
  embedding vector(768),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, matter_id),
  foreign key (source_id, matter_id)
    references public.sources(id, matter_id),
  foreign key (derivative_id, matter_id)
    references public.derivatives(id, matter_id)
);

create index if not exists source_chunks_matter_source_idx
  on public.source_chunks(matter_id, source_id, page_number, chunk_index);

create index if not exists source_chunks_embedding_idx
  on public.source_chunks using hnsw (embedding vector_cosine_ops);

create table if not exists public.hearing_notes (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.matters(id) on delete cascade,
  hearing_at timestamptz,
  title text not null check (char_length(trim(title)) > 0),
  requested text,
  discussed text,
  ruled text,
  to_verify text,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learning_progress (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.matters(id) on delete cascade,
  module_number integer not null check (module_number between 1 and 10),
  module_slug text not null check (char_length(trim(module_slug)) > 0),
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'completed')),
  progress_percent integer not null default 0
    check (progress_percent between 0 and 100),
  reflection text,
  knowledge_check_score integer
    check (knowledge_check_score is null or knowledge_check_score between 0 and 100),
  completed_at timestamptz,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (matter_id, module_slug)
);

create index if not exists hearing_notes_matter_idx
  on public.hearing_notes(matter_id, hearing_at desc);
create index if not exists learning_progress_matter_idx
  on public.learning_progress(matter_id, module_number);

create or replace function public.match_source_chunks(
  query_embedding vector(768),
  target_matter_id uuid,
  match_threshold float default 0.5,
  match_count integer default 5
)
returns table (
  id uuid,
  source_id uuid,
  derivative_id uuid,
  page_number integer,
  chunk_index integer,
  content text,
  similarity float
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    chunks.id,
    chunks.source_id,
    chunks.derivative_id,
    chunks.page_number,
    chunks.chunk_index,
    chunks.content,
    (1 - (chunks.embedding <=> query_embedding))::float as similarity
  from public.source_chunks as chunks
  where chunks.matter_id = target_matter_id
    and public.is_matter_member(target_matter_id)
    and chunks.embedding is not null
    and (1 - (chunks.embedding <=> query_embedding)) >= coalesce(match_threshold, 0.5)
  order by chunks.embedding <=> query_embedding
  limit least(greatest(coalesce(match_count, 5), 1), 100);
$$;

revoke all on function public.match_source_chunks(vector(768), uuid, float, integer) from public;
grant execute on function public.match_source_chunks(vector(768), uuid, float, integer) to authenticated;

alter table public.source_chunks enable row level security;
alter table public.hearing_notes enable row level security;
alter table public.learning_progress enable row level security;

create policy "members read source chunks"
on public.source_chunks for select to authenticated
using (public.is_matter_member(matter_id));

create policy "editors create source chunks"
on public.source_chunks for insert to authenticated
with check (public.can_edit_matter(matter_id));

create policy "editors update source chunks"
on public.source_chunks for update to authenticated
using (public.can_edit_matter(matter_id))
with check (public.can_edit_matter(matter_id));

create policy "editors delete source chunks"
on public.source_chunks for delete to authenticated
using (public.can_edit_matter(matter_id));

create policy "members read hearing notes"
on public.hearing_notes for select to authenticated
using (public.is_matter_member(matter_id));

create policy "editors create hearing notes"
on public.hearing_notes for insert to authenticated
with check (public.can_edit_matter(matter_id));

create policy "editors update hearing notes"
on public.hearing_notes for update to authenticated
using (public.can_edit_matter(matter_id))
with check (public.can_edit_matter(matter_id));

create policy "editors delete hearing notes"
on public.hearing_notes for delete to authenticated
using (public.can_edit_matter(matter_id));

create policy "members read learning progress"
on public.learning_progress for select to authenticated
using (public.is_matter_member(matter_id));

create policy "editors create learning progress"
on public.learning_progress for insert to authenticated
with check (public.can_edit_matter(matter_id));

create policy "editors update learning progress"
on public.learning_progress for update to authenticated
using (public.can_edit_matter(matter_id))
with check (public.can_edit_matter(matter_id));

create policy "editors delete learning progress"
on public.learning_progress for delete to authenticated
using (public.can_edit_matter(matter_id));

create trigger source_chunks_set_updated_at
before update on public.source_chunks
for each row execute function public.set_updated_at();

create trigger source_chunks_protect_scope
before update on public.source_chunks
for each row execute function public.protect_record_scope();

create trigger hearing_notes_set_updated_at
before update on public.hearing_notes
for each row execute function public.set_updated_at();

create trigger hearing_notes_protect_scope
before update on public.hearing_notes
for each row execute function public.protect_record_scope();

create trigger learning_progress_set_updated_at
before update on public.learning_progress
for each row execute function public.set_updated_at();

create trigger learning_progress_protect_scope
before update on public.learning_progress
for each row execute function public.protect_record_scope();

create trigger source_chunks_audit
after insert or update or delete on public.source_chunks
for each row execute function public.write_audit_log();

create trigger hearing_notes_audit
after insert or update or delete on public.hearing_notes
for each row execute function public.write_audit_log();

create trigger learning_progress_audit
after insert or update or delete on public.learning_progress
for each row execute function public.write_audit_log();

create or replace function public.queue_source_ingestion_job()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.processing_jobs (
    matter_id,
    source_id,
    job_type,
    status,
    attempt_count,
    process_version,
    created_by
  )
  values (
    new.matter_id,
    new.id,
    'ocr_embeddings',
    'queued',
    0,
    'gemini-2.5-flash-text-embedding-004',
    coalesce(auth.uid(), new.created_by)
  );
  return new;
end;
$$;

create trigger sources_queue_ingestion
after insert on public.sources
for each row execute function public.queue_source_ingestion_job();
