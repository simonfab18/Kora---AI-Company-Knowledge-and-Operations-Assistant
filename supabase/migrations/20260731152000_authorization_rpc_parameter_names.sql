-- Expose stable parameter names so PostgREST can resolve the Phase 1 RPCs.

drop function if exists public.update_organization_profile(uuid, text, text);
drop function if exists public.update_organization_retrieval_threshold(uuid, real);
drop function if exists public.add_existing_organization_member(uuid, uuid, public.organization_role);
drop function if exists public.update_organization_member_role(uuid, uuid, public.organization_role);
drop function if exists public.disable_organization_member(uuid, uuid);
drop function if exists public.remove_organization_member(uuid, uuid);

create function public.update_organization_profile(
  p_organization_id uuid,
  p_name text,
  p_slug text
)
returns void language sql volatile security definer set search_path = ''
as $$ select private.update_organization_profile(p_organization_id, p_name, p_slug); $$;

create function public.update_organization_retrieval_threshold(
  p_organization_id uuid,
  p_retrieval_threshold real
)
returns void language sql volatile security definer set search_path = ''
as $$ select private.update_organization_retrieval_threshold(p_organization_id, p_retrieval_threshold); $$;

create function public.add_existing_organization_member(
  p_organization_id uuid,
  p_user_id uuid,
  p_role public.organization_role
)
returns void language sql volatile security definer set search_path = ''
as $$ select private.manage_organization_member('add', p_organization_id, p_user_id, p_role); $$;

create function public.update_organization_member_role(
  p_organization_id uuid,
  p_user_id uuid,
  p_role public.organization_role
)
returns void language sql volatile security definer set search_path = ''
as $$ select private.manage_organization_member('role', p_organization_id, p_user_id, p_role); $$;

create function public.disable_organization_member(
  p_organization_id uuid,
  p_user_id uuid
)
returns void language sql volatile security definer set search_path = ''
as $$ select private.manage_organization_member('disable', p_organization_id, p_user_id, null); $$;

create function public.remove_organization_member(
  p_organization_id uuid,
  p_user_id uuid
)
returns void language sql volatile security definer set search_path = ''
as $$ select private.manage_organization_member('remove', p_organization_id, p_user_id, null); $$;

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