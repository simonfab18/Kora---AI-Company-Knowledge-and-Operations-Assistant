-- Milestone 11/12 polish: feedback reasons, comments, missing-topic hints, and related sources.
-- Safe to rerun.

alter table public.message_feedback
  add column if not exists reason text
    check (
      reason is null
      or reason in (
        'wrong_answer',
        'missing_context',
        'unclear',
        'outdated',
        'other'
      )
    );

create index if not exists message_feedback_org_reason_created_idx
  on public.message_feedback (organization_id, reason, created_at desc);

alter table public.knowledge_gaps
  add column if not exists missing_topic text,
  add column if not exists related_document_id uuid references public.documents(id) on delete set null;

create index if not exists knowledge_gaps_org_missing_topic_idx
  on public.knowledge_gaps (organization_id, missing_topic);

create index if not exists knowledge_gaps_related_document_idx
  on public.knowledge_gaps (related_document_id);

grant select, insert, update on public.message_feedback to authenticated;
grant select, insert, update, delete on public.message_feedback to service_role;
grant select, update on public.knowledge_gaps to authenticated;
grant select, insert, update, delete on public.knowledge_gaps to service_role;
