create extension if not exists pgcrypto with schema extensions;

create type public.organization_role as enum ('owner', 'admin', 'member');
create type public.member_status as enum ('invited', 'active', 'disabled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  slug text not null unique,
  owner_user_id uuid not null references auth.users(id),
  plan text not null default 'portfolio',
  ai_provider text not null default 'gemini',
  generation_model text not null default 'gemini-flash-latest',
  embedding_provider text not null default 'gemini',
  embedding_model text not null default 'gemini-embedding-001',
  embedding_dimension integer not null default 1536 check (embedding_dimension = 1536),
  retrieval_threshold real not null default 0.50 check (retrieval_threshold >= 0 and retrieval_threshold <= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.organization_role not null default 'member',
  status public.member_status not null default 'active',
  invited_by uuid references auth.users(id),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index organization_members_user_idx
  on public.organization_members (user_id);

create or replace function public.is_org_member(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = target_org_id
      and om.user_id = (select auth.uid())
      and om.status = 'active'
  );
$$;

create or replace function public.create_organization(p_name text, p_slug text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  new_organization_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_name is null or char_length(trim(p_name)) < 2 or char_length(trim(p_name)) > 100 then
    raise exception 'Organization name must be between 2 and 100 characters';
  end if;

  if p_slug is null or char_length(trim(p_slug)) < 2 then
    raise exception 'Organization slug is required';
  end if;

  insert into public.organizations (name, slug, owner_user_id)
  values (trim(p_name), trim(p_slug), current_user_id)
  returning id into new_organization_id;

  insert into public.organization_members (
    organization_id,
    user_id,
    role,
    status,
    joined_at
  )
  values (
    new_organization_id,
    current_user_id,
    'owner',
    'active',
    now()
  );

  return new_organization_id;
end;
$$;

revoke execute on function public.create_organization(text, text) from public;
revoke execute on function public.create_organization(text, text) from anon;
grant execute on function public.create_organization(text, text) to authenticated;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

create policy "Users can insert own profile"
  on public.profiles
  for insert
  to authenticated
  with check (id = (select auth.uid()));

create policy "Users can read own profile"
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "Members can read their organizations"
  on public.organizations
  for select
  to authenticated
  using (public.is_org_member(id));

create policy "Members can read memberships in their organizations"
  on public.organization_members
  for select
  to authenticated
  using (public.is_org_member(organization_id));
