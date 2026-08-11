-- Correct Gemini embedding model for current Gemini API.
-- Safe to rerun.

update public.organizations
set embedding_model = 'gemini-embedding-001',
    embedding_provider = 'gemini',
    embedding_dimension = 1536,
    updated_at = now()
where embedding_provider = 'gemini'
  and embedding_model = 'text-embedding-004';