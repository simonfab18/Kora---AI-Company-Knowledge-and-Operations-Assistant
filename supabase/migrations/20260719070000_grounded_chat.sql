do $$
begin
  create type public.message_role as enum ('user', 'assistant', 'system');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.message_status as enum ('pending', 'completed', 'failed');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.answer_confidence as enum ('high', 'medium', 'low', 'insufficient');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  role public.message_role not null,
  content text not null,
  status public.message_status not null default 'completed',
  confidence public.answer_confidence,
  model_provider text,
  model_name text,
  prompt_tokens integer,
  completion_tokens integer,
  latency_ms integer,
  error_code text,
  created_at timestamptz not null default now()
);

create table if not exists public.message_citations (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  chunk_id uuid not null references public.document_chunks(id) on delete cascade,
  citation_order integer not null check (citation_order >= 1),
  quote_excerpt text,
  similarity_score real,
  created_at timestamptz not null default now(),
  unique (message_id, citation_order)
);

create index if not exists conversations_user_org_updated_idx
  on public.conversations (user_id, organization_id, updated_at desc);

create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at asc);

create index if not exists messages_org_created_idx
  on public.messages (organization_id, created_at desc);

create index if not exists message_citations_message_idx
  on public.message_citations (message_id, citation_order);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.message_citations enable row level security;

grant select, insert, update on public.conversations to authenticated;
grant select, insert on public.messages to authenticated;
grant select, insert on public.message_citations to authenticated;
grant select, insert, update, delete on public.conversations to service_role;
grant select, insert, update, delete on public.messages to service_role;
grant select, insert, update, delete on public.message_citations to service_role;

do $$
begin
  create policy "Users can read their organization conversations"
    on public.conversations
    for select
    to authenticated
    using (
      user_id = (select auth.uid())
      and public.is_org_member(organization_id)
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Users can create their organization conversations"
    on public.conversations
    for insert
    to authenticated
    with check (
      user_id = (select auth.uid())
      and public.is_org_member(organization_id)
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Users can update their organization conversations"
    on public.conversations
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
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Users can read messages in their conversations"
    on public.messages
    for select
    to authenticated
    using (
      public.is_org_member(organization_id)
      and exists (
        select 1
        from public.conversations c
        where c.id = conversation_id
          and c.organization_id = messages.organization_id
          and c.user_id = (select auth.uid())
      )
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Users can create messages in their conversations"
    on public.messages
    for insert
    to authenticated
    with check (
      public.is_org_member(organization_id)
      and exists (
        select 1
        from public.conversations c
        where c.id = conversation_id
          and c.organization_id = messages.organization_id
          and c.user_id = (select auth.uid())
      )
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Users can read citations in their conversations"
    on public.message_citations
    for select
    to authenticated
    using (
      exists (
        select 1
        from public.messages m
        join public.conversations c on c.id = m.conversation_id
        where m.id = message_id
          and c.user_id = (select auth.uid())
          and public.is_org_member(m.organization_id)
      )
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Users can create citations in their conversations"
    on public.message_citations
    for insert
    to authenticated
    with check (
      exists (
        select 1
        from public.messages m
        join public.conversations c on c.id = m.conversation_id
        where m.id = message_id
          and c.user_id = (select auth.uid())
          and public.is_org_member(m.organization_id)
          and exists (
            select 1
            from public.document_chunks dc
            where dc.id = chunk_id
              and dc.document_id = document_id
              and dc.organization_id = m.organization_id
          )
      )
    );
exception
  when duplicate_object then null;
end $$;