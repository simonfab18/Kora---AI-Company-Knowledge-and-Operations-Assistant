-- Milestone 9/10 corrective grants for server-side sync, embedding, and chat.
-- Safe to rerun.

grant usage on schema public to service_role;
grant usage on schema extensions to service_role;

grant select on table public.organizations to service_role;
grant select on table public.organization_members to service_role;
grant select, insert, update on table public.documents to service_role;
grant select, insert, update on table public.sync_jobs to service_role;
grant select, insert, update, delete on table public.document_chunks to service_role;
grant select, insert on table public.usage_events to service_role;
grant select, insert, update, delete on table public.conversations to service_role;
grant select, insert, update, delete on table public.messages to service_role;
grant select, insert, update, delete on table public.message_citations to service_role;
grant select, insert on table public.audit_logs to service_role;

grant execute on function public.replace_document_chunks(uuid, uuid, jsonb) to service_role;
grant execute on function public.match_document_chunks(uuid, extensions.vector(1536), text, integer, real) to authenticated, service_role;