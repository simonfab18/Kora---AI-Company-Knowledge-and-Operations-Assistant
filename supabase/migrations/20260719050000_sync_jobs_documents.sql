do $$
begin
  create type public.document_status as enum (
    'pending',
    'syncing',
    'indexed',
    'failed',
    'archived'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.sync_job_status as enum (
    'queued',
    'running',
    'succeeded',
    'failed',
    'cancelled'
  );
exception
  when duplicate_object then null;
end $$;
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  connection_id uuid not null references public.notion_connections(id) on delete cascade,
  source_type text not null default 'notion_page',
  external_id text not null,
  parent_external_id text,
  title text not null,
  source_url text,
  normalized_content text not null default '',
  content_hash text not null,
  metadata jsonb not null default '{}'::jsonb,
  source_created_at timestamptz,
  source_updated_at timestamptz,
  last_indexed_at timestamptz,
  sync_status public.document_status not null default 'pending',
  is_archived boolean not null default false,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, source_type, external_id)
);

create table if not exists public.sync_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  connection_id uuid references public.notion_connections(id) on delete set null,
  requested_by uuid references auth.users(id) on delete set null,
  job_type text not null check (job_type in ('full', 'incremental', 'page', 'delete')),
  status public.sync_job_status not null default 'queued',
  celery_task_id text,
  total_items integer not null default 0 check (total_items >= 0),
  processed_items integer not null default 0 check (processed_items >= 0),
  failed_items integer not null default 0 check (failed_items >= 0),
  skipped_items integer not null default 0 check (skipped_items >= 0),
  error_code text,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists sync_jobs_one_active_per_org_idx
  on public.sync_jobs (organization_id)
  where status in ('queued', 'running');

create index if not exists documents_org_status_idx
  on public.documents (organization_id, sync_status);

create index if not exists documents_org_source_idx
  on public.documents (organization_id, source_type, external_id);

create index if not exists sync_jobs_org_created_idx
  on public.sync_jobs (organization_id, created_at desc);

alter table public.documents enable row level security;
alter table public.sync_jobs enable row level security;

grant select on public.documents to authenticated;
grant insert, update on public.documents to authenticated;
grant select on public.sync_jobs to authenticated;
grant insert, update on public.sync_jobs to authenticated;

create policy "Managers can read organization documents"
  on public.documents
  for select
  to authenticated
  using (public.is_org_manager(organization_id));

create policy "Managers can write organization documents"
  on public.documents
  for insert
  to authenticated
  with check (public.is_org_manager(organization_id));

create policy "Managers can update organization documents"
  on public.documents
  for update
  to authenticated
  using (public.is_org_manager(organization_id))
  with check (public.is_org_manager(organization_id));

create policy "Managers can read organization sync jobs"
  on public.sync_jobs
  for select
  to authenticated
  using (public.is_org_manager(organization_id));

create policy "Managers can create organization sync jobs"
  on public.sync_jobs
  for insert
  to authenticated
  with check (public.is_org_manager(organization_id));

create policy "Managers can update organization sync jobs"
  on public.sync_jobs
  for update
  to authenticated
  using (public.is_org_manager(organization_id))
  with check (public.is_org_manager(organization_id));