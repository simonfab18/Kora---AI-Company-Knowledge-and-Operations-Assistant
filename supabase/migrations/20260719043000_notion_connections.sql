create table if not exists public.notion_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  notion_workspace_id text not null,
  notion_workspace_name text not null,
  notion_workspace_icon text,
  bot_id text,
  access_token_ciphertext text not null,
  refresh_token_ciphertext text,
  token_expires_at timestamptz,
  status text not null default 'connected' check (status in ('connected', 'error', 'disconnected')),
  last_synced_at timestamptz,
  last_error text,
  connected_by uuid references auth.users(id) on delete set null,
  disconnected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, notion_workspace_id)
);

create table if not exists public.notion_oauth_states (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  state_hash text not null unique,
  status text not null default 'pending' check (status in ('pending', 'used', 'expired')),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notion_connections_org_status_idx
  on public.notion_connections (organization_id, status);

create index if not exists notion_oauth_states_hash_idx
  on public.notion_oauth_states (state_hash);

create index if not exists notion_oauth_states_expiry_idx
  on public.notion_oauth_states (expires_at);

alter table public.notion_connections enable row level security;
alter table public.notion_oauth_states enable row level security;

grant usage on schema public to authenticated;

revoke all on public.notion_connections from anon;
revoke all on public.notion_connections from authenticated;
grant select (
  id,
  organization_id,
  notion_workspace_id,
  notion_workspace_name,
  notion_workspace_icon,
  bot_id,
  status,
  last_synced_at,
  last_error,
  connected_by,
  disconnected_at,
  created_at,
  updated_at
) on public.notion_connections to authenticated;
grant insert (
  organization_id,
  notion_workspace_id,
  notion_workspace_name,
  notion_workspace_icon,
  bot_id,
  access_token_ciphertext,
  refresh_token_ciphertext,
  token_expires_at,
  status,
  last_error,
  connected_by,
  disconnected_at
) on public.notion_connections to authenticated;
grant update (
  notion_workspace_name,
  notion_workspace_icon,
  bot_id,
  access_token_ciphertext,
  refresh_token_ciphertext,
  token_expires_at,
  status,
  last_error,
  connected_by,
  disconnected_at,
  updated_at
) on public.notion_connections to authenticated;

grant select, insert, update on public.notion_oauth_states to authenticated;

create policy "Managers can read safe Notion connection metadata"
  on public.notion_connections
  for select
  to authenticated
  using (public.is_org_manager(organization_id));

create policy "Managers can create Notion connections"
  on public.notion_connections
  for insert
  to authenticated
  with check (public.is_org_manager(organization_id));

create policy "Managers can update Notion connections"
  on public.notion_connections
  for update
  to authenticated
  using (public.is_org_manager(organization_id))
  with check (public.is_org_manager(organization_id));

create policy "Managers can create their Notion OAuth states"
  on public.notion_oauth_states
  for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and public.is_org_manager(organization_id)
  );

create policy "Managers can read their Notion OAuth states"
  on public.notion_oauth_states
  for select
  to authenticated
  using (
    created_by = (select auth.uid())
    and public.is_org_manager(organization_id)
  );

create policy "Managers can consume their Notion OAuth states"
  on public.notion_oauth_states
  for update
  to authenticated
  using (
    created_by = (select auth.uid())
    and public.is_org_manager(organization_id)
  )
  with check (
    created_by = (select auth.uid())
    and public.is_org_manager(organization_id)
  );