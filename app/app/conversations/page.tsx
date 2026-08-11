import { archiveConversationAction, deleteConversationAction, renameConversationAction, restoreConversationAction, togglePinnedConversationAction } from "@/app/app/ask/actions";
import { AppShell } from "@/components/app-shell";
import { ConversationActionsMenu } from "@/components/chat-controls";
import { DashboardEmptyState } from "@/components/dashboard-states";
import { requireActiveOrganization } from "@/lib/authorization";
import { excerptText, summarizeConversations } from "@/lib/conversation-summary";
import type { Conversation, Message, MessageFeedbackRating } from "@/lib/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import { Archive, Bot, CheckCircle2, MessageSquare, Pin, Plus, Search, ThumbsDown, ThumbsUp } from "lucide-react";
import Link from "next/link";

const PAGE_SIZE = 30;
const viewOptions = ["active", "archived", "all"] as const;
type ConversationView = (typeof viewOptions)[number];

type ConversationsPageProps = {
  searchParams: Promise<{ q?: string; view?: string }>;
};

type CitationMessageRow = { message_id: string };
type FeedbackRow = { message_id: string; rating: MessageFeedbackRating };

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function parseView(value: string | undefined): ConversationView {
  return viewOptions.includes(value as ConversationView) ? (value as ConversationView) : "active";
}

function confidenceTone(confidence: string | null) {
  if (confidence === "high") return "text-emerald-200";
  if (confidence === "medium") return "text-blue-200";
  if (confidence === "low") return "text-amber-200";
  if (confidence === "insufficient") return "text-rose-200";
  return "text-slate-400";
}

async function loadConversations(organizationId: string, userId: string, query: string, view: ConversationView) {
  const supabase = createAdminClient();
  let request = supabase
    .from("conversations")
    .select("id, organization_id, user_id, title, created_at, updated_at, archived_at, pinned_at")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (view === "active") {
    request = request.is("archived_at", null);
  }

  if (view === "archived") {
    request = request.not("archived_at", "is", null);
  }

  if (query) {
    request = request.ilike("title", `%${query}%`);
  }

  const { data } = await request;
  return (data ?? []) as Conversation[];
}

async function loadConversationSummaries(conversationIds: string[], organizationId: string) {
  if (conversationIds.length === 0) {
    return summarizeConversations({ messages: [], citationMessageIds: [], feedback: [] });
  }

  const supabase = createAdminClient();
  const { data: messages } = await supabase
    .from("messages")
    .select("id, conversation_id, organization_id, role, content, status, confidence, model_provider, model_name, prompt_tokens, completion_tokens, latency_ms, error_code, created_at")
    .eq("organization_id", organizationId)
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: true });

  const messageRows = (messages ?? []) as Message[];
  const messageIds = messageRows.map((message) => message.id);

  if (messageIds.length === 0) {
    return summarizeConversations({ messages: [], citationMessageIds: [], feedback: [] });
  }

  const [{ data: citations }, { data: feedback }] = await Promise.all([
    supabase.from("message_citations").select("message_id").in("message_id", messageIds),
    supabase.from("message_feedback").select("message_id, rating").eq("organization_id", organizationId).in("message_id", messageIds),
  ]);

  return summarizeConversations({
    messages: messageRows,
    citationMessageIds: ((citations ?? []) as CitationMessageRow[]).map((citation) => citation.message_id),
    feedback: (feedback ?? []) as FeedbackRow[],
  });
}

export default async function Page({ searchParams }: ConversationsPageProps) {
  const [{ user, membership }, params] = await Promise.all([requireActiveOrganization(), searchParams]);
  const query = (params.q ?? "").trim();
  const view = parseView(params.view);
  const conversations = await loadConversations(membership.organization.id, user.id, query, view);
  const summaries = await loadConversationSummaries(
    conversations.map((conversation) => conversation.id),
    membership.organization.id,
  );

  const totalMessages = Array.from(summaries.values()).reduce((sum, summary) => sum + summary.messageCount, 0);
  const weakAnswers = Array.from(summaries.values()).reduce((sum, summary) => sum + summary.weakAnswerCount, 0);
  const citationCount = Array.from(summaries.values()).reduce((sum, summary) => sum + summary.citationCount, 0);

  const metrics = [
    { label: "Threads", value: String(conversations.length), helper: `${view} conversations`, icon: MessageSquare },
    { label: "Messages", value: String(totalMessages), helper: "Across visible threads", icon: Bot },
    { label: "Citations", value: String(citationCount), helper: "Saved source references", icon: CheckCircle2 },
    { label: "Weak answers", value: String(weakAnswers), helper: "Low or insufficient confidence", icon: ThumbsDown },
  ];

  return (
    <AppShell title="Conversations" description="Review saved Ask AI threads, answer quality, citations, and feedback.">
      <div className="space-y-6">
        <section className="glass-panel rounded-lg p-6">
          <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
            <form className="grid gap-3 md:grid-cols-[1fr_180px_auto] md:items-end">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Search title</span>
                <span className="glass-soft flex h-11 items-center gap-2 rounded-lg px-3 text-sm text-slate-400">
                  <Search size={16} aria-hidden="true" />
                  <input name="q" defaultValue={query} placeholder="Find a conversation" className="w-full bg-transparent text-white outline-none placeholder:text-slate-600" />
                </span>
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">View</span>
                <select name="view" defaultValue={view} className="glass-soft h-11 w-full rounded-lg px-3 text-sm text-white outline-none">
                  {viewOptions.map((option) => (
                    <option key={option} value={option} className="bg-[#111] capitalize">
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" className="h-11 rounded-lg bg-white px-4 text-sm font-semibold text-ink transition hover:bg-slate-200">
                Apply filters
              </button>
            </form>
            <Link href="/app/ask" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-ink transition hover:bg-slate-200">
              <Plus size={15} aria-hidden="true" /> New conversation
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <article key={metric.label} className="glass-panel rounded-lg p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{metric.label}</p>
                  <p className="mt-4 font-mono text-3xl font-semibold text-white">{metric.value}</p>
                </div>
                <metric.icon className="text-blue-200" size={22} aria-hidden="true" />
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-400">{metric.helper}</p>
            </article>
          ))}
        </section>

        {conversations.length === 0 ? (
          <DashboardEmptyState
            title="No conversations found"
            description="Ask Kora a grounded question or adjust your conversation filters."
            action={<Link href="/app/ask" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-ink">Ask AI</Link>}
          />
        ) : (
          <section className="grid gap-4">
            {conversations.map((conversation, index) => {
              const summary = summaries.get(conversation.id) ?? null;
              return (
                <article key={conversation.id} className="glass-panel rounded-lg p-5">
                  <div className="grid gap-5 xl:grid-cols-[1fr_340px] xl:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm text-blue-300">{String(index + 1).padStart(2, "0")}</span>
                        <MessageSquare size={16} className="text-blue-300" aria-hidden="true" />
                        <Link href={`/app/ask?conversationId=${conversation.id}`} className="line-clamp-1 font-outfit text-xl font-semibold text-white hover:text-blue-200">
                          {conversation.title}
                        </Link>
                        {conversation.pinned_at ? <span className="inline-flex items-center gap-1 rounded bg-blue-400/15 px-2 py-1 text-xs text-blue-100"><Pin size={12} aria-hidden="true" /> Pinned</span> : null}
                        {conversation.archived_at ? <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-2 py-1 text-xs text-amber-200"><Archive size={12} aria-hidden="true" /> Archived</span> : null}
                        {summary?.lastConfidence ? <span className={`glass-soft rounded px-2 py-1 text-xs capitalize ${confidenceTone(summary.lastConfidence)}`}>{summary.lastConfidence}</span> : null}
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        {summary?.messageCount ?? 0} messages / {summary?.citationCount ?? 0} citations / Updated {formatDate(conversation.updated_at)}
                      </p>
                      <div className="mt-4 grid gap-3 lg:grid-cols-2">
                        <div className="rounded-lg border border-white/10 bg-white/[0.025] p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">Last question</p>
                          <p className="mt-2 text-sm leading-6 text-slate-300">{excerptText(summary?.lastQuestion ?? null) ?? "No question saved yet."}</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/[0.025] p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">Last answer</p>
                          <p className="mt-2 text-sm leading-6 text-slate-300">{excerptText(summary?.lastAnswer ?? null) ?? "No answer saved yet."}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
                        <span className="rounded bg-white/5 px-2 py-1">{summary?.assistantCount ?? 0} Kora answers</span>
                        <span className="rounded bg-white/5 px-2 py-1">{summary?.weakAnswerCount ?? 0} weak answers</span>
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-400/10 px-2 py-1 text-emerald-100"><ThumbsUp size={12} aria-hidden="true" /> {summary?.helpfulCount ?? 0}</span>
                        <span className="inline-flex items-center gap-1 rounded bg-amber-400/10 px-2 py-1 text-amber-100"><ThumbsDown size={12} aria-hidden="true" /> {summary?.notHelpfulCount ?? 0}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 xl:justify-end">
                      <Link href={`/app/ask?conversationId=${conversation.id}`} className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-white text-sm font-semibold text-ink transition hover:bg-slate-200">
                        Open thread
                      </Link>
                      <ConversationActionsMenu
                        conversationId={conversation.id}
                        title={conversation.title}
                        pinned={Boolean(conversation.pinned_at)}
                        archived={Boolean(conversation.archived_at)}
                        renameAction={renameConversationAction}
                        togglePinnedAction={togglePinnedConversationAction}
                        archiveAction={archiveConversationAction}
                        restoreAction={restoreConversationAction}
                        deleteAction={deleteConversationAction}
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </AppShell>
  );
}