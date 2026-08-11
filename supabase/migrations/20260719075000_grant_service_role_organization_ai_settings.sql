-- Corrective grant for server-side AI diagnostics and model maintenance.
-- Safe to rerun.

grant update (ai_provider, generation_model, updated_at)
on table public.organizations
to service_role;

update public.organizations
set generation_model = 'gemini-flash-latest',
    ai_provider = 'gemini',
    updated_at = now()
where ai_provider = 'gemini'
  and generation_model in (
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash-lite-001'
  );
