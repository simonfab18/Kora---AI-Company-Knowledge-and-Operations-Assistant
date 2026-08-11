-- Preserve the intended destination across Notion OAuth.
alter table public.notion_oauth_states
  add column if not exists return_to text;

-- Keep OAuth destinations internal even if a row is written outside the app.
alter table public.notion_oauth_states
  drop constraint if exists notion_oauth_states_return_to_check;

alter table public.notion_oauth_states
  add constraint notion_oauth_states_return_to_check
  check (return_to is null or return_to in ('/app/settings', '/onboarding/sync'));

-- Earlier corrective migrations updated rows but left the old defaults behind.
alter table public.organizations
  alter column generation_model set default 'gemini-flash-latest',
  alter column embedding_model set default 'gemini-embedding-001',
  alter column retrieval_threshold set default 0.50;

update public.organizations
set generation_model = 'gemini-flash-latest',
    updated_at = now()
where ai_provider = 'gemini'
  and generation_model in (
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash-lite-001'
  );

update public.organizations
set embedding_model = 'gemini-embedding-001',
    retrieval_threshold = least(retrieval_threshold, 0.50),
    updated_at = now()
where embedding_provider = 'gemini'
  and embedding_model = 'text-embedding-004';