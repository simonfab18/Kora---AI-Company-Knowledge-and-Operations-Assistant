export const MIN_RETRIEVAL_THRESHOLD = 0.2;
export const MAX_RETRIEVAL_THRESHOLD = 0.85;
export const DEFAULT_RETRIEVAL_THRESHOLD = 0.5;
export const DEFAULT_AI_PROVIDER = "gemini";
export const DEFAULT_GENERATION_MODEL = "gemini-flash-latest";
export const DEFAULT_EMBEDDING_PROVIDER = "gemini";
export const DEFAULT_EMBEDDING_MODEL = "gemini-embedding-001";
export const DEFAULT_EMBEDDING_DIMENSION = 1536;

type AiSettingsInput = {
  ai_provider?: unknown;
  generation_model?: unknown;
  embedding_provider?: unknown;
  embedding_model?: unknown;
  embedding_dimension?: unknown;
  retrieval_threshold?: unknown;
};

function nonEmptyString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function normalizeAiSettings(settings: AiSettingsInput | null | undefined) {
  const dimension = Number(settings?.embedding_dimension);
  const threshold = Number(settings?.retrieval_threshold);

  return {
    aiProvider: nonEmptyString(settings?.ai_provider, DEFAULT_AI_PROVIDER),
    generationModel: nonEmptyString(settings?.generation_model, DEFAULT_GENERATION_MODEL),
    embeddingProvider: nonEmptyString(settings?.embedding_provider, DEFAULT_EMBEDDING_PROVIDER),
    embeddingModel: nonEmptyString(settings?.embedding_model, DEFAULT_EMBEDDING_MODEL),
    embeddingDimension: Number.isInteger(dimension) && dimension > 0 ? dimension : DEFAULT_EMBEDDING_DIMENSION,
    retrievalThreshold: Number.isFinite(threshold)
      ? Math.min(MAX_RETRIEVAL_THRESHOLD, Math.max(MIN_RETRIEVAL_THRESHOLD, threshold))
      : DEFAULT_RETRIEVAL_THRESHOLD,
  };
}

export type RetrievalThresholdValidation =
  | { ok: true; value: number }
  | { ok: false; error: string };

export function parseRetrievalThresholdPercent(input: string): RetrievalThresholdValidation {
  const parsed = Number(input);

  if (!Number.isFinite(parsed)) {
    return { ok: false, error: "Enter a valid retrieval threshold." };
  }

  if (parsed < MIN_RETRIEVAL_THRESHOLD * 100 || parsed > MAX_RETRIEVAL_THRESHOLD * 100) {
    return {
      ok: false,
      error: `Retrieval threshold must be between ${Math.round(MIN_RETRIEVAL_THRESHOLD * 100)}% and ${Math.round(MAX_RETRIEVAL_THRESHOLD * 100)}%.`,
    };
  }

  return { ok: true, value: Math.round(parsed) / 100 };
}

export function retrievalThresholdTone(threshold: number) {
  if (threshold >= 0.7) {
    return {
      label: "Strict",
      helper: "Kora will answer only when sources are a strong match.",
    };
  }

  if (threshold <= 0.4) {
    return {
      label: "Flexible",
      helper: "Kora can use more sources, but may mark more answers as low confidence.",
    };
  }

  return {
    label: "Balanced",
    helper: "Kora balances answer coverage with citation quality.",
  };
}
