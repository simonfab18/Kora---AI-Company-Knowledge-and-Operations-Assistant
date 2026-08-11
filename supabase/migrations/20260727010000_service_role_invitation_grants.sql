grant usage on schema public to service_role;

grant select, insert, update, delete on table public.organization_members to service_role;
grant select, insert, update, delete on table public.organization_invitations to service_role;
grant select, insert on table public.audit_logs to service_role;