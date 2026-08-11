-- Server actions use the service role after independently authorizing the user.
-- Keep these grants limited to the tables and operations required by onboarding.
grant select, update on table public.organizations to service_role;
grant select, insert, update on table public.profiles to service_role;

