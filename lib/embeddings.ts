import { createHash } from "crypto";

export type EmbeddingUsage = {
  inputTokens?: number;
  totalTokens?: number;
};

export type EmbeddingBatchResult = {
  embeddings: number[][];
  usage?: EmbeddingUsage;
};

export type EmbeddingProvider = {
  provider: string;
  model: string;
  dimension: number;
  embedBatch(texts: string[]): Promise<EmbeddingBatchResult>;
};

export type EmbeddingProviderConfig = {
  provider: string;
  model: string;
  dimension: number;
};

const DEFAULT_DIMENSION = 1536;

function assertDimension(embedding: number[], dimension: number) {
  if (embedding.length !== dimension) {
    throw new Error(`Embedding dimension mismatch. Expected ${dimension}, received ${embedding.length}.`);
  }
}

function embeddingModelId(provider: string, model: string, dimension: number) {
  return `${provider}:${model}:${dimension}`;
}

export function configuredEmbeddingModelId(config: EmbeddingProviderConfig) {
  return embeddingModelId(config.provider, config.model, config.dimension);
}

function requireEmbeddingDimension(dimension: number) {
  if (dimension !== DEFAULT_DIMENSION) {
    throw new Error("Kora requires 1536-dimensional embeddings for documents and queries.");
  }
}

async function fetchWithRetry(url: string, init: RequestInit, retries = 2) {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, init);
      if (response.ok) {
        return response;
      }

      if (![429, 500, 502, 503, 504].includes(response.status) || attempt === retries) {
        throw new Error(`embedding_http_${response.status}`);
      }
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        break;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
  }

  throw lastError instanceof Error ? lastError : new Error("embedding_request_failed");
}

function createGeminiProvider(config: EmbeddingProviderConfig): EmbeddingProvider {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini embedding key is not configured.");
  }

  requireEmbeddingDimension(config.dimension);
  const model = config.model || "gemini-embedding-001";

  return {
    provider: "gemini",
    model,
    dimension: config.dimension,
    async embedBatch(texts: string[]) {
      if (texts.length === 0) {
        return { embeddings: [] };
      }

      const response = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:batchEmbedContents?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requests: texts.map((text) => ({
              model: `models/${model}`,
              content: { parts: [{ text }] },
              outputDimensionality: config.dimension,
            })),
          }),
        },
      );
      const data = (await response.json()) as { embeddings?: Array<{ values?: number[] }> };
      const embeddings = (data.embeddings ?? []).map((item) => item.values ?? []);
      embeddings.forEach((embedding) => assertDimension(embedding, config.dimension));
      if (embeddings.length !== texts.length) {
        throw new Error("Embedding provider returned an incomplete batch.");
      }
      return { embeddings };
    },
  };
}

function createOpenAiProvider(config: EmbeddingProviderConfig): EmbeddingProvider {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI embedding key is not configured.");
  }

  requireEmbeddingDimension(config.dimension);
  const model = config.model || "text-embedding-3-small";

  return {
    provider: "openai",
    model,
    dimension: config.dimension,
    async embedBatch(texts: string[]) {
      if (texts.length === 0) {
        return { embeddings: [] };
      }

      const response = await fetchWithRetry("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input: texts, model, dimensions: config.dimension }),
      });
      const data = (await response.json()) as {
        data?: Array<{ embedding?: number[] }>;
        usage?: { prompt_tokens?: number; total_tokens?: number };
      };
      const embeddings = (data.data ?? []).map((item) => item.embedding ?? []);
      embeddings.forEach((embedding) => assertDimension(embedding, config.dimension));
      if (embeddings.length !== texts.length) {
        throw new Error("Embedding provider returned an incomplete batch.");
      }
      return {
        embeddings,
        usage: { inputTokens: data.usage?.prompt_tokens, totalTokens: data.usage?.total_tokens },
      };
    },
  };
}

function deterministicVector(text: string, dimension: number) {
  const values: number[] = [];
  let counter = 0;

  while (values.length < dimension) {
    const digest = createHash("sha256").update(`${counter}:${text}`).digest();
    for (const byte of digest) {
      values.push(byte / 127.5 - 1);
      if (values.length === dimension) {
        break;
      }
    }
    counter += 1;
  }

  return values;
}

export function createDeterministicEmbeddingProvider(config: EmbeddingProviderConfig): EmbeddingProvider {
  requireEmbeddingDimension(config.dimension);
  return {
    provider: "test",
    model: config.model || "deterministic-fixture",
    dimension: config.dimension,
    async embedBatch(texts: string[]) {
      return { embeddings: texts.map((text) => deterministicVector(text, config.dimension)) };
    },
  };
}

export function createEmbeddingProvider(config: EmbeddingProviderConfig): EmbeddingProvider {
  const provider = config.provider || "gemini";
  if (provider === "gemini") {
    return createGeminiProvider(config);
  }
  if (provider === "openai") {
    return createOpenAiProvider(config);
  }
  if (provider === "test") {
    return createDeterministicEmbeddingProvider(config);
  }
  throw new Error(`Unsupported embedding provider: ${provider}`);
}

export function vectorToSql(embedding: number[]) {
  return `[${embedding.map((value) => Number(value).toFixed(8)).join(",")}]`;
}