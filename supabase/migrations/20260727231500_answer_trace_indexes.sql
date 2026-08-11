-- Cover answer diagnostic foreign keys used by retention, filtering, and cleanup.
create index if not exists answer_traces_user_idx
  on public.answer_traces (user_id)
  where user_id is not null;

create index if not exists answer_traces_conversation_idx
  on public.answer_traces (conversation_id)
  where conversation_id is not null;

create index if not exists answer_evidence_org_idx
  on public.answer_evidence (organization_id);

create index if not exists answer_evidence_chunk_idx
  on public.answer_evidence (chunk_id);

create index if not exists answer_evidence_source_idx
  on public.answer_evidence (source_id);
