-- Repair stale document status left by embedding failures before the lifecycle fix.
update public.documents as document
set sync_status = 'failed',
    last_error = coalesce(document.last_error, 'Document embedding did not complete.'),
    updated_at = now()
where document.sync_status = 'indexed'
  and not exists (
    select 1
    from public.document_chunks as chunk
    where chunk.organization_id = document.organization_id
      and chunk.document_id = document.id
  );