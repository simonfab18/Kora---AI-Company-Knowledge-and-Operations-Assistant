grant usage on schema public to service_role;

grant select (
  id,
  organization_id,
  notion_workspace_id,
  notion_workspace_name,
  notion_workspace_icon,
  bot_id,
  access_token_ciphertext,
  refresh_token_ciphertext,
  token_expires_at,
  status,
  last_synced_at,
  last_error,
  connected_by,
  disconnected_at,
  created_at,
  updated_at
) on public.notion_connections to service_role;

grant update (
  last_synced_at,
  last_error,
  status,
  updated_at
) on public.notion_connections to service_role;

grant select, insert, update on public.sync_jobs to service_role;
grant select, insert, update on public.documents to service_role;
grant select, insert on public.audit_logs to service_role;