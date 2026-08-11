import {
  connectDevelopmentNotionAction,
  disconnectNotionAction,
} from "@/app/app/notion-actions";
import { deleteOrganizationAction, updateAiSettingsAction, updateOrganizationAction } from "@/app/app/organization-actions";
import { AppShell } from "@/components/app-shell";
import { NotionConnectionCard } from "@/components/notion-connection-card";
import { AiSettingsForm, DeleteOrganizationForm, OrganizationProfileForm } from "@/components/organization-forms";
import { normalizeAiSettings } from "@/lib/ai-settings";
import { requireOrganizationManager } from "@/lib/authorization";
import type { Document, KnowledgeGapStatus, NotionConnection, Organization, OrganizationPreference } from "@/lib/database.types";
import { countDocumentStatuses, settingsReadinessItems, settingsReadinessScore } from "@/lib/settings-summary";
import { createAdminClient } from "@/lib/supabase/admin";
import { Bot, CheckCircle2, Database, KeyRound, LockKeyhole, Settings2, ShieldCheck, TriangleAlert, Users } from "lucide-react";
import Link from "next/link";

type SettingsPageProps = {
  searchParams: Promise<{ notion?: string; onboarding?: string }>;
};

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : "Unknown";
}

function scoreTone(score: number) {
  if (score >= 80) return "text-emerald-200";
  if (score >= 60) return "text-blue-200";
  if (score >= 40) return "text-amber-200";
  return "text-rose-200";
}

export default async function Page({ searchParams }: SettingsPageProps) {
  const [{ notion, onboarding }, { membership }] = await Promise.all([searchParams, requireOrganizationManager()]);
  const supabase = createAdminClient();
  const organizationId = membership.organization.id;

  const [{ data: organizationData }, { data: preferencesData }, { data: connection }, { data: documents }, { data: gaps }, { count: activeMembers }, { count: pendingInvitations }] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name, slug, owner_user_id, plan, ai_provider, generation_model, embedding_provider, embedding_model, embedding_dimension, retrieval_threshold, created_at, updated_at")
      .eq("id", organizationId)
      .maybeSingle(),
    supabase
      .from("organization_preferences")
      .select("organization_id, answer_length, answer_tone, default_language")
      .eq("organization_id", organizationId)
      .maybeSingle(),
    supabase
      .from("notion_connections")
      .select(
        "id, organization_id, notion_workspace_id, notion_workspace_name, notion_workspace_icon, bot_id, status, last_synced_at, last_error, connected_by, disconnected_at, created_at, updated_at",
      )
      .eq("organization_id", organizationId)
      .neq("status", "disconnected")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("documents")
      .select("sync_status")
      .eq("organization_id", organizationId)
      .limit(2000),
    supabase
      .from("knowledge_gaps")
      .select("status")
      .eq("organization_id", organizationId)
      .limit(1000),
    supabase
      .from("organization_members")
      .select("user_id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "active"),
    supabase
      .from("organization_invitations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "pending"),
  ]);

  const notionConnection = (connection as NotionConnection | null) ?? null;
  const documentCounts = countDocumentStatuses(((documents ?? []) as Pick<Document, "sync_status">[]).map((document) => document.sync_status));
  const openGaps = ((gaps ?? []) as { status: KnowledgeGapStatus }[]).filter((gap) => gap.status === "open" || gap.status === "reviewing").length;
  const readiness = settingsReadinessItems({
    role: membership.role,
    notionStatus: notionConnection?.status ?? null,
    indexedDocuments: documentCounts.indexed,
    failedDocuments: documentCounts.failed,
    openGaps,
  });
  const readinessScore = settingsReadinessScore(readiness);
  const canUseDevelopmentToken = process.env.APP_ENV !== "production" && Boolean(process.env.NOTION_INTERNAL_INTEGRATION_TOKEN);
  const organization = (organizationData as Organization | null) ?? {
    ...membership.organization,
    owner_user_id: "",
    plan: "portfolio",
    ai_provider: "gemini",
    generation_model: "gemini-flash-latest",
    embedding_provider: "gemini",
    embedding_model: "gemini-embedding-001",
    embedding_dimension: 1536,
    retrieval_threshold: 0.5,
    created_at: "",
    updated_at: "",
  };
  const aiSettings = normalizeAiSettings(organization);
  const preferences = preferencesData as Pick<OrganizationPreference, "answer_length" | "answer_tone" | "default_language"> | null;

  const configCards = [
    {
      label: "Generation model",
      value: aiSettings.generationModel,
      helper: aiSettings.aiProvider,
      icon: Bot,
    },
    {
      label: "Embedding model",
      value: aiSettings.embeddingModel,
      helper: `${aiSettings.embeddingDimension} dimensions`,
      icon: Database,
    },
    {
      label: "Retrieval threshold",
      value: `${Math.round(aiSettings.retrievalThreshold * 100)}%`,
      helper: "Minimum source match",
      icon: Settings2,
    },
    {
      label: "Members",
      value: String(activeMembers ?? 0),
      helper: `${pendingInvitations ?? 0} pending invitation${(pendingInvitations ?? 0) === 1 ? "" : "s"}`,
      icon: Users,
    },
  ];

  return (
    <AppShell title="Settings" description="Manage organization profile, integration readiness, AI configuration, and security boundaries.">
      <div className="space-y-6">
        <section className="glass-strong rounded-lg p-6 md:p-8">
          <div className="grid gap-6 xl:grid-cols-[1fr_320px] xl:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="glass-soft rounded px-2 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">{membership.role}</span>
                <span className={`glass-soft rounded px-2 py-1 text-xs font-semibold capitalize ${notionConnection?.status === "connected" ? "text-emerald-200" : "text-rose-200"}`}>
                  {notionConnection?.status ?? "not connected"}
                </span>
              </div>
              <h2 className="mt-4 font-outfit text-3xl font-semibold md:text-4xl">{organization.name}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                Settings are manager-only and control the workspace profile, Notion authorization, AI model defaults, and retrieval safety configuration.
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.025] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Setup readiness</p>
              <div className="mt-4 flex items-end justify-between gap-4">
                <p className={`font-mono text-5xl font-semibold ${scoreTone(readinessScore)}`}>{readinessScore}%</p>
                <p className="pb-2 text-sm text-slate-500">{readiness.filter((item) => item.ready).length}/{readiness.length} complete</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-400">Last Notion sync: {formatDate(notionConnection?.last_synced_at ?? null)}</p>
            </div>
          </div>
        </section>

        {onboarding === "notion" ? (
          <section className="glass-panel rounded-lg border-blue-300/25 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">Next step</p>
            <h2 className="mt-3 font-outfit text-2xl font-semibold">Connect Notion to start syncing knowledge.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Your workspace is ready. Connect your approved Notion account, then run Sync Activity so Kora can answer from real company documentation.
            </p>
          </section>
        ) : null}

        <NotionConnectionCard
          connection={notionConnection}
          canUseDevelopmentToken={canUseDevelopmentToken}
          disconnectAction={disconnectNotionAction}
          connectDevelopmentAction={connectDevelopmentNotionAction}
          statusMessage={notion}
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {configCards.map((card) => (
            <article key={card.label} className="glass-panel rounded-lg p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{card.label}</p>
                  <p className="mt-4 truncate font-mono text-lg font-semibold text-white">{card.value}</p>
                </div>
                <card.icon className="text-blue-200" size={22} aria-hidden="true" />
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-400">{card.helper}</p>
            </article>
          ))}
        </section>

        <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
          <div className="space-y-6">
            <OrganizationProfileForm name={organization.name} slug={organization.slug} action={updateOrganizationAction} />
            <AiSettingsForm
              aiProvider={aiSettings.aiProvider}
              generationModel={aiSettings.generationModel}
              embeddingProvider={aiSettings.embeddingProvider}
              embeddingModel={aiSettings.embeddingModel}
              embeddingDimension={aiSettings.embeddingDimension}
              retrievalThreshold={aiSettings.retrievalThreshold}
              answerLength={preferences?.answer_length ?? "balanced"}
              answerTone={preferences?.answer_tone ?? "friendly"}
              defaultLanguage={preferences?.default_language ?? "question_language"}
              action={updateAiSettingsAction}
            />
          </div>

          <section className="glass-panel rounded-lg p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Readiness checklist</p>
                <h2 className="mt-3 font-outfit text-2xl font-semibold">Production setup</h2>
              </div>
              <ShieldCheck className="text-blue-200" size={22} aria-hidden="true" />
            </div>
            <div className="mt-5 space-y-3">
              {readiness.map((item) => (
                <div key={item.label} className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
                  <div className="flex items-start gap-3">
                    {item.ready ? <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-200" size={18} aria-hidden="true" /> : <TriangleAlert className="mt-0.5 shrink-0 text-amber-200" size={18} aria-hidden="true" />}
                    <div>
                      <p className="text-sm font-semibold text-white">{item.label}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-400">{item.helper}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>


        <section className="grid gap-6 xl:grid-cols-2">
          <article className="glass-panel rounded-lg p-6">
            <div className="flex items-start gap-3">
              <LockKeyhole className="mt-1 text-blue-200" size={22} aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Security boundaries</p>
                <h2 className="mt-3 font-outfit text-2xl font-semibold">Tenant and token safety</h2>
                <div className="mt-5 grid gap-3 text-sm leading-6 text-slate-300">
                  <div className="glass-soft rounded-lg p-4">Server actions re-check manager membership before applying changes.</div>
                  <div className="glass-soft rounded-lg p-4">Notion tokens are encrypted and are never selected into client-rendered pages.</div>
                  <div className="glass-soft rounded-lg p-4">Organization data is scoped by organization ID before rendering operational dashboards.</div>
                </div>
              </div>
            </div>
          </article>

          <article className="glass-panel rounded-lg p-6">
            <div className="flex items-start gap-3">
              <KeyRound className="mt-1 text-blue-200" size={22} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Quick links</p>
                <h2 className="mt-3 font-outfit text-2xl font-semibold">Operational controls</h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Link href="/app/sync" className="glass-soft rounded-lg p-4 text-sm font-semibold text-slate-200 hover:text-white">Sync Activity</Link>
                  <Link href="/app/knowledge" className="glass-soft rounded-lg p-4 text-sm font-semibold text-slate-200 hover:text-white">Knowledge</Link>
                  <Link href="/app/insights" className="glass-soft rounded-lg p-4 text-sm font-semibold text-slate-200 hover:text-white">Insights</Link>
                  <Link href="/app/members" className="glass-soft rounded-lg p-4 text-sm font-semibold text-slate-200 hover:text-white">Members</Link>
                  {membership.role === "owner" ? <Link href="/setup/organization" className="glass-soft rounded-lg p-4 text-sm font-semibold text-slate-200 hover:text-white">New organization</Link> : null}
                </div>
              </div>
            </div>
          </article>
        </section>

        {membership.role === "owner" ? (
          <DeleteOrganizationForm organizationName={organization.name} action={deleteOrganizationAction} />
        ) : null}
      </div>
    </AppShell>
  );
}