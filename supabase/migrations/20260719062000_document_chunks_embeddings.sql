create extension if not exists vector with schema extensions;
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  chunk_index integer not null check (chunk_index >= 0),
  content text not null,
  content_hash text not null,
  token_count integer not null check (token_count >= 0),
  heading_path text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  embedding_model text not null,
  embedding extensions.vector(1536) not null,
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index, content_hash)
);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  quantity integer not null default 1 check (quantity >= 0),
  provider text,
  model text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists document_chunks_org_idx
  on public.document_chunks (organization_id);

create index if not exists document_chunks_document_idx
  on public.document_chunks (document_id);

create index if not exists document_chunks_embedding_model_idx
  on public.document_chunks (organization_id, embedding_model);

create index if not exists usage_events_org_created_idx
  on public.usage_events (organization_id, created_at desc);

create index if not exists document_chunks_embedding_hnsw_idx
  on public.document_chunks
  using hnsw (embedding extensions.vector_cosine_ops);

alter table public.document_chunks enable row level security;
alter table public.usage_events enable row level security;

grant select on public.document_chunks to authenticated;
grant select on public.usage_events to authenticated;
grant insert on public.usage_events to authenticated;
grant usage on schema extensions to service_role;
grant select on public.organizations to service_role;
grant select, insert, update, delete on public.document_chunks to service_role;
grant select, insert on public.usage_events to service_role;

drop policy if exists "Managers can read organization document chunks" on public.document_chunks;
drop policy if exists "Managers can read organization usage events" on public.usage_events;
drop policy if exists "Managers can create organization usage events" on public.usage_events;
create policy "Managers can read organization document chunks"
  on public.document_chunks
  for select
  to authenticated
  using (public.is_org_manager(organization_id));

create policy "Managers can read organization usage events"
  on public.usage_events
  for select
  to authenticated
  using (public.is_org_manager(organization_id));

create policy "Managers can create organization usage events"
  on public.usage_events
  for insert
  to authenticated
  with check (public.is_org_manager(organization_id));

create or replace function public.replace_document_chunks(
  p_organization_id uuid,
  p_document_id uuid,
  p_chunks jsonb
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  inserted_count integer := 0;
begin
  delete from public.document_chunks
  where organization_id = p_organization_id
    and document_id = p_document_id;

  insert into public.document_chunks (
    organization_id,
    document_id,
    chunk_index,
    content,
    content_hash,
    token_count,
    heading_path,
    metadata,
    embedding_model,
    embedding
  )
  select
    p_organization_id,
    p_document_id,
    chunk_record.chunk_index,
    chunk_record.content,
    chunk_record.content_hash,
    chunk_record.token_count,
    coalesce(array(select jsonb_array_elements_text(chunk_record.heading_path)), '{}'::text[]),
    coalesce(chunk_record.metadata, '{}'::jsonb),
    chunk_record.embedding_model,
    chunk_record.embedding::extensions.vector(1536)
  from jsonb_to_recordset(p_chunks) as chunk_record(
    chunk_index integer,
    content text,
    content_hash text,
    token_count integer,
    heading_path jsonb,
    metadata jsonb,
    embedding_model text,
    embedding text
  );

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

create or replace function public.match_document_chunks(
  p_organization_id uuid,
  p_query_embedding extensions.vector(1536),
  p_embedding_model text,
  p_match_count integer default 8,
  p_min_similarity real default 0.68
)
returns table (
  chunk_id uuid,
  document_id uuid,
  title text,
  source_url text,
  content text,
  heading_path text[],
  metadata jsonb,
  similarity real
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    dc.id as chunk_id,
    dc.document_id,
    d.title,
    d.source_url,
    dc.content,
    dc.heading_path,
    dc.metadata,
    1 - (dc.embedding OPERATOR(extensions.<=>) p_query_embedding) as similarity
  from public.document_chunks dc
  join public.documents d on d.id = dc.document_id
  where dc.organization_id = p_organization_id
    and d.organization_id = p_organization_id
    and dc.embedding_model = p_embedding_model
    and d.sync_status = 'indexed'
    and d.is_archived = false
    and 1 - (dc.embedding OPERATOR(extensions.<=>) p_query_embedding) >= p_min_similarity
  order by dc.embedding OPERATOR(extensions.<=>) p_query_embedding
  limit least(greatest(p_match_count, 1), 30);
$$;

grant execute on function public.replace_document_chunks(uuid, uuid, jsonb) to service_role;
grant execute on function public.match_document_chunks(uuid, extensions.vector(1536), text, integer, real) to authenticated, service_role;