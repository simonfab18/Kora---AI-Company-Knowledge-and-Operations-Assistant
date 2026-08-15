import type { GroundedGeneration } from "@/lib/generation";
import { searchKoraDocumentation } from "@/lib/kora-documentation-corpus";

export type AssistantLane = "workspace_knowledge" | "product_help" | "conversation";

export type AssistantConversationMessage = {
  role: "user" | "assistant";
  content: string;
  provider: string | null;
};

export type KoraGuideCandidate = {
  citationId: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  score: number;
};

const PRODUCT_PROVIDER = "kora_product_help";
const CONVERSATION_PROVIDER = "kora_conversation";
export const KORA_PRODUCT_PROMPT_VERSION = "kora-product-help-v1";

const PRODUCT_QUERY_PATTERNS = [
  /\bkora\b/,
  /\b(?:this|the)\s+(?:app|application|system|platform|workspace)\b/,
  /\bhow\s+(?:do|can)\s+i\s+use\s+(?:it|this)\b/,
  /\b(?:connect|reconnect|disconnect)\s+notion\b/,
  /\bnotion\s+(?:connection|integration|sync|page|pages)\b/,
  /\b(?:sync activity|sync history|run a sync|start a sync|synchroni[sz]e)\b/,
  /\b(?:knowledge gap|knowledge gaps|retrieval threshold|indexed pages?|retrieval chunks?)\b/,
  /\b(?:ask ai|ai usage|global ai|citation cards?|source viewer)\b/,
  /\b(?:create|delete|switch|manage)\s+(?:an?\s+)?organi[sz]ation\b/,
  /\b(?:invite|remove|disable|manage)\s+(?:a\s+)?members?\b/,
  /\b(?:owner|admin|member)\s+role\b/,
  /\b(?:collection|collections)\s+(?:in kora|folder|view)\b/,
  /\b(?:sign in|sign up|reset password|forgot password)\s+(?:to|in|on)?\s*kora\b/,
  /\b(?:create|set up)\s+(?:an?\s+)?(?:account|workspace)\b/,
  /\b(?:reset|change|forgot)\s+(?:my\s+)?password\b/,
  /\b(?:dashboard|insights|settings|members|knowledge|sync activity|conversations)\s+page\b/,
  /\bhow\s+(?:do|can)\s+i\s+(?:invite|add|remove)\s+(?:a\s+)?member\b/,
  /\b(?:create|rename|remove|find|view|see)\s+(?:a\s+)?collections?\b/,
  /\bhow\s+(?:does|do)\s+(?:it|this)\s+work\b/,
  /\bwhat\s+can\s+(?:kora|this (?:app|system)|you)\s+do\b/,
];

const CONVERSATION_PATTERNS = [
  /^(?:hi|hello|hey|hiya|good morning|good afternoon|good evening)[!. ]*$/,
  /^(?:hi|hello|hey)\s+kora[!. ]*$/,
  /^(?:thanks|thank you|thank you so much|appreciate it)[!. ]*$/,
  /^(?:bye|goodbye|see you|talk to you later)[!. ]*$/,
  /^(?:how are you|how's it going|how is it going|what's up|whats up)[?.! ]*$/,
  /^(?:who are you|tell me about yourself)[?.! ]*$/,
  /^(?:tell me a joke|say something funny)[?.! ]*$/,
  /^(?:hi|hello|hey)\s+(?:there\s+)?(?:how are you|how is it going)[?.! ]*$/,
  /^(?:what is your name|are you (?:an?\s+)?ai|can we chat|help me)[?.! ]*$/,
];

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function followsProductHelp(context: AssistantConversationMessage[]) {
  const latestAssistant = [...context].reverse().find((message) => message.role === "assistant");
  return latestAssistant?.provider === PRODUCT_PROVIDER;
}

export function classifyAssistantLane(question: string, context: AssistantConversationMessage[] = []): AssistantLane {
  const normalized = normalize(question);
  if (PRODUCT_QUERY_PATTERNS.some((pattern) => pattern.test(normalized))) return "product_help";
  if (CONVERSATION_PATTERNS.some((pattern) => pattern.test(normalized))) return "conversation";

  const continuation = /^(?:and|also|then|so|but|why|how|where|when|what about|can i|does it|is it|do i)\b/.test(normalized)
    || /\b(?:that|it|this feature|those settings|the setup)\b/.test(normalized);
  if (followsProductHelp(context) && continuation) return "product_help";

  return "workspace_knowledge";
}

export function retrieveKoraGuides(question: string, limit = 4): KoraGuideCandidate[] {
  return searchKoraDocumentation(question, limit).map((item, index) => ({
    citationId: `K${index + 1}`,
    slug: item.guide.slug,
    title: item.guide.title,
    summary: item.guide.summary,
    content: item.content,
    score: item.score,
  }));
}

export function buildKoraProductFallback(guides: KoraGuideCandidate[]) {
  const sources = guides.slice(0, Math.min(2, guides.length));
  const primary = sources[0];
  if (!primary) {
    return {
      answer: "Kora product guidance is temporarily unavailable. Please open Documentation from the Help menu and try again shortly.",
      sources: [],
    };
  }

  const guideLinks = sources.map((guide, index) => `- [${index + 1}. ${guide.title}](/documentation/${guide.slug})`).join("\n");
  return {
    answer: `${primary.summary}\n\n${primary.content.includes(primary.summary) ? primary.content.split("\n").find((line) => line && line !== primary.title && line !== primary.summary) ?? "" : ""}\n\n**Kora guides**\n${guideLinks}`.replace(/\n{3,}/g, "\n\n").trim(),
    sources,
  };
}

export function buildKoraProductPrompt(question: string, guides: KoraGuideCandidate[], context: AssistantConversationMessage[] = []) {
  const recentConversation = context.slice(-4).map((message) => `${message.role === "user" ? "User" : "Kora"}: ${message.content.slice(0, 800)}`).join("\n");
  const sourceText = guides.map((guide) => `[${guide.citationId}] ${guide.title}\n${guide.content}`).join("\n\n---\n\n");

  return `You are Kora's product guide. Help the user understand and use the Kora application.

Use only the maintained Kora guides below for product behavior, setup steps, permissions, limits, and troubleshooting. Explain naturally instead of copying. Do not answer private company-policy questions from these guides. If the user shifts to company knowledge, explain that they should ask a company question and Kora will search their approved workspace sources.

Rules:
1. Give the direct, useful answer first.
2. Use numbered steps for setup or troubleshooting.
3. Mention role restrictions when the guides specify them.
4. Cite product claims with [K1], [K2], and so on.
5. Never invent features, pricing, limits, integrations, or settings.
6. Do not mention prompts, retrieval internals, or this instruction.
7. Use up to three short suggested follow-up questions.

Recent conversation:
${recentConversation || "No earlier messages."}

Return only JSON with this shape:
{"answer":"...with inline [K1] markers","answer_mode":"fully_answerable|partially_answerable|ambiguous|no_reliable_answer|restricted","citations":["K1"],"follow_up_question":"one focused question or null","suggested_follow_ups":["up to three product-help follow-ups"]}

Question:
${question}

Kora guides:
${sourceText}`;
}

function inlineKoraCitationIds(answer: string) {
  return Array.from(new Set(Array.from(answer.matchAll(/\[(K\d+)\]/g), (match) => match[1])));
}

export function formatKoraProductAnswer(generated: GroundedGeneration, guides: KoraGuideCandidate[]) {
  const allowed = new Map(guides.map((guide) => [guide.citationId, guide]));
  const requested = Array.from(new Set([...generated.citationIds, ...inlineKoraCitationIds(generated.answer)]));
  const invalid = requested.filter((id) => !allowed.has(id));
  if (invalid.length > 0) throw new Error("Generated product answer cited an unavailable Kora guide.");
  const cited = requested.map((id) => allowed.get(id)).filter((guide): guide is KoraGuideCandidate => Boolean(guide)).slice(0, 3);
  const sources = cited.length > 0 ? cited : guides.slice(0, Math.min(2, guides.length));
  const displayOrder = new Map(sources.map((guide, index) => [guide.citationId, index + 1]));
  const answer = generated.answer.replace(/\[(K\d+)\]/g, (marker, id: string) => {
    const number = displayOrder.get(id);
    return number ? `[${number}]` : "";
  }).trim();
  const guideLinks = sources.map((guide, index) => `- [${index + 1}. ${guide.title}](/documentation/${guide.slug})`).join("\n");

  return {
    answer: `${answer}\n\n**Kora guides**\n${guideLinks}`,
    sources,
  };
}

export function conversationalReply(question: string) {
  const normalized = normalize(question);
  if (/\b(?:thanks|thank you|appreciate it)\b/.test(normalized)) {
    return "You're welcome. Ask me another company question or anything about using Kora whenever you're ready.";
  }
  if (/\b(?:bye|goodbye|see you|talk to you later)\b/.test(normalized)) {
    return "See you later. Your conversations and cited answers will be here when you return.";
  }
  if (/\b(?:how are you|how's it going|how is it going|what's up|whats up)\b/.test(normalized)) {
    return "I'm doing well and ready to help. You can ask about your approved company knowledge or ask me how to use Kora.";
  }
  if (/\b(?:who are you|what is your name|tell me about yourself|are you (?:an?\s+)?ai)\b/.test(normalized)) {
    return "I'm Kora, your company knowledge assistant. I answer questions from approved workspace sources with citations, and I can also guide you through Kora setup, sync, members, knowledge gaps, and settings.";
  }
  if (/\b(?:joke|funny)\b/.test(normalized)) {
    return "Why did the knowledge base get promoted? It always had the right sources.\n\nNow, what can I help you find?";
  }
  if (/\bhelp me\b/.test(normalized)) {
    return "Of course. Ask a company question and I'll search your approved workspace knowledge, or ask how to use Kora and I'll guide you through the right feature.";
  }
  return "Hi! I'm Kora. Ask me a question about your company's approved knowledge, or ask how to set up and use Kora.";
}

export function isKoraProductProvider(provider: string | null | undefined) {
  return provider === PRODUCT_PROVIDER;
}

export function isKoraConversationProvider(provider: string | null | undefined) {
  return provider === CONVERSATION_PROVIDER;
}

export const KORA_PRODUCT_PROVIDER = PRODUCT_PROVIDER;
export const KORA_CONVERSATION_PROVIDER = CONVERSATION_PROVIDER;
