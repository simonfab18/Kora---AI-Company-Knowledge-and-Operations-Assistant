"use server";

import type { ActionState } from "@/lib/action-state";
import { invalidateOrganizationSummaryCache } from "@/lib/organization-summary-cache";
import { dailyAiQuotaError, releaseDailyAiQuotaReservation, reserveDailyAiQuota } from "@/lib/ai-usage";
import { requireActiveOrganization } from "@/lib/authorization";
import type { MessageFeedbackRating, MessageFeedbackReason } from "@/lib/database.types";
import { answerGroundedQuestion } from "@/lib/grounded-chat";
import { recordKnowledgeGap } from "@/lib/knowledge-gaps";
import { logOperationalEvent } from "@/lib/operational-logging";
import { checkDistributedRateLimit, rateLimitMessage } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function safeChatError(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes("generation_http_429")) {
      return "Gemini generation quota is blocked for the configured model. Run the Gemini generation model SQL update, then retry.";
    }
    if (error.message.includes("generation_http_404")) {
      return "The configured Gemini generation model is unavailable. Run the Gemini generation model SQL update, then retry.";
    }
    if (error.message.includes("generation_invalid_json")) {
      return "Gemini answered in an unsupported format. Try the question again.";
    }
    if (error.message.includes("not configured")) {
      return error.message;
    }
    if (error.message.includes("unavailable source chunks")) {
      return "The model returned an unsupported citation, so the answer was rejected safely.";
    }
    if (error.message === "Ask a question first." || error.message === "Keep questions under 4,000 characters.") {
      return error.message;
    }
  }
  return "Kora could not answer that safely. Try again after checking sync and embedding status.";
}

export async function askQuestionAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const question = getString(formData, "question");
  const conversationId = getString(formData, "conversationId") || null;
  const requestId = getString(formData, "requestId") || randomUUID();
  const { user, membership } = await requireActiveOrganization();
  const userSupabase = await createClient();
  let nextConversationId = conversationId;
  let quotaReservationId: string | null = null;
  const rateLimit = await checkDistributedRateLimit({
    key: `ask:${membership.organization.id}:${user.id}`,
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return { error: rateLimitMessage(rateLimit.retryAfterSeconds) };
  }

  const quotaReservation = await reserveDailyAiQuota({
    organizationId: membership.organization.id,
    userId: user.id,
    idempotencyKey: requestId,
    supabase: userSupabase,
  });

  if (!quotaReservation.allowed || !quotaReservation.reservationId) {
    return { error: dailyAiQuotaError(quotaReservation) ?? "Daily AI quota reached." };
  }
  quotaReservationId = quotaReservation.reservationId;

  try {
    const result = await answerGroundedQuestion({
      conversationId,
      organizationId: membership.organization.id,
      userId: user.id,
      question,
      quotaReservationId,
      quotaSupabase: userSupabase,
    });
    nextConversationId = result.conversationId;
  } catch (error) {
    if (quotaReservationId) {
      await releaseDailyAiQuotaReservation(quotaReservationId, userSupabase).catch((releaseError) => {
        logOperationalEvent("error", "ask.quota_release_failed", {
          error: releaseError,
          organizationId: membership.organization.id,
          userId: user.id,
          conversationId,
        });
      });
    }
    logOperationalEvent("error", "ask.answer_failed", {
      error,
      organizationId: membership.organization.id,
      userId: user.id,
      conversationId,
    });
    return { error: safeChatError(error) };
  }

  await invalidateOrganizationSummaryCache(membership.organization.id);
  revalidatePath("/app");
  revalidatePath("/app/ask");
  revalidatePath("/app/conversations");
  return { message: "Answer saved.", redirectTo: `/app/ask?conversationId=${nextConversationId}` };
}
export async function submitMessageFeedbackAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const messageId = getString(formData, "messageId");
  const rating = getString(formData, "rating") as MessageFeedbackRating;
  const reason = getString(formData, "reason") as MessageFeedbackReason;
  const note = getString(formData, "note").slice(0, 500);
  const { user, membership } = await requireActiveOrganization();
  const rateLimit = await checkDistributedRateLimit({
    key: `feedback:${membership.organization.id}:${user.id}`,
    limit: 60,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return { error: rateLimitMessage(rateLimit.retryAfterSeconds) };
  }

  if (!messageId || (rating !== "helpful" && rating !== "not_helpful")) {
    return { error: "Choose helpful or not helpful." };
  }

  const allowedReasons = new Set<MessageFeedbackReason>(["wrong_answer", "missing_context", "wrong_citation", "unclear", "too_vague", "too_long", "outdated", "other"]);
  if (rating === "not_helpful" && !allowedReasons.has(reason)) {
    return { error: "Choose why the answer was not helpful." };
  }

  const supabase = createAdminClient();
  const { data: message, error: messageError } = await supabase
    .from("messages")
    .select("id, conversation_id, organization_id, role, confidence, created_at, conversations!inner(user_id, archived_at)")
    .eq("id", messageId)
    .eq("organization_id", membership.organization.id)
    .eq("role", "assistant")
    .maybeSingle();

  const conversation = Array.isArray(message?.conversations) ? message?.conversations[0] : message?.conversations;

  if (messageError || !message || !conversation || conversation.user_id !== user.id || conversation.archived_at) {
    return { error: "That answer could not be rated." };
  }

  const { error: feedbackError } = await supabase.from("message_feedback").upsert(
    {
      organization_id: membership.organization.id,
      message_id: message.id,
      user_id: user.id,
      rating,
      reason: rating === "not_helpful" ? reason : null,
      note: rating === "not_helpful" && note ? note : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "message_id,user_id" },
  );

  if (feedbackError) {
    logOperationalEvent("error", "ask.feedback_failed", {
      error: feedbackError,
      organizationId: membership.organization.id,
      userId: user.id,
      messageId,
    });
    return { error: "Feedback could not be saved. Run the latest Supabase migration, then try again." };
  }

  if (rating === "not_helpful") {
    const [{ data: previousQuestion }, { data: relatedCitation }] = await Promise.all([
      supabase
        .from("messages")
        .select("content")
        .eq("organization_id", membership.organization.id)
        .eq("conversation_id", message.conversation_id)
        .eq("role", "user")
        .lt("created_at", message.created_at)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("message_citations")
        .select("document_id")
        .eq("message_id", message.id)
        .order("citation_order", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

    if (previousQuestion?.content) {
      await recordKnowledgeGap({
        organizationId: membership.organization.id,
        question: previousQuestion.content,
        assistantMessageId: message.id,
        confidence: message.confidence,
        reason: "negative_feedback",
        missingTopic: note || undefined,
        relatedDocumentId: relatedCitation?.document_id ?? null,
      });
    }
  }
  await invalidateOrganizationSummaryCache(membership.organization.id);
  revalidatePath("/app");

  revalidatePath("/app/ask");
  revalidatePath("/app/insights");
  return { message: rating === "helpful" ? "Marked helpful." : "Marked not helpful and sent to Insights." };
}
export async function renameConversationAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const conversationId = getString(formData, "conversationId");
  const title = getString(formData, "title").slice(0, 100);
  const { user, membership } = await requireActiveOrganization();

  if (!conversationId || title.length < 2) {
    return { error: "Add a title with at least 2 characters." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("conversations")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", conversationId)
    .eq("organization_id", membership.organization.id)
    .eq("user_id", user.id);

  if (error) {
    return { error: "Conversation could not be renamed." };
  }

  revalidatePath("/app/ask");
  revalidatePath("/app/conversations");
  return { message: "Conversation renamed." };
}

export async function togglePinnedConversationAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const conversationId = getString(formData, "conversationId");
  const pinned = getString(formData, "pinned") === "true";
  const { user, membership } = await requireActiveOrganization();

  if (!conversationId) {
    return { error: "Choose a conversation to pin." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("conversations")
    .update({ pinned_at: pinned ? null : new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", conversationId)
    .eq("organization_id", membership.organization.id)
    .eq("user_id", user.id);

  if (error) {
    return { error: "Conversation pin could not be updated. Run the pinned conversations migration, then try again." };
  }

  revalidatePath("/app/ask");
  revalidatePath("/app/conversations");
  return { message: pinned ? "Conversation unpinned." : "Conversation pinned." };
}

export async function restoreConversationAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const conversationId = getString(formData, "conversationId");
  const { user, membership } = await requireActiveOrganization();

  if (!conversationId) {
    return { error: "Choose a conversation to restore." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("conversations")
    .update({ archived_at: null, updated_at: new Date().toISOString() })
    .eq("id", conversationId)
    .eq("organization_id", membership.organization.id)
    .eq("user_id", user.id);

  if (error) {
    return { error: "Conversation could not be restored." };
  }

  revalidatePath("/app/ask");
  revalidatePath("/app/conversations");
  return { message: "Conversation restored." };
}

export async function deleteConversationAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const conversationId = getString(formData, "conversationId");
  const { user, membership } = await requireActiveOrganization();

  if (!conversationId) {
    return { error: "Choose a conversation to delete." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("conversations")
    .delete()
    .eq("id", conversationId)
    .eq("organization_id", membership.organization.id)
    .eq("user_id", user.id);

  if (error) {
    return { error: "Conversation could not be deleted." };
  }

  revalidatePath("/app/ask");
  revalidatePath("/app/conversations");
  redirect("/app/conversations?view=archived");
}

export async function archiveConversationAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const conversationId = getString(formData, "conversationId");
  const { user, membership } = await requireActiveOrganization();

  if (!conversationId) {
    return { error: "Choose a conversation to archive." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("conversations")
    .update({ archived_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", conversationId)
    .eq("organization_id", membership.organization.id)
    .eq("user_id", user.id);

  if (error) {
    return { error: "Conversation could not be archived." };
  }

  revalidatePath("/app/ask");
  revalidatePath("/app/conversations");
  redirect("/app/conversations");
}


