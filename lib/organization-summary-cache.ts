import { Redis } from "@upstash/redis";

const memoryCache = new Map<string, { expiresAt: number; value: unknown }>();
let redisClient: Redis | null | undefined;

function getRedisClient() {
  if (redisClient !== undefined) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_REST_TOKEN;
  redisClient = url && token ? new Redis({ url, token }) : null;
  return redisClient;
}

async function getCacheVersion(organizationId: string) {
  const redis = getRedisClient();
  const key = `org-summary-version:${organizationId}`;
  if (!redis) return "memory";

  const version = await redis.get<string>(key).catch(() => null);
  return version || "1";
}

export async function getCachedOrganizationSummary<T>(input: {
  organizationId: string;
  namespace: string;
  ttlSeconds?: number;
  loader: () => Promise<T>;
}): Promise<T> {
  const ttlSeconds = input.ttlSeconds ?? 30;
  const version = await getCacheVersion(input.organizationId);
  const cacheKey = `org-summary:${input.organizationId}:${input.namespace}:${version}`;
  const redis = getRedisClient();

  if (redis) {
    const cached = await redis.get<T>(cacheKey).catch(() => null);
    if (cached) return cached;

    const value = await input.loader();
    await redis.set(cacheKey, value, { ex: ttlSeconds }).catch(() => undefined);
    return value;
  }

  const cached = memoryCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value as T;

  const value = await input.loader();
  memoryCache.set(cacheKey, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  return value;
}

export async function invalidateOrganizationSummaryCache(organizationId: string) {
  const redis = getRedisClient();
  if (redis) {
    await redis.incr(`org-summary-version:${organizationId}`).catch(() => undefined);
    return;
  }

  for (const key of memoryCache.keys()) {
    if (key.startsWith(`org-summary:${organizationId}:`)) {
      memoryCache.delete(key);
    }
  }
}

export function resetOrganizationSummaryCacheForTests() {
  memoryCache.clear();
  redisClient = undefined;
}