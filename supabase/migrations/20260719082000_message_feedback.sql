-- Milestone 11: answer feedback loop.
-- Safe to rerun.

create table if not exists public.message_feedback (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating text not null check (rating in ('helpful', 'not_helpful')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (message_id, user_id)
);

create index if not exists message_feedback_org_rating_created_idx
  on public.message_feedback (organization_id, rating, created_at desc);

create index if not exists message_feedback_message_idx
  on public.message_feedback (message_id);

alter table public.message_feedback enable row level security;

grant select, insert, update on public.message_feedback to authenticated;
grant select, insert, update, delete on public.message_feedback to service_role;

drop policy if exists "Users can read their message feedback" on public.message_feedback;
drop policy if exists "Users can create their message feedback" on public.message_feedback;
drop policy if exists "Users can update their message feedback" on public.message_feedback;
drop policy if exists "Managers can read organization message feedback" on public.message_feedback;

create policy "Users can read their message feedback"
  on public.message_feedback
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    and public.is_org_member(organization_id)
  );

create policy "Users can create their message feedback"
  on public.message_feedback
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and public.is_org_member(organization_id)
    and exists (
      select 1
      from public.messages m
      join public.conversations c on c.id = m.conversation_id
      where m.id = message_id
        and m.organization_id = message_feedback.organization_id
        and m.role = 'assistant'
        and c.user_id = (select auth.uid())
    )
  );

create policy "Users can update their message feedback"
  on public.message_feedback
  for update
  to authenticated
  using (
    user_id = (select auth.uid())
    and public.is_org_member(organization_id)
  )
  with check (
    user_id = (select auth.uid())
    and public.is_org_member(organization_id)
  );

create policy "Managers can read organization message feedback"
  on public.message_feedback
  for select
  to authenticated
  using (public.is_org_manager(organization_id));
