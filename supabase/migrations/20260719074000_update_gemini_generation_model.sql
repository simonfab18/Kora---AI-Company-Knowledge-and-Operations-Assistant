-- Correct Gemini generation model for keys that no longer have quota on gemini-2.0-flash.
-- Safe to rerun.

update public.organizations
set generation_model = 'gemini-flash-latest',
    ai_provider = 'gemini',
    updated_at = now()
where ai_provider = 'gemini'
  and generation_model in ('gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.0-flash-lite-001');