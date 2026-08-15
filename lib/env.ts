type EnvironmentMap = Record<string, string | undefined>;

export type EnvironmentCheck = {
  name: string;
  status: "ok" | "missing" | "warning";
  message: string;
};

const FRONTEND_REQUIRED = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"] as const;
const SERVER_REQUIRED = ["SUPABASE_SERVICE_ROLE_KEY", "NOTION_TOKEN_ENCRYPTION_KEY", "KORA_INTERNAL_WORKER_SECRET"] as const;
const NOTION_OAUTH_REQUIRED = ["NOTION_CLIENT_ID", "NOTION_CLIENT_SECRET", "NOTION_REDIRECT_URI"] as const;
const AI_PROVIDER_GROUPS = [
  ["GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY"],
  ["OPENAI_API_KEY"],
] as const;

function hasValue(env: EnvironmentMap, name: string) {
  return Boolean(env[name]?.trim());
}

function checkRequired(env: EnvironmentMap, name: string, message: string): EnvironmentCheck {
  return hasValue(env, name) ? { name, status: "ok", message: "Configured." } : { name, status: "missing", message };
}

export function validateProductionEnvironment(env: EnvironmentMap = process.env): EnvironmentCheck[] {
  const appEnv = env.APP_ENV;
  const checks: EnvironmentCheck[] = [
    ...FRONTEND_REQUIRED.map((name) => checkRequired(env, name, "Required for browser Supabase access.")),
    ...SERVER_REQUIRED.map((name) => checkRequired(env, name, "Required for server-side database and encrypted token access.")),
    ...NOTION_OAUTH_REQUIRED.map((name) => checkRequired(env, name, "Required for Notion OAuth connection.")),
  ];

  const hasAnyAiProvider = AI_PROVIDER_GROUPS.some((group) => group.some((name) => hasValue(env, name)));
  checks.push({
    name: "AI_PROVIDER_API_KEY",
    status: hasAnyAiProvider ? "ok" : "missing",
    message: hasAnyAiProvider ? "Configured." : "Set a Gemini or OpenAI API key so Ask AI and indexing can run.",
  });

  const siteUrl = env.NEXT_PUBLIC_SITE_URL;
  const validSiteUrl = appEnv === "production"
    ? siteUrl?.startsWith("https://") && !siteUrl.includes("localhost")
    : siteUrl?.startsWith("https://") || siteUrl?.startsWith("http://localhost");
  checks.push({
    name: "NEXT_PUBLIC_SITE_URL",
    status: validSiteUrl ? "ok" : "warning",
    message: "Use the deployed HTTPS URL in production so auth and Notion redirects match.",
  });

  checks.push({
    name: "APP_ENV",
    status: appEnv === "production" ? "ok" : "warning",
    message: "Set APP_ENV=production in deployed environments.",
  });

  const hasRedisRest = hasValue(env, "UPSTASH_REDIS_REST_URL") && hasValue(env, "UPSTASH_REDIS_REST_TOKEN");
  checks.push({
    name: "DISTRIBUTED_RATE_LIMIT_REDIS",
    status: appEnv === "production" && !hasRedisRest ? "missing" : hasRedisRest ? "ok" : "warning",
    message: hasRedisRest
      ? "Configured."
      : "Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for distributed production rate limits.",
  });

  const hasWorkerBridge = hasValue(env, "NEXT_PUBLIC_API_BASE_URL") && hasValue(env, "NEXT_INTERNAL_BASE_URL") && hasValue(env, "KORA_INTERNAL_WORKER_SECRET");
  checks.push({
    name: "BACKGROUND_SYNC_WORKER_BRIDGE",
    status: appEnv === "production" && !hasWorkerBridge ? "missing" : hasWorkerBridge ? "ok" : "warning",
    message: hasWorkerBridge
      ? "Configured."
      : "Set NEXT_PUBLIC_API_BASE_URL, NEXT_INTERNAL_BASE_URL, and KORA_INTERNAL_WORKER_SECRET for queued Notion sync.",
  });

  checks.push({
    name: "HOSTED_ERROR_MONITORING",
    status: hasValue(env, "SENTRY_DSN") ? "ok" : "warning",
    message: hasValue(env, "SENTRY_DSN") ? "Configured." : "Set SENTRY_DSN in production for hosted exception monitoring.",
  });

  return checks;
}

export function assertRequiredEnvironment(names: readonly string[], env: EnvironmentMap = process.env) {
  const missing = names.filter((name) => !hasValue(env, name));
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

export function productionReadinessSummary(env: EnvironmentMap = process.env) {
  const checks = validateProductionEnvironment(env);
  return {
    checks,
    missing: checks.filter((check) => check.status === "missing"),
    warnings: checks.filter((check) => check.status === "warning"),
    ready: checks.every((check) => check.status === "ok"),
  };
}


