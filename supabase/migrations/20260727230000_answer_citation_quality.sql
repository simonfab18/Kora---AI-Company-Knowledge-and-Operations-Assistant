-- Answer quality, hybrid retrieval, citation UX, and internal trace support.

alter table public.messages
  add column if not exists answer_mode text,
  add column if not exists follow_up_question text,
  add column if not exists suggested_follow_ups text[] not null default '{}';

alter table public.messages
  drop constraint if exists messages_answer_mode_check;

alter table public.messages
  add constraint messages_answer_mode_check
  check (
    answer_mode is null
    or answer_mode in (
      'fully_answerable',
      'partially_answerable',
      'ambiguous',
      'no_reliable_answer',
      'restricted'
    )
  );

alter table public.message_citations
  add column if not exists section_title text;

alter table public.message_feedback
  drop constraint if exists message_feedback_reason_check;

alter table public.message_feedback
  add constraint message_feedback_reason_check
  check (
    reason is null
    or reason in (
      'wrong_answer',
      'missing_context',
      'wrong_citation',
      'unclear',
      'too_vague',
      'too_long',
      'outdated',
      'other'
    )
  );

create table if not exists public.answer_traces (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete cascade,
  message_id uuid unique references public.messages(id) on delete cascade,
  question text not null,
  rewritten_queries text[] not null default '{}',
  answer text not null,
  answer_mode text not null check (answer_mode in ('fully_answerable', 'partially_answerable', 'ambiguous', 'no_reliable_answer', 'restricted')),
  model text,
  prompt_version text not null,
  retrieval_confidence text not null check (retrieval_confidence in ('high', 'medium', 'low', 'insufficient')),
  validation_status jsonb not null default '{}'::jsonb,
  latency_ms integer,
  input_tokens integer,
  output_tokens integer,
  created_at timestamptz not null default now()
);

create table if not exists public.answer_evidence (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  answer_trace_id uuid not null references public.answer_traces(id) on delete cascade,
  chunk_id uuid not null references public.document_chunks(id) on delete cascade,
  source_id uuid not null references public.documents(id) on delete cascade,
  vector_score real,
  keyword_score real,
  reranker_score real,
  citation_number integer,
  used_in_answer boolean not null default false,
  created_at timestamptz not null default now(),
  unique (answer_trace_id, chunk_id)
);

create index if not exists answer_traces_org_created_idx
  on public.answer_traces (organization_id, created_at desc);

create index if not exists answer_evidence_trace_idx
  on public.answer_evidence (answer_trace_id, citation_number);

create index if not exists document_chunks_content_fts_idx
  on public.document_chunks
  using gin (to_tsvector('simple', content));

alter table public.answer_traces enable row level security;
alter table public.answer_evidence enable row level security;

grant select on public.answer_traces, public.answer_evidence to authenticated;
grant select, insert, update, delete on public.answer_traces, public.answer_evidence to service_role;

drop policy if exists "Managers can read organization answer traces" on public.answer_traces;
create policy "Managers can read organization answer traces"
  on public.answer_traces for select to authenticated
  using (public.is_org_manager(organization_id));

drop policy if exists "Managers can read organization answer evidence" on public.answer_evidence;
create policy "Managers can read organization answer evidence"
  on public.answer_evidence for select to authenticated
  using (public.is_org_manager(organization_id));

create or replace function public.search_document_chunks_keyword(
  p_organization_id uuid,
  p_query text,
  p_match_count integer default 12
)
returns table (
  chunk_id uuid,
  document_id uuid,
  title text,
  source_url text,
  content text,
  heading_path text[],
  metadata jsonb,
  keyword_score real
)
language sql
stable
security invoker
set search_path = ''
as $$
  with query as (
    select websearch_to_tsquery('simple', left(p_query, 500)) as value
  )
  select
    dc.id as chunk_id,
    dc.document_id,
    d.title,
    d.source_url,
    dc.content,
    dc.heading_path,
    dc.metadata,
    ts_rank_cd(
      setweight(to_tsvector('simple', coalesce(d.title, '')), 'A') ||
      setweight(to_tsvector('simple', coalesce(array_to_string(dc.heading_path, ' '), '')), 'A') ||
      setweight(to_tsvector('simple', dc.content), 'B'),
      query.value,
      32
    )::real as keyword_score
  from public.document_chunks dc
  join public.documents d on d.id = dc.document_id
  cross join query
  where dc.organization_id = p_organization_id
    and d.organization_id = p_organization_id
    and d.sync_status = 'indexed'
    and d.is_archived = false
    and query.value @@ (
      to_tsvector('simple', coalesce(d.title, '')) ||
      to_tsvector('simple', coalesce(array_to_string(dc.heading_path, ' '), '')) ||
      to_tsvector('simple', dc.content)
    )
  order by keyword_score desc, dc.chunk_index asc
  limit least(greatest(p_match_count, 1), 30);
$$;

grant execute on function public.search_document_chunks_keyword(uuid, text, integer)
  to service_role;

