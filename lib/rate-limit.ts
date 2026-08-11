import { Redis } from "@upstash/redis";

type RateLimitInput = {
  key: string;
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
  remaining: number;
  backend: "redis" | "memory";
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitEntry>();
let redisClient: Redis | null | undefined;

function getRedisClient() {
  if (redisClient !== undefined) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_REST_TOKEN;
  redisClient = url && token ? new Redis({ url, token }) : null;
  return redisClient;
}

export function checkRateLimit({ key, limit, windowMs }: RateLimitInput): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0, remaining: Math.max(limit - 1, 0), backend: "memory" };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(Math.ceil((existing.resetAt - now) / 1000), 1),
      remaining: 0,
      backend: "memory",
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    retryAfterSeconds: 0,
    remaining: Math.max(limit - existing.count, 0),
    backend: "memory",
  };
}

export async function checkDistributedRateLimit(input: RateLimitInput): Promise<RateLimitResult> {
  const redis = getRedisClient();
  if (!redis) {
    return checkRateLimit(input);
  }

  try {
    const [count, , ttlMs] = await redis.pipeline().incr(input.key).pexpire(input.key, input.windowMs, "NX").pttl(input.key).exec<[number, number, number]>();
    const retryAfterSeconds = Math.max(Math.ceil((Number.isFinite(ttlMs) ? ttlMs : input.windowMs) / 1000), 1);

    return {
      allowed: count <= input.limit,
      retryAfterSeconds: count <= input.limit ? 0 : retryAfterSeconds,
      remaining: Math.max(input.limit - count, 0),
      backend: "redis",
    };
  } catch {
    return checkRateLimit(input);
  }
}

export function rateLimitMessage(retryAfterSeconds: number) {
  const minutes = Math.max(Math.ceil(retryAfterSeconds / 60), 1);
  return `Too many requests right now. Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}

export function resetRateLimitForTests() {
  buckets.clear();
  redisClient = undefined;
}
