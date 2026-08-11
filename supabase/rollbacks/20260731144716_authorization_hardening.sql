-- Emergency rollback for 20260731144716_authorization_hardening.sql.
-- WARNING: this restores the former broad manager-write surface. Use only to
-- recover availability, then reapply the hardening migration as soon as possible.

begin;

drop function if exists public.remove_organization_member(uuid, uuid);
drop function if exists public.disable_organization_member(uuid, uuid);
drop function if exists public.update_organization_member_role(uuid, uuid, public.organization_role);
drop function if exists public.add_existing_organization_member(uuid, uuid, public.organization_role);
drop function if exists public.update_organization_retrieval_threshold(uuid, real);
drop function if exists public.update_organization_profile(uuid, text, text);

drop trigger if exists enforce_owner_membership on public.organization_members;
drop trigger if exists protect_organization_owner_id on public.organizations;

drop function if exists private.enforce_owner_membership();
drop function if exists private.protect_organization_owner_id();
drop function if exists private.manage_organization_member(text, uuid, uuid, public.organization_role);
drop function if exists private.update_organization_retrieval_threshold(uuid, real);
drop function if exists private.update_organization_profile(uuid, text, text);
drop function if exists private.require_org_manager(uuid);

grant update on table public.organizations to authenticated;
grant insert, update, delete on table public.organization_members to authenticated;

drop policy if exists "Managers can update their organizations" on public.organizations;
create policy "Managers can update their organizations"
  on public.organizations
  for update
  to authenticated
  using (public.is_org_manager(id))
  with check (public.is_org_manager(id));

drop policy if exists "Managers can insert memberships" on public.organization_members;
create policy "Managers can insert memberships"
  on public.organization_members
  for insert
  to authenticated
  with check (public.is_org_manager(organization_id));

drop policy if exists "Managers can update memberships" on public.organization_members;
create policy "Managers can update memberships"
  on public.organization_members
  for update
  to authenticated
  using (public.is_org_manager(organization_id))
  with check (public.is_org_manager(organization_id));

drop policy if exists "Managers can delete memberships" on public.organization_members;
create policy "Managers can delete memberships"
  on public.organization_members
  for delete
  to authenticated
  using (public.is_org_manager(organization_id));

commit;