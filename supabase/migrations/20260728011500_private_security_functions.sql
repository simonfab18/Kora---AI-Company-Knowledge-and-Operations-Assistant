-- Keep privileged function bodies outside the exposed Data API schema.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create or replace function private.is_org_member(target_org_id uuid)
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

create or replace function private.is_org_manager(target_org_id uuid)
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

create or replace function private.is_org_owner(target_org_id uuid)
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

create or replace function private.create_organization(p_name text, p_slug text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  new_organization_id uuid;
  owned_organization_count integer;
begin
  if current_user_id is null or coalesce(auth.jwt() ->> 'is_anonymous', 'false') = 'true' then
    raise exception 'Authentication required';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(current_user_id::text, 0)
  );

  select count(*) into owned_organization_count
  from public.organizations o
  where o.owner_user_id = current_user_id;

  if owned_organization_count >= 3 then
    raise exception 'Owners can create up to 3 active organizations';
  end if;

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

create or replace function private.accept_organization_invitation(p_token uuid)
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
  if current_user_id is null
    or coalesce(auth.jwt() ->> 'is_anonymous', 'false') = 'true'
    or current_email = ''
  then
    raise exception 'Authentication required';
  end if;

  select * into invite_record
  from public.organization_invitations oi
  where oi.token = p_token
    and oi.status = 'pending'
    and oi.expires_at > now()
    and lower(oi.email) = current_email
  for update;

  if invite_record.id is null then
    raise exception 'Invitation not found, expired, or does not match this account';
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
  where id = invite_record.id
    and status = 'pending';

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

create or replace function public.is_org_member(target_org_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$ select private.is_org_member(target_org_id); $$;

create or replace function public.is_org_manager(target_org_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$ select private.is_org_manager(target_org_id); $$;

create or replace function public.is_org_owner(target_org_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$ select private.is_org_owner(target_org_id); $$;

create or replace function public.create_organization(p_name text, p_slug text)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$ select private.create_organization(p_name, p_slug); $$;

create or replace function public.accept_organization_invitation(p_token uuid)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$ select private.accept_organization_invitation(p_token); $$;

revoke execute on all functions in schema private from public, anon;
grant execute on function private.is_org_member(uuid) to authenticated, service_role;
grant execute on function private.is_org_manager(uuid) to authenticated, service_role;
grant execute on function private.is_org_owner(uuid) to authenticated, service_role;
grant execute on function private.create_organization(text, text) to authenticated;
grant execute on function private.accept_organization_invitation(uuid) to authenticated;

revoke execute on function public.is_org_member(uuid) from public, anon;
revoke execute on function public.is_org_manager(uuid) from public, anon;
revoke execute on function public.is_org_owner(uuid) from public, anon;
revoke execute on function public.create_organization(text, text) from public, anon, service_role;
revoke execute on function public.accept_organization_invitation(uuid) from public, anon, service_role;
grant execute on function public.is_org_member(uuid) to authenticated, service_role;
grant execute on function public.is_org_manager(uuid) to authenticated, service_role;
grant execute on function public.is_org_owner(uuid) to authenticated, service_role;
grant execute on function public.create_organization(text, text) to authenticated;
grant execute on function public.accept_organization_invitation(uuid) to authenticated;
