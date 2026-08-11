-- Tune retrieval threshold for Gemini embeddings after live retrieval verification.
-- Safe to rerun.

update public.organizations
set retrieval_threshold = 0.50,
    updated_at = now()
where embedding_provider = 'gemini'
  and retrieval_threshold > 0.50;