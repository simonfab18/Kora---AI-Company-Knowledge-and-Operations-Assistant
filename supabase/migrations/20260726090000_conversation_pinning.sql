alter table public.conversations
  add column if not exists pinned_at timestamptz;

create index if not exists conversations_user_org_pinned_updated_idx
  on public.conversations (user_id, organization_id, pinned_at desc nulls last, updated_at desc);