-- Phase 1: enforce organization ownership and membership authorization in PostgreSQL.

create or replace function private.require_org_manager(target_org_id uuid)
returns public.organization_role
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor_role public.organization_role;
begin
  if auth.uid() is null
    or coalesce(auth.jwt() ->> 'is_anonymous', 'false') = 'true'
  then
    raise exception 'Authentication required';
  end if;

  select role into actor_role
  from public.organization_members
  where organization_id = target_org_id
    and user_id = auth.uid()
    and status = 'active'
    and role in ('owner', 'admin');

  if actor_role is null then
    raise exception 'Owner or admin role required';
  end if;

  return actor_role;
end;
$$;

create or replace function private.update_organization_profile(
  p_organization_id uuid,
  p_name text,
  p_slug text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_org_manager(p_organization_id);

  if p_name is null or char_length(trim(p_name)) < 2 or char_length(trim(p_name)) > 100 then
    raise exception 'Organization name must be between 2 and 100 characters';
  end if;

  if p_slug is null
    or char_length(trim(p_slug)) < 2
    or char_length(trim(p_slug)) > 80
    or trim(p_slug) !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  then
    raise exception 'Organization slug must contain 2 to 80 lowercase letters, numbers, or single hyphens';
  end if;

  update public.organizations
  set name = trim(p_name),
      slug = trim(p_slug),
      updated_at = now()
  where id = p_organization_id;
end;
$$;

create or replace function private.update_organization_retrieval_threshold(
  p_organization_id uuid,
  p_retrieval_threshold real
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_org_manager(p_organization_id);

  if p_retrieval_threshold is null
    or p_retrieval_threshold < 0.20
    or p_retrieval_threshold > 0.85
  then
    raise exception 'Retrieval threshold must be between 0.20 and 0.85';
  end if;

  update public.organizations
  set retrieval_threshold = p_retrieval_threshold,
      updated_at = now()
  where id = p_organization_id;
end;
$$;

create or replace function private.manage_organization_member(
  p_action text,
  p_organization_id uuid,
  p_user_id uuid,
  p_role public.organization_role default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  canonical_owner_id uuid;
  existing_member public.organization_members%rowtype;
begin
  perform private.require_org_manager(p_organization_id);

  if p_user_id is null or p_user_id = current_user_id then
    raise exception 'You cannot change your own organization access';
  end if;

  select owner_user_id into canonical_owner_id
  from public.organizations
  where id = p_organization_id;

  if canonical_owner_id is null then
    raise exception 'Organization not found';
  end if;

  if p_user_id = canonical_owner_id then
    raise exception 'Owner access cannot be changed';
  end if;

  if p_action in ('add', 'role') and (p_role is null or p_role = 'owner') then
    raise exception 'Ownership transfer is not available';
  end if;

  if p_action = 'add' then
    if not exists (
      select 1
      from public.organization_members target_membership
      join public.organization_members actor_membership
        on actor_membership.organization_id = target_membership.organization_id
      where target_membership.user_id = p_user_id
        and actor_membership.user_id = current_user_id
        and actor_membership.status = 'active'
        and actor_membership.role in ('owner', 'admin')
    ) then
      raise exception 'The selected user is not part of a managed organization';
    end if;

    select * into existing_member
    from public.organization_members
    where organization_id = p_organization_id
      and user_id = p_user_id
    for update;

    if existing_member.user_id is not null and existing_member.status = 'active' then
      raise exception 'The selected user already has active access';
    end if;

    insert into public.organization_members (
      organization_id, user_id, role, status, invited_by, joined_at
    )
    values (
      p_organization_id, p_user_id, p_role, 'active', current_user_id, now()
    )
    on conflict (organization_id, user_id) do update
      set role = excluded.role,
          status = 'active',
          invited_by = current_user_id,
          joined_at = coalesce(public.organization_members.joined_at, now());
    return;
  end if;

  if p_action = 'role' then
    update public.organization_members
    set role = p_role
    where organization_id = p_organization_id
      and user_id = p_user_id
      and status = 'active';
  elsif p_action = 'disable' then
    update public.organization_members
    set status = 'disabled'
    where organization_id = p_organization_id
      and user_id = p_user_id
      and status = 'active';
  elsif p_action = 'remove' then
    delete from public.organization_members
    where organization_id = p_organization_id
      and user_id = p_user_id;
  else
    raise exception 'Unsupported membership action';
  end if;

  if not found then
    raise exception 'Active organization member not found';
  end if;
end;
$$;

create or replace function private.protect_organization_owner_id()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.owner_user_id is distinct from old.owner_user_id then
    raise exception 'Organization ownership transfer is not available';
  end if;
  return new;
end;
$$;

create or replace function private.enforce_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_organization_id uuid;
  canonical_owner_id uuid;
begin
  target_organization_id := case
    when tg_op = 'DELETE' then old.organization_id
    else new.organization_id
  end;

  select owner_user_id into canonical_owner_id
  from public.organizations
  where id = target_organization_id;

  -- A parent organization row is already gone while its memberships cascade.
  if canonical_owner_id is null then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    if old.user_id = canonical_owner_id then
      raise exception 'The organization owner membership cannot be removed';
    end if;
    return old;
  end if;

  if new.user_id = canonical_owner_id
    and (new.role <> 'owner' or new.status <> 'active')
  then
    raise exception 'The organization owner must keep an active owner membership';
  end if;

  if new.role = 'owner' and new.user_id <> canonical_owner_id then
    raise exception 'Only the canonical organization owner can have owner role';
  end if;

  if tg_op = 'UPDATE'
    and old.user_id = canonical_owner_id
    and new.user_id is distinct from old.user_id
  then
    raise exception 'The organization owner membership cannot be reassigned';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_organization_owner_id on public.organizations;
create trigger protect_organization_owner_id
before update of owner_user_id on public.organizations
for each row execute function private.protect_organization_owner_id();

drop trigger if exists enforce_owner_membership on public.organization_members;
create trigger enforce_owner_membership
before insert or update or delete on public.organization_members
for each row execute function private.enforce_owner_membership();

create or replace function public.update_organization_profile(uuid, text, text)
returns void language sql volatile security definer set search_path = ''
as $$ select private.update_organization_profile($1, $2, $3); $$;

create or replace function public.update_organization_retrieval_threshold(uuid, real)
returns void language sql volatile security definer set search_path = ''
as $$ select private.update_organization_retrieval_threshold($1, $2); $$;

create or replace function public.add_existing_organization_member(uuid, uuid, public.organization_role)
returns void language sql volatile security definer set search_path = ''
as $$ select private.manage_organization_member('add', $1, $2, $3); $$;

create or replace function public.update_organization_member_role(uuid, uuid, public.organization_role)
returns void language sql volatile security definer set search_path = ''
as $$ select private.manage_organization_member('role', $1, $2, $3); $$;

create or replace function public.disable_organization_member(uuid, uuid)
returns void language sql volatile security definer set search_path = ''
as $$ select private.manage_organization_member('disable', $1, $2, null); $$;

create or replace function public.remove_organization_member(uuid, uuid)
returns void language sql volatile security definer set search_path = ''
as $$ select private.manage_organization_member('remove', $1, $2, null); $$;

drop policy if exists "Managers can update their organizations" on public.organizations;
drop policy if exists "Managers can insert memberships" on public.organization_members;
drop policy if exists "Managers can update memberships" on public.organization_members;
drop policy if exists "Managers can delete memberships" on public.organization_members;

-- RLS does not protect TRUNCATE. Remove inherited broad privileges, then grant
-- only the authenticated reads the application requires.
revoke all privileges on table public.organizations from anon, authenticated;
revoke all privileges on table public.organization_members from anon, authenticated;
grant select on table public.organizations to authenticated;
grant select on table public.organization_members to authenticated;
revoke truncate on table public.organizations from service_role;
revoke truncate on table public.organization_members from service_role;

revoke execute on function private.require_org_manager(uuid) from public, anon, authenticated, service_role;
revoke execute on function private.update_organization_profile(uuid, text, text) from public, anon, authenticated, service_role;
revoke execute on function private.update_organization_retrieval_threshold(uuid, real) from public, anon, authenticated, service_role;
revoke execute on function private.manage_organization_member(text, uuid, uuid, public.organization_role) from public, anon, authenticated, service_role;

revoke execute on function private.protect_organization_owner_id() from public, anon, authenticated, service_role;
revoke execute on function private.enforce_owner_membership() from public, anon, authenticated, service_role;

revoke execute on function public.update_organization_profile(uuid, text, text) from public, anon, service_role;
revoke execute on function public.update_organization_retrieval_threshold(uuid, real) from public, anon, service_role;
revoke execute on function public.add_existing_organization_member(uuid, uuid, public.organization_role) from public, anon, service_role;
revoke execute on function public.update_organization_member_role(uuid, uuid, public.organization_role) from public, anon, service_role;
revoke execute on function public.disable_organization_member(uuid, uuid) from public, anon, service_role;
revoke execute on function public.remove_organization_member(uuid, uuid) from public, anon, service_role;
grant execute on function public.update_organization_profile(uuid, text, text) to authenticated;
grant execute on function public.update_organization_retrieval_threshold(uuid, real) to authenticated;
grant execute on function public.add_existing_organization_member(uuid, uuid, public.organization_role) to authenticated;
grant execute on function public.update_organization_member_role(uuid, uuid, public.organization_role) to authenticated;
grant execute on function public.disable_organization_member(uuid, uuid) to authenticated;
grant execute on function public.remove_organization_member(uuid, uuid) to authenticated;
