create or replace function public.create_organization(p_name text, p_slug text)
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
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select count(*) into owned_organization_count
  from public.organizations o
  where o.owner_user_id = current_user_id;

  if owned_organization_count >= 3 then
    raise exception 'Owners can create up to 3 active organizations';
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