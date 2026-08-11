alter table public.profiles
  add column if not exists display_name text,
  add column if not exists job_title text,
  add column if not exists department text,
  add column if not exists preferred_language text not null default 'English',
  add column if not exists appearance_preference text not null default 'dark',
  add column if not exists notification_preferences jsonb not null default '{"sync":true,"members":true,"gaps":true}'::jsonb;

create table if not exists public.user_notification_reads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  notification_id text not null,
  read_at timestamptz not null default now(),
  unique (organization_id, user_id, notification_id)
);

create table if not exists public.knowledge_collections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 100),
  description text,
  icon text not null default 'book',
  visibility text not null default 'organization' check (visibility in ('organization', 'managers')),
  status text not null default 'active' check (status in ('active', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  submitted_by uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  organization_name text,
  subject text not null,
  category text not null,
  description text not null,
  status text not null default 'open' check (status in ('open', 'reviewing', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.problem_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  submitted_by uuid references auth.users(id) on delete set null,
  title text not null,
  category text not null,
  page_url text,
  what_happened text not null,
  expected_behavior text not null,
  steps_to_reproduce text not null,
  include_diagnostics boolean not null default false,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_notification_reads_user_org_idx
  on public.user_notification_reads (user_id, organization_id, read_at desc);

create index if not exists knowledge_collections_org_created_idx
  on public.knowledge_collections (organization_id, created_at desc);

create index if not exists support_tickets_org_created_idx
  on public.support_tickets (organization_id, created_at desc);

create index if not exists problem_reports_org_created_idx
  on public.problem_reports (organization_id, created_at desc);

alter table public.user_notification_reads enable row level security;
alter table public.knowledge_collections enable row level security;
alter table public.support_tickets enable row level security;
alter table public.problem_reports enable row level security;

grant select, insert, update, delete on public.user_notification_reads to authenticated;
grant select, insert, update, delete on public.knowledge_collections to authenticated;
grant select, insert, update on public.support_tickets to authenticated;
grant select, insert, update on public.problem_reports to authenticated;
grant select, insert, update, delete on public.user_notification_reads to service_role;
grant select, insert, update, delete on public.knowledge_collections to service_role;
grant select, insert, update on public.support_tickets to service_role;
grant select, insert, update on public.problem_reports to service_role;

drop policy if exists "Users can read their notification state" on public.user_notification_reads;
drop policy if exists "Users can create their notification state" on public.user_notification_reads;
drop policy if exists "Users can update their notification state" on public.user_notification_reads;
drop policy if exists "Users can delete their notification state" on public.user_notification_reads;
drop policy if exists "Members can read collections" on public.knowledge_collections;
drop policy if exists "Managers can create collections" on public.knowledge_collections;
drop policy if exists "Managers can update collections" on public.knowledge_collections;
drop policy if exists "Managers can delete collections" on public.knowledge_collections;
drop policy if exists "Managers and submitters can read support tickets" on public.support_tickets;
drop policy if exists "Managers and submitters can read problem reports" on public.problem_reports;

create policy "Users can read their notification state"
  on public.user_notification_reads
  for select
  to authenticated
  using (user_id = (select auth.uid()) and public.is_org_member(organization_id));

create policy "Users can create their notification state"
  on public.user_notification_reads
  for insert
  to authenticated
  with check (user_id = (select auth.uid()) and public.is_org_member(organization_id));

create policy "Users can update their notification state"
  on public.user_notification_reads
  for update
  to authenticated
  using (user_id = (select auth.uid()) and public.is_org_member(organization_id))
  with check (user_id = (select auth.uid()) and public.is_org_member(organization_id));

create policy "Users can delete their notification state"
  on public.user_notification_reads
  for delete
  to authenticated
  using (user_id = (select auth.uid()) and public.is_org_member(organization_id));

create policy "Members can read collections"
  on public.knowledge_collections
  for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "Managers can create collections"
  on public.knowledge_collections
  for insert
  to authenticated
  with check (public.is_org_manager(organization_id) and created_by = (select auth.uid()));

create policy "Managers can update collections"
  on public.knowledge_collections
  for update
  to authenticated
  using (public.is_org_manager(organization_id))
  with check (public.is_org_manager(organization_id));

create policy "Managers can delete collections"
  on public.knowledge_collections
  for delete
  to authenticated
  using (public.is_org_manager(organization_id));

create policy "Managers and submitters can read support tickets"
  on public.support_tickets
  for select
  to authenticated
  using (
    submitted_by = (select auth.uid())
    or (organization_id is not null and public.is_org_manager(organization_id))
  );

create policy "Managers and submitters can read problem reports"
  on public.problem_reports
  for select
  to authenticated
  using (
    submitted_by = (select auth.uid())
    or (organization_id is not null and public.is_org_manager(organization_id))
  );
