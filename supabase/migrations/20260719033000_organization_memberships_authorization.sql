-- Milestone 4: organizations, invitations, memberships, authorization, and audit events.

create table if not exists public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role public.organization_role not null default 'member',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  token uuid not null default gen_random_uuid() unique,
  invited_by uuid not null references auth.users(id),
  accepted_by uuid references auth.users(id),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, email)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists organization_invitations_org_idx
  on public.organization_invitations (organization_id);

create index if not exists organization_invitations_email_idx
  on public.organization_invitations (lower(email));

create index if not exists audit_logs_org_created_idx
  on public.audit_logs (organization_id, created_at desc);

alter table public.organization_invitations enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.is_org_manager(target_org_id uuid)
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
      and om.role in ('owner', 'admin')
  );
$$;

create or replace function public.is_org_owner(target_org_id uuid)
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
      and om.role = 'owner'
  );
$$;

create or replace function public.accept_organization_invitation(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  invite_record public.organization_invitations%rowtype;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select * into invite_record
  from public.organization_invitations oi
  where oi.token = p_token
    and oi.status = 'pending'
    and lower(oi.email) = current_email;

  if invite_record.id is null then
    raise exception 'Invitation not found or does not match this account';
  end if;

  insert into public.organization_members (organization_id, user_id, role, status, invited_by, joined_at)
  values (
    invite_record.organization_id,
    current_user_id,
    invite_record.role,
    'active',
    invite_record.invited_by,
    now()
  )
  on conflict (organization_id, user_id) do update
    set role = excluded.role,
        status = 'active',
        joined_at = coalesce(public.organization_members.joined_at, now());

  update public.organization_invitations
  set status = 'accepted', accepted_by = current_user_id, accepted_at = now()
  where id = invite_record.id;

  insert into public.audit_logs (organization_id, actor_user_id, action, target_type, target_id, metadata)
  values (
    invite_record.organization_id,
    current_user_id,
    'member.invitation_accepted',
    'organization_invitation',
    invite_record.id::text,
    jsonb_build_object('email', invite_record.email, 'role', invite_record.role)
  );

  return invite_record.organization_id;
end;
$$;

revoke execute on function public.accept_organization_invitation(uuid) from public;
revoke execute on function public.accept_organization_invitation(uuid) from anon;
grant execute on function public.accept_organization_invitation(uuid) to authenticated;

grant usage on schema public to authenticated;
grant select, update on table public.organizations to authenticated;
grant select, insert, update, delete on table public.organization_members to authenticated;
grant select, insert, update on table public.organization_invitations to authenticated;
grant select, insert on table public.audit_logs to authenticated;

create policy "Organization members can read peer profiles"
  on public.profiles
  for select
  to authenticated
  using (
    id = (select auth.uid())
    or exists (
      select 1
      from public.organization_members viewer
      join public.organization_members peer
        on peer.organization_id = viewer.organization_id
      where viewer.user_id = (select auth.uid())
        and viewer.status = 'active'
        and peer.user_id = profiles.id
        and peer.status in ('active', 'disabled', 'invited')
    )
  );

create policy "Managers can update their organizations"
  on public.organizations
  for update
  to authenticated
  using (public.is_org_manager(id))
  with check (public.is_org_manager(id));

create policy "Managers can insert memberships"
  on public.organization_members
  for insert
  to authenticated
  with check (public.is_org_manager(organization_id));

create policy "Managers can update memberships"
  on public.organization_members
  for update
  to authenticated
  using (public.is_org_manager(organization_id))
  with check (public.is_org_manager(organization_id));

create policy "Managers can delete memberships"
  on public.organization_members
  for delete
  to authenticated
  using (public.is_org_manager(organization_id));

create policy "Managers can read invitations"
  on public.organization_invitations
  for select
  to authenticated
  using (public.is_org_manager(organization_id));

create policy "Users can read matching invitations"
  on public.organization_invitations
  for select
  to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

create policy "Managers can create invitations"
  on public.organization_invitations
  for insert
  to authenticated
  with check (public.is_org_manager(organization_id) and invited_by = (select auth.uid()));

create policy "Managers can update invitations"
  on public.organization_invitations
  for update
  to authenticated
  using (public.is_org_manager(organization_id))
  with check (public.is_org_manager(organization_id));

create policy "Managers can read audit logs"
  on public.audit_logs
  for select
  to authenticated
  using (public.is_org_manager(organization_id));

create policy "Managers can create audit logs"
  on public.audit_logs
  for insert
  to authenticated
  with check (public.is_org_manager(organization_id) and actor_user_id = (select auth.uid()));