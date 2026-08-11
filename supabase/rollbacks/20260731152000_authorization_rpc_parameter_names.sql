-- Corrective migration rollback note:
-- 20260731152000 gave public RPC wrappers stable parameter names for PostgREST callers.
-- Reverting those names would break the application actions that call the hardened RPCs.
-- In an emergency, roll back the full authorization hardening package with
-- supabase/rollbacks/20260731144716_authorization_hardening.sql instead.
select '20260731152000 rollback intentionally retains stable RPC parameter names' as rollback_note;
