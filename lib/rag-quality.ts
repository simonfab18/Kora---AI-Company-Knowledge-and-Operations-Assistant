import type { CitationCandidate } from "@/lib/grounded-chat";

export type AnswerMode =
  | "fully_answerable"
  | "partially_answerable"
  | "ambiguous"
  | "no_reliable_answer"
  | "restricted";

export type QuestionIntent = "procedure" | "policy" | "recommendation" | "comparison" | "troubleshooting" | "lookup";

export type QueryAnalysis = {
  intent: QuestionIntent;
  topic: string;
  ambiguous: boolean;
  terms: string[];
};

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "can", "could", "do", "does", "for", "from", "how", "i", "in", "is", "it", "me", "my",
  "of", "on", "or", "our", "please", "should", "the", "this", "to", "what", "when", "where", "which", "who", "why", "with", "would", "you", "your",
]);

const INTENT_TERMS: Record<QuestionIntent, string[]> = {
  procedure: ["procedure", "steps", "instructions", "workflow"],
  policy: ["policy", "rule", "requirement", "approval", "exception"],
  recommendation: ["recommendation", "options", "criteria", "tradeoffs"],
  comparison: ["comparison", "difference", "advantages", "tradeoffs"],
  troubleshooting: ["troubleshooting", "cause", "checks", "resolution"],
  lookup: ["overview", "details", "guidance"],
};

export function analyzeQuestion(question: string): QueryAnalysis {
  const normalized = question.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
  const terms = Array.from(new Set(normalized.split(" ").filter((term) => term.length > 2 && !STOP_WORDS.has(term))));
  let intent: QuestionIntent = "lookup";

  if (/\b(how|steps?|install|set up|configure|process|procedure)\b/.test(normalized)) intent = "procedure";
  else if (/\b(policy|allowed|eligible|approval|rule|requirement)\b/.test(normalized)) intent = "policy";
  else if (/\b(recommend|best|should i|option)\b/.test(normalized)) intent = "recommendation";
  else if (/\b(compare|difference|versus|vs\.?|better)\b/.test(normalized)) intent = "comparison";
  else if (/\b(fix|broken|error|issue|problem|troubleshoot)\b/.test(normalized)) intent = "troubleshooting";

  const broadAction = /\b(fix|handle|manage|set up|install|process)\b/.test(normalized);
  const ambiguous = terms.length < 2 || (broadAction && terms.length <= 3);
  return { intent, topic: terms.slice(0, 6).join(" ") || normalized, ambiguous, terms };
}

export function rewriteRetrievalQueries(question: string) {
  const analysis = analyzeQuestion(question);
  const expanded = `${analysis.topic} ${INTENT_TERMS[analysis.intent].join(" ")}`.trim();
  const exact = analysis.terms.join(" ");
  return Array.from(new Set([question.trim(), expanded, exact].filter((query) => query.length >= 2))).slice(0, 3);
}

export function answerModeLabel(mode: AnswerMode | null | undefined, sourceCount: number, provider?: string | null) {
  if (provider === "kora_product_help") return "Kora product guide";
  if (provider === "kora_conversation") return "Kora assistant";
  if (mode === "partially_answerable") return "Partial answer";
  if (mode === "ambiguous") return "Clarification included";
  if (mode === "no_reliable_answer") return "More information needed";
  if (mode === "restricted") return "Access required";
  return sourceCount === 1 ? "Grounded in 1 source" : `Grounded in ${sourceCount} sources`;
}

export function extractInlineCitationIds(answer: string) {
  return Array.from(new Set(Array.from(answer.matchAll(/\[(C\d+)\]/g), (match) => match[1])));
}

export function formatInlineCitations(answer: string, citations: CitationCandidate[]) {
  const displayOrder = new Map(citations.map((citation, index) => [citation.citationId, index + 1]));
  return answer.replace(/\[(C\d+)\]/g, (marker, citationId: string) => {
    const number = displayOrder.get(citationId);
    return number ? `[${number}]` : marker;
  });
}

export function cleanGeneratedAnswer(answer: string) {
  return answer
    .replace(/\bthe provided context\b/gi, "the company knowledge base")
    .replace(/\bthe retrieved chunks?\b/gi, "the company sources")
    .replace(/\bbased on the context window\b/gi, "based on the available company guidance")
    .replace(/^\s*i(?:'m| am) sorry,?\s*/i, "")
    .trim();
}

export function normalizeSuggestedFollowUps(values: string[] | undefined) {
  return Array.from(new Set((values ?? []).map((value) => value.replace(/\s+/g, " ").trim()).filter((value) => value.length >= 4 && value.length <= 140))).slice(0, 3);
}

export function retrievalConfidence(input: {
  vectorScore: number;
  keywordScore: number;
  rerankerScore: number;
  sourceCount: number;
  queryCoverage: number;
}) {
  if (input.sourceCount === 0) return "insufficient" as const;
  const supportBonus = Math.min(input.sourceCount, 3) * 0.04;
  const composite = input.vectorScore * 0.5 + input.keywordScore * 0.15 + input.rerankerScore * 0.2 + input.queryCoverage * 0.15 + supportBonus;
  if (composite >= 0.76) return "high" as const;
  if (composite >= 0.56) return "medium" as const;
  return "low" as const;
}
