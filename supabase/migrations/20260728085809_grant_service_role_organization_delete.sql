-- Organization deletion is a server-only operation. The service role bypasses
-- RLS but still needs the underlying table privilege.
grant delete on table public.organizations to service_role;