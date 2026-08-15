import type { AnswerMode } from "@/lib/rag-quality";
export type GenerationUsage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export type GroundedGeneration = {
  answer: string;
  answerMode: AnswerMode;
  citationIds: string[];
  followUpQuestion: string | null;
  suggestedFollowUps: string[];
  usage?: GenerationUsage;
};

export type GenerationProvider = {
  provider: string;
  model: string;
  generateGroundedAnswer(prompt: string): Promise<GroundedGeneration>;
};

export type GenerationProviderConfig = {
  provider: string;
  model: string;
};

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_GEMINI_GENERATION_MODEL = "gemini-flash-latest";
const LEGACY_GEMINI_GENERATION_MODELS = new Set([
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash-lite-001",
]);

function parseJsonObject(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced?.[1] ?? trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end < start) {
    throw new Error("generation_invalid_json");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate.slice(start, end + 1)) as unknown;
  } catch {
    throw new Error("generation_invalid_json");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("generation_invalid_json");
  }
  return parsed as Record<string, unknown>;
}

function normalizeGroundedGeneration(text: string, usage?: GenerationUsage): GroundedGeneration {
  const parsed = parseJsonObject(text);
  const answer = typeof parsed.answer === "string" ? parsed.answer.trim() : "";
  const rawCitations = Array.isArray(parsed.citations) ? parsed.citations : [];
  const citationIds = rawCitations.filter((value): value is string => typeof value === "string");
  const allowedModes = new Set<AnswerMode>(["fully_answerable", "partially_answerable", "ambiguous", "no_reliable_answer", "restricted"]);
  const requestedMode = typeof parsed.answer_mode === "string" ? parsed.answer_mode as AnswerMode : "fully_answerable";
  const answerMode = allowedModes.has(requestedMode) ? requestedMode : "fully_answerable";
  const followUpQuestion = typeof parsed.follow_up_question === "string" && parsed.follow_up_question.trim()
    ? parsed.follow_up_question.trim()
    : null;
  const suggestedFollowUps = Array.isArray(parsed.suggested_follow_ups)
    ? parsed.suggested_follow_ups.filter((value): value is string => typeof value === "string")
    : [];

  if (!answer) {
    throw new Error("generation_missing_answer");
  }

  return { answer, answerMode, citationIds, followUpQuestion, suggestedFollowUps, usage };
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) {
      throw new Error(`generation_http_${response.status}`);
    }
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("generation_timeout");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function createGeminiGenerationProvider(config: GenerationProviderConfig): GenerationProvider {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini generation key is not configured.");
  }

  const requestedModel = config.model?.trim();
  const model =
    !requestedModel || LEGACY_GEMINI_GENERATION_MODELS.has(requestedModel)
      ? DEFAULT_GEMINI_GENERATION_MODEL
      : requestedModel;
  return {
    provider: "gemini",
    model,
    async generateGroundedAnswer(prompt: string) {
      const response = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: "application/json",
            },
          }),
        },
      );
      const data = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number };
      };
      const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
      return normalizeGroundedGeneration(text, {
        promptTokens: data.usageMetadata?.promptTokenCount,
        completionTokens: data.usageMetadata?.candidatesTokenCount,
        totalTokens: data.usageMetadata?.totalTokenCount,
      });
    },
  };
}

function createOpenAiGenerationProvider(config: GenerationProviderConfig): GenerationProvider {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI generation key is not configured.");
  }

  const model = config.model || "gpt-4.1-mini";
  return {
    provider: "openai",
    model,
    async generateGroundedAnswer(prompt: string) {
      const response = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      };
      return normalizeGroundedGeneration(data.choices?.[0]?.message?.content ?? "", {
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
        totalTokens: data.usage?.total_tokens,
      });
    },
  };
}

export function createGenerationProvider(config: GenerationProviderConfig): GenerationProvider {
  if (config.provider === "gemini") {
    return createGeminiGenerationProvider(config);
  }
  if (config.provider === "openai") {
    return createOpenAiGenerationProvider(config);
  }
  throw new Error(`Unsupported generation provider: ${config.provider}`);
}
