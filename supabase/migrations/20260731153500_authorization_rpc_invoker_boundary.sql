-- Keep exposed RPC wrappers as invokers. Privileged implementations remain in
-- the non-exposed private schema and perform their own JWT authorization.

alter function public.update_organization_profile(uuid, text, text) security invoker;
alter function public.update_organization_retrieval_threshold(uuid, real) security invoker;
alter function public.add_existing_organization_member(uuid, uuid, public.organization_role) security invoker;
alter function public.update_organization_member_role(uuid, uuid, public.organization_role) security invoker;
alter function public.disable_organization_member(uuid, uuid) security invoker;
alter function public.remove_organization_member(uuid, uuid) security invoker;

grant execute on function private.require_org_manager(uuid) to authenticated;
grant execute on function private.update_organization_profile(uuid, text, text) to authenticated;
grant execute on function private.update_organization_retrieval_threshold(uuid, real) to authenticated;
grant execute on function private.manage_organization_member(text, uuid, uuid, public.organization_role) to authenticated;