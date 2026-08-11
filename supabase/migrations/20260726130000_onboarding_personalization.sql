alter table public.organizations
  add column if not exists industry text,
  add column if not exists company_size text,
  add column if not exists website text,
  add column if not exists description text,
  add column if not exists employee_term text,
  add column if not exists default_language text,
  add column if not exists onboarding_status text not null default 'not_started',
  add column if not exists onboarding_completed_at timestamptz;

alter table public.profiles
  add column if not exists display_name text,
  add column if not exists job_title text,
  add column if not exists department text,
  add column if not exists main_responsibility text,
  add column if not exists preferred_language text,
  add column if not exists onboarding_completed_at timestamptz;

create table if not exists public.organization_preferences (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  primary_use_cases text[] not null default '{}',
  initial_departments text[] not null default '{}',
  answer_length text not null default 'balanced',
  answer_tone text not null default 'friendly',
  default_language text not null default 'question_language',
  citations_required boolean not null default true,
  no_answer_behavior text not null default 'clear_gap',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.onboarding_progress (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  current_step text not null default 'welcome',
  completed_steps text[] not null default '{}',
  skipped_steps text[] not null default '{}',
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index if not exists onboarding_progress_user_idx
  on public.onboarding_progress (user_id, updated_at desc);

alter table public.organization_preferences enable row level security;
alter table public.onboarding_progress enable row level security;

grant select, insert, update on public.organization_preferences to authenticated;
grant select, insert, update on public.onboarding_progress to authenticated;
grant select, insert, update on public.organization_preferences to service_role;
grant select, insert, update on public.onboarding_progress to service_role;

drop policy if exists "Members can read organization preferences" on public.organization_preferences;
drop policy if exists "Managers can manage organization preferences" on public.organization_preferences;
drop policy if exists "Members can read onboarding progress" on public.onboarding_progress;
drop policy if exists "Users can manage own onboarding progress" on public.onboarding_progress;

create policy "Members can read organization preferences"
  on public.organization_preferences
  for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "Managers can manage organization preferences"
  on public.organization_preferences
  for all
  to authenticated
  using (public.is_org_manager(organization_id))
  with check (public.is_org_manager(organization_id));

create policy "Members can read onboarding progress"
  on public.onboarding_progress
  for select
  to authenticated
  using (public.is_org_member(organization_id) and user_id = (select auth.uid()));

create policy "Users can manage own onboarding progress"
  on public.onboarding_progress
  for all
  to authenticated
  using (public.is_org_member(organization_id) and user_id = (select auth.uid()))
  with check (public.is_org_member(organization_id) and user_id = (select auth.uid()));