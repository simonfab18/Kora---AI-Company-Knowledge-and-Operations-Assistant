-- Invitation acceptance activates existing members without changing their role.

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
    set role = public.organization_members.role,
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

revoke execute on function private.accept_organization_invitation(uuid) from public, anon, service_role;
grant execute on function private.accept_organization_invitation(uuid) to authenticated;
