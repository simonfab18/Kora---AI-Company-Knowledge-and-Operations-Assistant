-- Rollback for Phase 6 query and cache optimization.
-- Removes only database functions and indexes introduced by 20260802071849.

drop function if exists public.get_organization_overview_summary(uuid);
drop function if exists public.get_organization_insights_summary(uuid, timestamptz, text, integer);
drop function if exists public.list_managed_workspace_members(uuid, integer, integer, text);

drop index if exists public.messages_org_role_created_idx;
drop index if exists public.messages_org_confidence_created_idx;
drop index if exists public.message_citations_document_created_idx;
drop index if exists public.audit_logs_org_created_idx;
drop index if exists public.organization_members_org_created_idx;
drop index if exists public.organization_members_org_status_role_idx;
drop index if exists public.answer_traces_org_created_cover_idx;