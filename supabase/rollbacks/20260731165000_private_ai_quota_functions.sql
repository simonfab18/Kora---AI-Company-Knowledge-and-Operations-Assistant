-- Rollback keeps the private function boundary in place because moving these functions
-- back into public would reintroduce a wider SECURITY DEFINER surface.
-- To remove the entire quota feature, run supabase/rollbacks/20260731162000_atomic_ai_quotas.sql.
select '20260731165000 rollback intentionally retains private quota function boundary' as rollback_note;
