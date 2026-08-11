create table if not exists public.knowledge_collection_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  collection_id uuid not null references public.knowledge_collections(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  added_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (collection_id, document_id)
);

create index if not exists knowledge_collection_documents_org_idx
  on public.knowledge_collection_documents (organization_id, created_at desc);

create index if not exists knowledge_collection_documents_collection_idx
  on public.knowledge_collection_documents (collection_id, created_at desc);

create index if not exists knowledge_collection_documents_document_idx
  on public.knowledge_collection_documents (document_id, created_at desc);

alter table public.knowledge_collection_documents enable row level security;

grant select, insert, delete on public.knowledge_collection_documents to authenticated;
grant select, insert, delete on public.knowledge_collection_documents to service_role;

drop policy if exists "Members can read collection documents" on public.knowledge_collection_documents;
drop policy if exists "Managers can add collection documents" on public.knowledge_collection_documents;
drop policy if exists "Managers can remove collection documents" on public.knowledge_collection_documents;

create policy "Members can read collection documents"
  on public.knowledge_collection_documents
  for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "Managers can add collection documents"
  on public.knowledge_collection_documents
  for insert
  to authenticated
  with check (
    public.is_org_manager(organization_id)
    and added_by = (select auth.uid())
    and exists (
      select 1
      from public.knowledge_collections kc
      where kc.id = collection_id
        and kc.organization_id = knowledge_collection_documents.organization_id
    )
    and exists (
      select 1
      from public.documents d
      where d.id = document_id
        and d.organization_id = knowledge_collection_documents.organization_id
    )
  );

create policy "Managers can remove collection documents"
  on public.knowledge_collection_documents
  for delete
  to authenticated
  using (public.is_org_manager(organization_id));
