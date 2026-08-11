-- Phase 6: query and cache optimization.
-- Aggregate dashboard/insight data in Postgres so the app stops downloading large row sets.

create index if not exists messages_org_role_created_idx
  on public.messages (organization_id, role, created_at desc);

create index if not exists messages_org_confidence_created_idx
  on public.messages (organization_id, confidence, created_at desc)
  where role = 'assistant';

create index if not exists message_citations_document_created_idx
  on public.message_citations (document_id, created_at desc);

create index if not exists audit_logs_org_created_idx
  on public.audit_logs (organization_id, created_at desc);

create index if not exists organization_members_org_created_idx
  on public.organization_members (organization_id, created_at desc);

create index if not exists organization_members_org_status_role_idx
  on public.organization_members (organization_id, status, role);

create index if not exists answer_traces_org_created_cover_idx
  on public.answer_traces (organization_id, created_at desc);

create or replace function public.get_organization_overview_summary(p_organization_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with connection as (
    select jsonb_build_object(
      'id', nc.id,
      'organization_id', nc.organization_id,
      'notion_workspace_name', nc.notion_workspace_name,
      'status', nc.status,
      'last_synced_at', nc.last_synced_at,
      'last_error', nc.last_error,
      'updated_at', nc.updated_at
    ) as value
    from public.notion_connections nc
    where nc.organization_id = p_organization_id
      and nc.status <> 'disconnected'
    order by nc.updated_at desc
    limit 1
  ), document_counts as (
    select
      count(*) filter (where d.sync_status = 'pending')::integer as pending,
      count(*) filter (where d.sync_status = 'syncing')::integer as syncing,
      count(*) filter (where d.sync_status = 'indexed')::integer as indexed,
      count(*) filter (where d.sync_status = 'failed')::integer as failed,
      count(*) filter (where d.sync_status = 'archived')::integer as archived,
      count(*)::integer as total
    from public.documents d
    where d.organization_id = p_organization_id
  ), answer_counts as (
    select
      count(*) filter (where m.confidence = 'high')::integer as high,
      count(*) filter (where m.confidence = 'medium')::integer as medium,
      count(*) filter (where m.confidence = 'low')::integer as low,
      count(*) filter (where m.confidence = 'insufficient')::integer as insufficient,
      count(*)::integer as total
    from public.messages m
    where m.organization_id = p_organization_id
      and m.role = 'assistant'
  ), gap_counts as (
    select
      count(*) filter (where kg.status = 'open')::integer as open,
      count(*) filter (where kg.status = 'reviewing')::integer as reviewing,
      count(*) filter (where kg.status = 'resolved')::integer as resolved,
      count(*) filter (where kg.status = 'dismissed')::integer as dismissed,
      count(*)::integer as total
    from public.knowledge_gaps kg
    where kg.organization_id = p_organization_id
  ), feedback_counts as (
    select
      count(*) filter (where mf.rating = 'helpful')::integer as helpful,
      count(*) filter (where mf.rating = 'not_helpful')::integer as not_helpful,
      count(*)::integer as total
    from public.message_feedback mf
    where mf.organization_id = p_organization_id
  ), citation_counts as (
    select count(mc.id)::integer as total
    from public.message_citations mc
    join public.documents d on d.id = mc.document_id
    where d.organization_id = p_organization_id
  ), member_counts as (
    select count(*) filter (where om.status = 'active')::integer as active
    from public.organization_members om
    where om.organization_id = p_organization_id
  ), latest_sync as (
    select to_jsonb(sj.*) as value
    from public.sync_jobs sj
    where sj.organization_id = p_organization_id
    order by sj.created_at desc
    limit 1
  ), recent_sync_jobs as (
    select coalesce(jsonb_agg(to_jsonb(row_data) order by row_data.created_at desc), '[]'::jsonb) as value
    from (
      select sj.*
      from public.sync_jobs sj
      where sj.organization_id = p_organization_id
      order by sj.created_at desc
      limit 5
    ) row_data
  ), recent_failed_documents as (
    select coalesce(jsonb_agg(to_jsonb(row_data) order by row_data.updated_at desc), '[]'::jsonb) as value
    from (
      select d.id, d.title, d.sync_status, d.last_error, d.last_indexed_at, d.updated_at
      from public.documents d
      where d.organization_id = p_organization_id
        and d.sync_status = 'failed'
      order by d.updated_at desc
      limit 3
    ) row_data
  )
  select jsonb_build_object(
    'connection', (select value from connection),
    'document_counts', jsonb_build_object(
      'pending', dc.pending,
      'syncing', dc.syncing,
      'indexed', dc.indexed,
      'failed', dc.failed,
      'archived', dc.archived,
      'total', dc.total
    ),
    'answer_counts', jsonb_build_object(
      'high', ac.high,
      'medium', ac.medium,
      'low', ac.low,
      'insufficient', ac.insufficient,
      'total', ac.total
    ),
    'gap_counts', jsonb_build_object(
      'open', gc.open,
      'reviewing', gc.reviewing,
      'resolved', gc.resolved,
      'dismissed', gc.dismissed,
      'total', gc.total
    ),
    'feedback_counts', jsonb_build_object(
      'helpful', fc.helpful,
      'not_helpful', fc.not_helpful,
      'total', fc.total
    ),
    'citation_count', cc.total,
    'active_member_count', mc.active,
    'latest_sync', (select value from latest_sync),
    'recent_sync_jobs', (select value from recent_sync_jobs),
    'recent_failed_documents', (select value from recent_failed_documents)
  )
  from document_counts dc
  cross join answer_counts ac
  cross join gap_counts gc
  cross join feedback_counts fc
  cross join citation_counts cc
  cross join member_counts mc;
$$;

create or replace function public.get_organization_insights_summary(
  p_organization_id uuid,
  p_since timestamptz default null,
  p_gap_status text default 'all',
  p_limit integer default 20
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with bounds as (
    select greatest(1, least(coalesce(p_limit, 20), 100)) as item_limit
  ), question_messages as (
    select m.content, m.created_at
    from public.messages m
    where m.organization_id = p_organization_id
      and m.role = 'user'
      and (p_since is null or m.created_at >= p_since)
  ), assistant_messages as (
    select m.confidence, m.latency_ms, m.created_at
    from public.messages m
    where m.organization_id = p_organization_id
      and m.role = 'assistant'
      and (p_since is null or m.created_at >= p_since)
  ), top_questions as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'question', question,
      'count', count,
      'lastAskedAt', last_asked_at
    ) order by count desc, last_asked_at desc), '[]'::jsonb) as value
    from (
      select
        (array_agg(trim(qm.content) order by qm.created_at desc))[1] as question,
        count(*)::integer as count,
        max(qm.created_at) as last_asked_at
      from question_messages qm
      cross join bounds
      where trim(qm.content) <> ''
      group by left(regexp_replace(lower(trim(qm.content)), '[^[:alnum:][:space:]]', '', 'g'), 220)
      order by count(*) desc, max(qm.created_at) desc
      limit (select item_limit from bounds)
    ) row_data
  ), answer_quality as (
    select jsonb_build_object(
      'counts', jsonb_build_object(
        'high', count(*) filter (where am.confidence = 'high'),
        'medium', count(*) filter (where am.confidence = 'medium'),
        'low', count(*) filter (where am.confidence = 'low'),
        'insufficient', count(*) filter (where am.confidence = 'insufficient')
      ),
      'total', count(*),
      'weakCount', count(*) filter (where am.confidence in ('low', 'insufficient')),
      'averageLatencyMs', round(avg(am.latency_ms))
    ) as value
    from assistant_messages am
  ), document_counts as (
    select jsonb_build_object(
      'pending', count(*) filter (where d.sync_status = 'pending'),
      'syncing', count(*) filter (where d.sync_status = 'syncing'),
      'indexed', count(*) filter (where d.sync_status = 'indexed'),
      'failed', count(*) filter (where d.sync_status = 'failed'),
      'archived', count(*) filter (where d.sync_status = 'archived')
    ) as value
    from public.documents d
    where d.organization_id = p_organization_id
  ), top_sources as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'documentId', document_id,
      'title', title,
      'sourceUrl', source_url,
      'citationCount', citation_count,
      'averageSimilarity', average_similarity
    ) order by citation_count desc, average_similarity desc nulls last), '[]'::jsonb) as value
    from (
      select
        d.id as document_id,
        d.title,
        d.source_url,
        count(mc.id)::integer as citation_count,
        avg(mc.similarity_score)::real as average_similarity
      from public.message_citations mc
      join public.documents d on d.id = mc.document_id
      cross join bounds
      where d.organization_id = p_organization_id
        and (p_since is null or mc.created_at >= p_since)
      group by d.id, d.title, d.source_url
      order by count(mc.id) desc, avg(mc.similarity_score) desc nulls last
      limit (select item_limit from bounds)
    ) row_data
  ), feedback_counts as (
    select jsonb_build_object(
      'helpful', count(*) filter (where mf.rating = 'helpful'),
      'not_helpful', count(*) filter (where mf.rating = 'not_helpful'),
      'total', count(*)
    ) as value
    from public.message_feedback mf
    where mf.organization_id = p_organization_id
      and (p_since is null or mf.created_at >= p_since)
  ), gap_counts as (
    select jsonb_build_object(
      'open', count(*) filter (where kg.status = 'open'),
      'reviewing', count(*) filter (where kg.status = 'reviewing'),
      'resolved', count(*) filter (where kg.status = 'resolved'),
      'dismissed', count(*) filter (where kg.status = 'dismissed'),
      'occurrences', coalesce(sum(kg.occurrence_count), 0)
    ) as value
    from public.knowledge_gaps kg
    where kg.organization_id = p_organization_id
      and (p_since is null or kg.last_seen_at >= p_since)
      and (p_gap_status = 'all' or kg.status = p_gap_status)
  ), recent_gaps as (
    select coalesce(jsonb_agg(to_jsonb(row_data) order by row_data.last_seen_at desc), '[]'::jsonb) as value
    from (
      select kg.*
      from public.knowledge_gaps kg
      cross join bounds
      where kg.organization_id = p_organization_id
        and (p_since is null or kg.last_seen_at >= p_since)
        and (p_gap_status = 'all' or kg.status = p_gap_status)
      order by kg.last_seen_at desc
      limit (select item_limit from bounds)
    ) row_data
  ), recent_sync_jobs as (
    select coalesce(jsonb_agg(to_jsonb(row_data) order by row_data.created_at desc), '[]'::jsonb) as value
    from (
      select sj.id, sj.job_type, sj.status, sj.total_items, sj.processed_items, sj.failed_items,
        sj.skipped_items, sj.error_message, sj.created_at, sj.started_at, sj.completed_at
      from public.sync_jobs sj
      where sj.organization_id = p_organization_id
      order by sj.created_at desc
      limit 6
    ) row_data
  ), recent_traces as (
    select coalesce(jsonb_agg(to_jsonb(row_data) order by row_data.created_at desc), '[]'::jsonb) as value
    from (
      select at.id, at.question, at.answer_mode, at.retrieval_confidence, at.model,
        at.prompt_version, at.latency_ms, at.validation_status, at.created_at
      from public.answer_traces at
      cross join bounds
      where at.organization_id = p_organization_id
      order by at.created_at desc
      limit (select item_limit from bounds)
    ) row_data
  ), related_documents as (
    select coalesce(jsonb_object_agg(d.id, jsonb_build_object(
      'id', d.id,
      'title', d.title,
      'source_url', d.source_url,
      'sync_status', d.sync_status
    )), '{}'::jsonb) as value
    from public.documents d
    where d.organization_id = p_organization_id
      and exists (
        select 1
        from public.knowledge_gaps kg
        where kg.organization_id = p_organization_id
          and kg.related_document_id = d.id
      )
  ), trend_days as (
    select day::date as day
    from generate_series((current_date - interval '6 days')::date, current_date, interval '1 day') as day
  ), question_trend_rows as (
    select
      td.day,
      count(qm.created_at)::integer as total
    from trend_days td
    left join public.messages qm on qm.organization_id = p_organization_id
      and qm.role = 'user'
      and qm.created_at >= td.day
      and qm.created_at < td.day + interval '1 day'
    group by td.day
  ), question_trend as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'label', to_char(qtr.day, 'Mon DD'),
      'shortLabel', to_char(qtr.day, 'DD'),
      'total', qtr.total,
      'weak', 0,
      'succeeded', 0
    ) order by qtr.day), '[]'::jsonb) as value
    from question_trend_rows qtr
  ), weak_answer_trend_rows as (
    select
      td.day,
      count(am.created_at)::integer as total,
      count(am.created_at) filter (where am.confidence in ('low', 'insufficient'))::integer as weak
    from trend_days td
    left join public.messages am on am.organization_id = p_organization_id
      and am.role = 'assistant'
      and am.created_at >= td.day
      and am.created_at < td.day + interval '1 day'
    group by td.day
  ), weak_answer_trend as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'label', to_char(watr.day, 'Mon DD'),
      'shortLabel', to_char(watr.day, 'DD'),
      'total', watr.total,
      'weak', watr.weak,
      'succeeded', 0
    ) order by watr.day), '[]'::jsonb) as value
    from weak_answer_trend_rows watr
  ), sync_trend_rows as (
    select
      td.day,
      count(sj.created_at)::integer as total,
      count(sj.created_at) filter (where sj.status = 'succeeded')::integer as succeeded
    from trend_days td
    left join public.sync_jobs sj on sj.organization_id = p_organization_id
      and sj.created_at >= td.day
      and sj.created_at < td.day + interval '1 day'
    group by td.day
  ), sync_trend as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'label', to_char(str.day, 'Mon DD'),
      'shortLabel', to_char(str.day, 'DD'),
      'total', str.total,
      'weak', 0,
      'succeeded', str.succeeded
    ) order by str.day), '[]'::jsonb) as value
    from sync_trend_rows str
  ), feedback_trend_rows as (
    select
      td.day,
      count(mf.created_at)::integer as total,
      count(mf.created_at) filter (where mf.rating = 'not_helpful')::integer as weak
    from trend_days td
    left join public.message_feedback mf on mf.organization_id = p_organization_id
      and mf.created_at >= td.day
      and mf.created_at < td.day + interval '1 day'
    group by td.day
  ), feedback_trend as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'label', to_char(ftr.day, 'Mon DD'),
      'shortLabel', to_char(ftr.day, 'DD'),
      'total', ftr.total,
      'weak', ftr.weak,
      'succeeded', 0
    ) order by ftr.day), '[]'::jsonb) as value
    from feedback_trend_rows ftr
  )
  select jsonb_build_object(
    'top_questions', (select value from top_questions),
    'answer_quality', (select value from answer_quality),
    'document_counts', (select value from document_counts),
    'top_sources', (select value from top_sources),
    'feedback_counts', (select value from feedback_counts),
    'gap_counts', (select value from gap_counts),
    'recent_gaps', (select value from recent_gaps),
    'recent_sync_jobs', (select value from recent_sync_jobs),
    'recent_traces', (select value from recent_traces),
    'related_documents', (select value from related_documents),
    'trends', jsonb_build_object(
      'questions', (select value from question_trend),
      'weak_answers', (select value from weak_answer_trend),
      'sync_wins', (select value from sync_trend),
      'not_helpful', (select value from feedback_trend)
    )
  );
$$;

create or replace function public.list_managed_workspace_members(
  p_manager_user_id uuid,
  p_limit integer default 10,
  p_offset integer default 0,
  p_search text default ''
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with managed_orgs as (
    select om.organization_id, o.name
    from public.organization_members om
    join public.organizations o on o.id = om.organization_id
    where om.user_id = p_manager_user_id
      and om.status = 'active'
      and om.role in ('owner', 'admin')
  ), peer_memberships as (
    select om.organization_id, mo.name as organization_name, om.user_id, om.role, om.status,
      om.joined_at, om.created_at
    from public.organization_members om
    join managed_orgs mo on mo.organization_id = om.organization_id
    where om.user_id <> p_manager_user_id
  ), people as (
    select
      pm.user_id,
      max(coalesce(pm.joined_at, pm.created_at)) as recent_activity_at,
      jsonb_agg(jsonb_build_object(
        'id', pm.organization_id,
        'name', pm.organization_name,
        'role', pm.role,
        'status', pm.status,
        'joinedAt', pm.joined_at
      ) order by coalesce(pm.joined_at, pm.created_at) desc) as memberships
    from peer_memberships pm
    join public.profiles p on p.id = pm.user_id
    where coalesce(p_search, '') = ''
      or p.full_name ilike '%' || p_search || '%'
      or p.display_name ilike '%' || p_search || '%'
      or p.job_title ilike '%' || p_search || '%'
      or p.department ilike '%' || p_search || '%'
    group by pm.user_id
  ), counted as (
    select count(*)::integer as total from people
  ), page_rows as (
    select jsonb_build_object(
      'userId', people.user_id,
      'email', null,
      'fullName', p.full_name,
      'displayName', p.display_name,
      'jobTitle', p.job_title,
      'department', p.department,
      'mainResponsibility', p.main_responsibility,
      'preferredLanguage', p.preferred_language,
      'recentActivityAt', people.recent_activity_at,
      'memberships', people.memberships
    ) as value
    from people
    join public.profiles p on p.id = people.user_id
    order by people.recent_activity_at desc
    limit greatest(1, least(coalesce(p_limit, 10), 50))
    offset greatest(coalesce(p_offset, 0), 0)
  )
  select jsonb_build_object(
    'total', (select total from counted),
    'people', coalesce((select jsonb_agg(value) from page_rows), '[]'::jsonb)
  );
$$;

grant execute on function public.get_organization_overview_summary(uuid) to authenticated, service_role;
grant execute on function public.get_organization_insights_summary(uuid, timestamptz, text, integer) to authenticated, service_role;
grant execute on function public.list_managed_workspace_members(uuid, integer, integer, text) to authenticated, service_role;