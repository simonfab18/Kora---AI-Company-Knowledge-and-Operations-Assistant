import type { AnswerConfidence } from "@/lib/database.types";
import { createAdminClient } from "@/lib/supabase/admin";

export type GapReason = "insufficient_context" | "low_confidence" | "negative_feedback";

export type KnowledgeGapRecordInput = {
  organizationId: string;
  question: string;
  assistantMessageId: string;
  confidence: AnswerConfidence | null;
  reason?: GapReason;
  missingTopic?: string | null;
  relatedDocumentId?: string | null;
};

const MAX_REPRESENTATIVE_QUESTION_LENGTH = 1000;
const QUESTION_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "can",
  "customer",
  "do",
  "does",
  "for",
  "from",
  "how",
  "i",
  "in",
  "is",
  "it",
  "me",
  "my",
  "of",
  "on",
  "or",
  "our",
  "should",
  "the",
  "this",
  "to",
  "what",
  "when",
  "where",
  "who",
  "why",
  "with",
]);

export function normalizeKnowledgeGapQuestion(question: string) {
  return question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_REPRESENTATIVE_QUESTION_LENGTH);
}

export function deriveMissingTopic(question: string) {
  const normalized = normalizeKnowledgeGapQuestion(question);
  const terms = normalized
    .split(" ")
    .filter((term) => term.length > 2 && !QUESTION_STOP_WORDS.has(term));

  if (terms.length === 0) {
    return normalized.slice(0, 80) || "Unknown topic";
  }

  return terms.slice(0, 6).join(" ");
}

export function reasonForGap(confidence: AnswerConfidence): GapReason | null {
  if (confidence === "insufficient") {
    return "insufficient_context";
  }
  if (confidence === "low") {
    return "low_confidence";
  }
  return null;
}

async function firstRelatedDocumentId(organizationId: string, assistantMessageId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("message_citations")
    .select("document_id, documents!inner(organization_id)")
    .eq("message_id", assistantMessageId)
    .eq("documents.organization_id", organizationId)
    .order("citation_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  return typeof data?.document_id === "string" ? data.document_id : null;
}

export async function recordKnowledgeGap(input: KnowledgeGapRecordInput) {
  const reason = input.reason ?? (input.confidence ? reasonForGap(input.confidence) : null);
  const fingerprint = normalizeKnowledgeGapQuestion(input.question);
  if (!reason || fingerprint.length < 2) {
    return null;
  }

  const supabase = createAdminClient();
  const missingTopic = (input.missingTopic?.trim() || deriveMissingTopic(input.question)).slice(0, 160);
  const relatedDocumentId = input.relatedDocumentId ?? (await firstRelatedDocumentId(input.organizationId, input.assistantMessageId));
  const { data: existing, error: existingError } = await supabase
    .from("knowledge_gaps")
    .select("id, occurrence_count")
    .eq("organization_id", input.organizationId)
    .eq("question_fingerprint", fingerprint)
    .in("status", ["open", "reviewing"])
    .order("last_seen_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    const { data, error } = await supabase
      .from("knowledge_gaps")
      .update({
        occurrence_count: Number(existing.occurrence_count ?? 1) + 1,
        last_message_id: input.assistantMessageId,
        confidence: input.confidence,
        reason,
        missing_topic: missingTopic,
        related_document_id: relatedDocumentId,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .eq("organization_id", input.organizationId)
      .select("id")
      .single();

    if (error) {
      throw error;
    }
    return data?.id ?? existing.id;
  }

  const { data, error } = await supabase
    .from("knowledge_gaps")
    .insert({
      organization_id: input.organizationId,
      representative_question: input.question.slice(0, MAX_REPRESENTATIVE_QUESTION_LENGTH),
      question_fingerprint: fingerprint,
      missing_topic: missingTopic,
      related_document_id: relatedDocumentId,
      trigger_message_id: input.assistantMessageId,
      last_message_id: input.assistantMessageId,
      confidence: input.confidence,
      reason,
      occurrence_count: 1,
      status: "open",
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }
  return data?.id ?? null;
}