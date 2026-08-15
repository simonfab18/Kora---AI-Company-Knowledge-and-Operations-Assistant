import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { summarizeDailyAiUsage, dailyAiQuotaError } from "@/lib/ai-usage";
import { assertRequiredEnvironment, productionReadinessSummary } from "@/lib/env";
import { logOperationalEvent, sanitizeLogMetadata } from "@/lib/operational-logging";
import { checkDistributedRateLimit, checkRateLimit, rateLimitMessage, resetRateLimitForTests } from "@/lib/rate-limit";

const redisExecMock = vi.fn();

vi.mock("@upstash/redis", () => ({
  Redis: class MockRedis {
    pipeline() {
      const chain = {
        incr: () => chain,
        pexpire: () => chain,
        pttl: () => chain,
        exec: redisExecMock,
      };
      return chain;
    }
  },
}));

describe("production environment validation", () => {
  it("reports missing required production settings", () => {
    const summary = productionReadinessSummary({});

    expect(summary.ready).toBe(false);
    expect(summary.missing.map((check) => check.name)).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(summary.missing.map((check) => check.name)).toContain("AI_PROVIDER_API_KEY");
    expect(summary.warnings.map((check) => check.name)).toContain("DISTRIBUTED_RATE_LIMIT_REDIS");
  });

  it("requires distributed Redis settings in production", () => {
    const summary = productionReadinessSummary({
      APP_ENV: "production",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable",
      NEXT_PUBLIC_SITE_URL: "https://kora.example.com",
      SUPABASE_SERVICE_ROLE_KEY: "service",
      NOTION_TOKEN_ENCRYPTION_KEY: "encryption",
      NOTION_CLIENT_ID: "notion-client",
      NOTION_CLIENT_SECRET: "notion-secret",
      NOTION_REDIRECT_URI: "https://kora.example.com/api/notion/callback",
      GEMINI_API_KEY: "gemini",
    });

    expect(summary.missing.map((check) => check.name)).toContain("DISTRIBUTED_RATE_LIMIT_REDIS");
  });

  it("rejects localhost as the production auth origin", () => {
    const summary = productionReadinessSummary({
      APP_ENV: "production",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    });

    expect(summary.warnings.map((check) => check.name)).toContain("NEXT_PUBLIC_SITE_URL");
  });

  it("throws a focused error for required env groups", () => {
    expect(() => assertRequiredEnvironment(["SUPABASE_SERVICE_ROLE_KEY"], {})).toThrow(
      "Missing required environment variables: SUPABASE_SERVICE_ROLE_KEY",
    );
  });
});

describe("operational logging", () => {
  it("redacts secret-like metadata fields", () => {
    expect(
      sanitizeLogMetadata({
        access_token_ciphertext: "secret",
        nested: { apiKey: "also-secret", safe: "visible" },
      }),
    ).toEqual({
      access_token_ciphertext: "[redacted]",
      nested: { apiKey: "[redacted]", safe: "visible" },
    });
  });

  it("writes structured logs without exposing secret values", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    logOperationalEvent("warn", "test.event", { token: "secret", count: 1 });

    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ event: "test.event", token: "[redacted]", count: 1 }));
  });
});

describe("rate limiting", () => {
  beforeEach(() => {
    resetRateLimitForTests();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("blocks requests over the configured limit", () => {
    expect(checkRateLimit({ key: "user:ask", limit: 2, windowMs: 60_000 }).allowed).toBe(true);
    expect(checkRateLimit({ key: "user:ask", limit: 2, windowMs: 60_000 }).allowed).toBe(true);

    const blocked = checkRateLimit({ key: "user:ask", limit: 2, windowMs: 60_000 });
    expect(blocked.allowed).toBe(false);
    expect(rateLimitMessage(blocked.retryAfterSeconds)).toContain("Too many requests");
  });

  it("uses the Upstash Redis client when configured", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example.com");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
    redisExecMock.mockResolvedValueOnce([2, 1, 45_000]);

    const result = await checkDistributedRateLimit({ key: "user:ask", limit: 2, windowMs: 60_000 });

    expect(result).toEqual({ allowed: true, retryAfterSeconds: 0, remaining: 0, backend: "redis" });
    expect(redisExecMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to memory when Redis is unavailable", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example.com");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
    redisExecMock.mockRejectedValueOnce(new Error("offline"));

    const result = await checkDistributedRateLimit({ key: "fallback:ask", limit: 1, windowMs: 60_000 });

    expect(result.allowed).toBe(true);
    expect(result.backend).toBe("memory");
  });
});

describe("daily AI usage quotas", () => {
  it("summarizes daily user and global remaining quota", () => {
    const usage = summarizeDailyAiUsage({
      userUsed: 12,
      userLimit: 20,
      globalUsed: 40,
      globalLimit: 100,
      now: new Date("2026-07-25T12:00:00.000Z"),
    });

    expect(usage.userRemaining).toBe(8);
    expect(usage.globalRemaining).toBe(60);
    expect(usage.resetAt).toBe("2026-07-26T00:00:00.000Z");
    expect(dailyAiQuotaError(usage)).toBeNull();
  });

  it("blocks when the user daily quota is spent", () => {
    const usage = summarizeDailyAiUsage({ userUsed: 20, userLimit: 20, globalUsed: 20, globalLimit: 100 });

    expect(dailyAiQuotaError(usage)).toContain("20 AI questions for today");
  });

  it("blocks when the global daily quota is spent", () => {
    const usage = summarizeDailyAiUsage({ userUsed: 1, userLimit: 20, globalUsed: 100, globalLimit: 100 });

    expect(dailyAiQuotaError(usage)).toContain("global AI safety limit");
  });
});



