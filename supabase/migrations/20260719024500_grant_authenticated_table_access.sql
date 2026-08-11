-- Allow authenticated users to access public tables through the Supabase Data API.
-- RLS policies below the table-privilege layer still enforce row-level ownership and tenant access.

grant usage on schema public to anon, authenticated;

grant select, insert, update on table public.profiles to authenticated;
grant select on table public.organizations to authenticated;
grant select on table public.organization_members to authenticated;