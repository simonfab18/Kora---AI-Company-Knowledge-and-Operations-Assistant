import { archiveConversationAction, askQuestionAction, deleteConversationAction, renameConversationAction, restoreConversationAction, submitMessageFeedbackAction, togglePinnedConversationAction } from "@/app/app/ask/actions";
import { loadDailyAiUsage } from "@/lib/ai-usage";
import { AppShell } from "@/components/app-shell";
import { AnswerContent } from "@/components/answer-content";
import { MessageCopyButton } from "@/components/message-copy-button";
import { AskComposer, ConversationActionsMenu } from "@/components/chat-controls";
import { MessageFeedbackControls } from "@/components/message-feedback-controls";
import { requireActiveOrganization } from "@/lib/authorization";
import type { Conversation, Message, MessageCitation, MessageFeedbackRating } from "@/lib/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import { answerModeLabel } from "@/lib/rag-quality";
import { Bot, ChevronDown, ExternalLink, FileText, MessageSquare, User } from "lucide-react";
import Link from "next/link";

type AskPageProps = {
  searchParams: Promise<{ conversationId?: string; q?: string }>;
};

type CitationWithDocument = MessageCitation & {
  documents?: { title?: string | null; source_url?: string | null } | Array<{ title?: string | null; source_url?: string | null }> | null;
};

type FeedbackRow = {
  message_id: string;
  rating: MessageFeedbackRating;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function documentForCitation(citation: CitationWithDocument) {
  return Array.isArray(citation.documents) ? citation.documents[0] : citation.documents;
}

function withPinnedFallback(rows: unknown[] | null) {
  return (rows ?? []).map((row) => ({ ...(row as Conversation), pinned_at: (row as Partial<Conversation>).pinned_at ?? null })) as Conversation[];
}

function isMissingPinnedColumn(error: { message?: string; details?: string; hint?: string } | null) {
  const text = `${error?.message ?? ""} ${error?.details ?? ""} ${error?.hint ?? ""}`.toLowerCase();
  return text.includes("pinned_at");
}

async function loadConversations(organizationId: string, userId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("conversations")
    .select("id, organization_id, user_id, title, created_at, updated_at, archived_at, pinned_at")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .is("archived_at", null)
    .order("pinned_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false })
    .limit(30);

  if (isMissingPinnedColumn(error)) {
    const { data: fallbackData } = await supabase
      .from("conversations")
      .select("id, organization_id, user_id, title, created_at, updated_at, archived_at")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .is("archived_at", null)
      .order("updated_at", { ascending: false })
      .limit(30);

    return withPinnedFallback(fallbackData);
  }

  return withPinnedFallback(data);
}
async function loadConversationThread(organizationId: string, userId: string, conversationId: string | undefined) {
  if (!conversationId) {
    return {
      conversation: null,
      messages: [] as Message[],
      citations: new Map<string, CitationWithDocument[]>(),
      feedback: new Map<string, MessageFeedbackRating>(),
    };
  }

  const supabase = createAdminClient();
  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id, organization_id, user_id, title, created_at, updated_at, archived_at, pinned_at")
    .eq("id", conversationId)
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .is("archived_at", null)
    .maybeSingle();

  const conversationRow = isMissingPinnedColumn(conversationError)
    ? (
        await supabase
          .from("conversations")
          .select("id, organization_id, user_id, title, created_at, updated_at, archived_at")
          .eq("id", conversationId)
          .eq("organization_id", organizationId)
          .eq("user_id", userId)
          .is("archived_at", null)
          .maybeSingle()
      ).data
    : conversation;

  if (!conversationRow) {
    return {
      conversation: null,
      messages: [] as Message[],
      citations: new Map<string, CitationWithDocument[]>(),
      feedback: new Map<string, MessageFeedbackRating>(),
    };
  }

  const { data: messages } = await supabase
    .from("messages")
    .select("id, conversation_id, organization_id, role, content, status, confidence, model_provider, model_name, prompt_tokens, completion_tokens, latency_ms, error_code, answer_mode, follow_up_question, suggested_follow_ups, created_at")
    .eq("conversation_id", conversationRow.id)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  const messageRows = (messages ?? []) as Message[];
  const assistantMessageIds = messageRows.filter((message) => message.role === "assistant").map((message) => message.id);
  const citations = new Map<string, CitationWithDocument[]>();
  const feedback = new Map<string, MessageFeedbackRating>();

  if (assistantMessageIds.length > 0) {
    const [{ data: citationRows }, { data: feedbackRows }] = await Promise.all([
      supabase
        .from("message_citations")
        .select("id, message_id, document_id, chunk_id, citation_order, quote_excerpt, similarity_score, section_title, created_at, documents(title, source_url)")
        .in("message_id", assistantMessageIds)
        .order("citation_order", { ascending: true }),
      supabase
        .from("message_feedback")
        .select("message_id, rating")
        .eq("organization_id", organizationId)
        .eq("user_id", userId)
        .in("message_id", assistantMessageIds),
    ]);

    for (const citation of (citationRows ?? []) as CitationWithDocument[]) {
      const existing = citations.get(citation.message_id) ?? [];
      existing.push(citation);
      citations.set(citation.message_id, existing);
    }

    for (const row of (feedbackRows ?? []) as FeedbackRow[]) {
      feedback.set(row.message_id, row.rating);
    }
  }

  return { conversation: withPinnedFallback([conversationRow])[0], messages: messageRows, citations, feedback };
}

export default async function Page({ searchParams }: AskPageProps) {
  const [{ user, membership }, params] = await Promise.all([requireActiveOrganization(), searchParams]);
  const conversationId = params.conversationId;
  const defaultQuestion = params.q?.slice(0, 4000) ?? "";
  const [conversations, thread, dailyUsage] = await Promise.all([
    loadConversations(membership.organization.id, user.id),
    loadConversationThread(membership.organization.id, user.id, conversationId),
    loadDailyAiUsage(membership.organization.id, user.id),
  ]);

  return (
    <AppShell title="Ask AI" description="Ask grounded questions against synchronized Notion knowledge with citations on every supported answer.">
      <div className="ask-ai-surface grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <Link href="/app/ask" className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-white text-sm font-semibold text-ink transition hover:bg-slate-200">
            New conversation
          </Link>
          <section className="glass-panel rounded-lg p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Recent</p>
            <div className="kora-scroll-panel mt-4 max-h-[520px] space-y-2 overflow-y-auto pr-1">
              {conversations.length === 0 ? (
                <p className="text-sm leading-6 text-slate-500">Your conversations will appear here after the first question.</p>
              ) : (
                conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 rounded-lg border p-2 transition ${conversation.id === conversationId ? "border-blue-300/40 bg-blue-400/10" : "border-white/10 bg-white/[0.025] hover:border-white/20"}`}
                  >
                    <Link href={`/app/ask?conversationId=${conversation.id}`} className="min-w-0 rounded-md p-1">
                      <span className="line-clamp-2 text-sm font-semibold text-white">{conversation.title}</span>
                      <span className="mt-1 flex items-center gap-2 text-xs text-slate-500">{conversation.pinned_at ? <span className="text-blue-200">Pinned</span> : null}{formatDate(conversation.updated_at)}</span>
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
                      compact
                    />
                  </div>
                ))
              )}
            </div>
          </section>
        </aside>

        <main className="min-w-0">
          <section className="glass-panel flex min-h-[720px] flex-col overflow-hidden rounded-lg xl:h-[calc(100vh-220px)] xl:min-h-[640px]">
            <header className="border-b border-white/10 p-4 md:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Conversation</p>
                  <h2 className="mt-2 line-clamp-2 font-outfit text-2xl font-semibold text-white">
                    {thread.conversation?.title ?? "New conversation"}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {thread.conversation
                      ? "Ask follow-up questions against the same retrieved workspace context."
                      : "Start with a grounded question from your approved Notion knowledge."}
                  </p>
                </div>
                {thread.conversation ? (
                  <ConversationActionsMenu
                    conversationId={thread.conversation.id}
                    title={thread.conversation.title}
                    pinned={Boolean(thread.conversation.pinned_at)}
                    archived={Boolean(thread.conversation.archived_at)}
                    renameAction={renameConversationAction}
                    togglePinnedAction={togglePinnedConversationAction}
                    archiveAction={archiveConversationAction}
                    restoreAction={restoreConversationAction}
                    deleteAction={deleteConversationAction}
                  />
                ) : null}
              </div>
            </header>

            <div className="kora-scroll-panel flex-1 overflow-y-auto p-4 md:p-5">
              {thread.messages.length === 0 ? (
                <div className="flex min-h-full items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.025] p-6 text-center">
                  <div className="max-w-xl">
                    <p className="font-outfit text-2xl font-semibold text-white">Ask from approved Notion knowledge</p>
                    <p className="mt-3 text-sm leading-6 text-slate-400">
                      Kora will find relevant approved knowledge, explain it clearly, and show the sources supporting each answer.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {thread.messages.map((message) => {
                    const messageCitations = thread.citations.get(message.id) ?? [];
                    const isAssistant = message.role === "assistant";
                    return (
                      <article key={message.id} className={`rounded-lg border bg-white/[0.035] p-4 md:p-5 ${isAssistant ? "border-blue-300/20" : "border-white/10"}`}>
                        <div className="flex items-start gap-3">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isAssistant ? "bg-blue-400/15 text-blue-200" : "bg-white/10 text-white"}`}>
                            {isAssistant ? <Bot size={17} aria-hidden="true" /> : <User size={17} aria-hidden="true" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-white">{isAssistant ? "Kora" : "You"}</p>
                              {isAssistant ? <span className="glass-soft rounded px-2 py-1 text-xs text-slate-300">{answerModeLabel(message.answer_mode, messageCitations.length)}</span> : null}
                              <span className="text-xs text-slate-600">{formatDate(message.created_at)}</span>{isAssistant ? <MessageCopyButton content={message.content} /> : null}
                            </div>
                            <div className="kora-scroll-panel mt-3 max-h-[360px] overflow-y-auto pr-2 text-sm leading-6 text-slate-300">
                              <AnswerContent content={message.content} />
                            </div>
                            {isAssistant && message.follow_up_question ? <p className="mt-4 rounded-lg border border-blue-300/15 bg-blue-400/[0.07] px-3 py-2 text-sm text-blue-100">{message.follow_up_question}</p> : null}
                            {isAssistant && message.suggested_follow_ups?.length > 0 ? (
                              <div className="mt-4 flex flex-wrap gap-2">
                                {message.suggested_follow_ups.map((suggestion) => <Link key={suggestion} href={`/app/ask?conversationId=${thread.conversation?.id ?? ""}&q=${encodeURIComponent(suggestion)}`} className="rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-blue-300/30 hover:text-white">{suggestion}</Link>)}
                              </div>
                            ) : null}
                            {messageCitations.length > 0 ? (
                              <div className="mt-5 overflow-hidden rounded-lg border border-white/10 bg-black/10">
                                <div className="border-b border-white/10 px-3 py-2 text-xs font-semibold text-slate-300">Sources ({messageCitations.length})</div>
                                {messageCitations.map((citation) => {
                                  const doc = documentForCitation(citation);
                                  return (
                                    <details key={citation.id} className="group border-b border-white/10 last:border-b-0">
                                      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm text-slate-300 transition hover:bg-white/[0.035] hover:text-white">
                                        <span className="font-mono text-xs font-semibold text-blue-200">[{citation.citation_order}]</span>
                                        <span className="min-w-0 flex-1 truncate"><span className="font-semibold text-white">{citation.section_title ?? "Referenced section"}</span><span className="text-slate-500"> / {doc?.title ?? "Source document"}</span></span>
                                        <ChevronDown className="shrink-0 transition group-open:rotate-180" size={14} aria-hidden="true" />
                                      </summary>
                                      <div className="border-t border-white/10 px-3 py-3">
                                        {citation.quote_excerpt ? <blockquote className="text-sm leading-6 text-slate-300">{citation.quote_excerpt}</blockquote> : <p className="text-sm text-slate-500">No source preview was stored.</p>}
                                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold">
                                          <Link href={`/app/knowledge/${citation.document_id}`} className="inline-flex items-center gap-1 text-blue-200 hover:text-blue-100"><FileText size={13} aria-hidden="true" /> View in Kora</Link>
                                          {doc?.source_url ? <a href={doc.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-slate-300 hover:text-white"><ExternalLink size={13} aria-hidden="true" /> Open in Notion</a> : null}
                                        </div>
                                      </div>
                                    </details>
                                  );
                                })}
                              </div>
                            ) : isAssistant ? (
                              <p className="mt-4 inline-flex items-center gap-2 rounded-lg border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-100"><MessageSquare size={13} aria-hidden="true" /> No sources support this response yet.</p>
                            ) : null}
                            {isAssistant ? <MessageFeedbackControls messageId={message.id} currentRating={thread.feedback.get(message.id) ?? null} action={submitMessageFeedbackAction} /> : null}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            <AskComposer conversationId={thread.conversation?.id ?? null} dailyUsage={dailyUsage} defaultQuestion={defaultQuestion} action={askQuestionAction} />
          </section>
        </main>
      </div>
    </AppShell>
  );
}