-- Corrective migration rollback note:
-- 20260731153500 moved public RPC wrappers away from public SECURITY DEFINER exposure.
-- Reverting it would restore the security-advisor finding and widen the callable surface.
-- In an emergency, roll back the full authorization hardening package with
-- supabase/rollbacks/20260731144716_authorization_hardening.sql instead.
select '20260731153500 rollback intentionally retains the invoker boundary' as rollback_note;
