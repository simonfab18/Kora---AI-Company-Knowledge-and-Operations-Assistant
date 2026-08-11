import type { AnswerConfidence, MessageFeedbackRating, MessageRole } from "@/lib/database.types";

export type ConversationMessageSummaryInput = {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  confidence: AnswerConfidence | null;
  created_at: string;
};

export type ConversationFeedbackSummaryInput = {
  message_id: string;
  rating: MessageFeedbackRating;
};

export type ConversationSummary = {
  messageCount: number;
  assistantCount: number;
  weakAnswerCount: number;
  citationCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  lastQuestion: string | null;
  lastAnswer: string | null;
  lastConfidence: AnswerConfidence | null;
};

function emptySummary(): ConversationSummary {
  return {
    messageCount: 0,
    assistantCount: 0,
    weakAnswerCount: 0,
    citationCount: 0,
    helpfulCount: 0,
    notHelpfulCount: 0,
    lastQuestion: null,
    lastAnswer: null,
    lastConfidence: null,
  };
}

export function summarizeConversations({
  messages,
  citationMessageIds,
  feedback,
}: {
  messages: ConversationMessageSummaryInput[];
  citationMessageIds: string[];
  feedback: ConversationFeedbackSummaryInput[];
}) {
  const summaries = new Map<string, ConversationSummary>();
  const messageToConversation = new Map<string, string>();

  for (const message of messages) {
    const summary = summaries.get(message.conversation_id) ?? emptySummary();
    summary.messageCount += 1;
    messageToConversation.set(message.id, message.conversation_id);

    if (message.role === "user") {
      summary.lastQuestion = message.content;
    }

    if (message.role === "assistant") {
      summary.assistantCount += 1;
      summary.lastAnswer = message.content;
      summary.lastConfidence = message.confidence;

      if (message.confidence === "low" || message.confidence === "insufficient") {
        summary.weakAnswerCount += 1;
      }
    }

    summaries.set(message.conversation_id, summary);
  }

  for (const messageId of citationMessageIds) {
    const conversationId = messageToConversation.get(messageId);
    if (!conversationId) continue;

    const summary = summaries.get(conversationId) ?? emptySummary();
    summary.citationCount += 1;
    summaries.set(conversationId, summary);
  }

  for (const feedbackRow of feedback) {
    const conversationId = messageToConversation.get(feedbackRow.message_id);
    if (!conversationId) continue;

    const summary = summaries.get(conversationId) ?? emptySummary();
    if (feedbackRow.rating === "helpful") {
      summary.helpfulCount += 1;
    } else {
      summary.notHelpfulCount += 1;
    }
    summaries.set(conversationId, summary);
  }

  return summaries;
}

export function excerptText(value: string | null, maxLength = 180) {
  if (!value) return null;
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength - 1).trimEnd()}...`;
}
