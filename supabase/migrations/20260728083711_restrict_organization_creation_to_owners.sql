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
  active_membership_count integer;
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

  select count(*) into active_membership_count
  from public.organization_members om
  where om.user_id = current_user_id
    and om.status = 'active';

  if active_membership_count > 0 and owned_organization_count = 0 then
    raise exception 'Only organization owners can create another organization';
  end if;

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

comment on function private.create_organization(text, text) is
  'Creates a first organization for users without active memberships, or an additional organization for existing owners, up to the active organization limit.';