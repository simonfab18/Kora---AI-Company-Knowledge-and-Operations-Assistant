-- Milestone 11: knowledge gap detection and admin review workflow.
-- Safe to rerun.

create table if not exists public.knowledge_gaps (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  representative_question text not null check (char_length(representative_question) between 2 and 1000),
  question_fingerprint text not null,
  trigger_message_id uuid references public.messages(id) on delete set null,
  last_message_id uuid references public.messages(id) on delete set null,
  confidence public.answer_confidence,
  reason text not null default 'low_confidence'
    check (reason in ('insufficient_context', 'low_confidence', 'negative_feedback')),
  occurrence_count integer not null default 1 check (occurrence_count >= 1),
  status text not null default 'open'
    check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  resolution_notes text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists knowledge_gaps_org_status_last_seen_idx
  on public.knowledge_gaps (organization_id, status, last_seen_at desc);

create index if not exists knowledge_gaps_org_reason_idx
  on public.knowledge_gaps (organization_id, reason);

create unique index if not exists knowledge_gaps_open_fingerprint_idx
  on public.knowledge_gaps (organization_id, question_fingerprint)
  where status in ('open', 'reviewing');

alter table public.knowledge_gaps enable row level security;

grant select, update on public.knowledge_gaps to authenticated;
grant select, insert, update, delete on public.knowledge_gaps to service_role;

drop policy if exists "Managers can read organization knowledge gaps" on public.knowledge_gaps;
drop policy if exists "Managers can update organization knowledge gaps" on public.knowledge_gaps;

create policy "Managers can read organization knowledge gaps"
  on public.knowledge_gaps
  for select
  to authenticated
  using (public.is_org_manager(organization_id));

create policy "Managers can update organization knowledge gaps"
  on public.knowledge_gaps
  for update
  to authenticated
  using (public.is_org_manager(organization_id))
  with check (public.is_org_manager(organization_id));