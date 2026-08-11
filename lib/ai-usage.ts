import { createAdminClient } from "@/lib/supabase/admin";

function positiveIntegerEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

export const DAILY_USER_AI_QUESTION_LIMIT = positiveIntegerEnv("KORA_DAILY_USER_AI_QUESTION_LIMIT", 20);
export const DAILY_GLOBAL_AI_QUESTION_LIMIT = positiveIntegerEnv("KORA_DAILY_GLOBAL_AI_QUESTION_LIMIT", 100);

export type DailyAiUsage = {
  userUsed: number;
  userLimit: number;
  userRemaining: number;
  globalUsed: number;
  globalLimit: number;
  globalRemaining: number;
  resetAt: string;
};
export type AiQuotaReservation = DailyAiUsage & {
  allowed: boolean;
  reservationId: string | null;
  reason: "user_limit" | "global_limit" | "released" | null;
};

function startOfUtcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function nextUtcDay(date = new Date()) {
  const start = startOfUtcDay(date);
  start.setUTCDate(start.getUTCDate() + 1);
  return start;
}

export function summarizeDailyAiUsage({
  userUsed,
  globalUsed,
  userLimit = DAILY_USER_AI_QUESTION_LIMIT,
  globalLimit = DAILY_GLOBAL_AI_QUESTION_LIMIT,
  now = new Date(),
}: {
  userUsed: number;
  globalUsed: number;
  userLimit?: number;
  globalLimit?: number;
  now?: Date;
}): DailyAiUsage {
  return {
    userUsed,
    userLimit,
    userRemaining: Math.max(userLimit - userUsed, 0),
    globalUsed,
    globalLimit,
    globalRemaining: Math.max(globalLimit - globalUsed, 0),
    resetAt: nextUtcDay(now).toISOString(),
  };
}

export async function loadDailyAiUsage(organizationId: string, userId: string): Promise<DailyAiUsage> {
  const supabase = createAdminClient();
  const today = startOfUtcDay().toISOString();

  const currentDate = today.slice(0, 10);
  const [{ count: userUsed }, { count: globalUsed }, { count: userReserved }, { count: globalReserved }] = await Promise.all([
    supabase
      .from("usage_events")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .eq("event_type", "chat")
      .gte("created_at", today),
    supabase
      .from("usage_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "chat")
      .gte("created_at", today),
    supabase
      .from("ai_quota_reservations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("usage_date", currentDate)
      .eq("status", "reserved"),
    supabase
      .from("ai_quota_reservations")
      .select("id", { count: "exact", head: true })
      .eq("usage_date", currentDate)
      .eq("status", "reserved"),
  ]);

  return summarizeDailyAiUsage({
    userUsed: (userUsed ?? 0) + (userReserved ?? 0),
    globalUsed: (globalUsed ?? 0) + (globalReserved ?? 0),
  });
}

export function dailyAiQuotaError(usage: DailyAiUsage) {
  if (usage.userRemaining <= 0) {
    return `You have used your ${usage.userLimit} AI questions for today. Your quota resets at ${new Date(usage.resetAt).toLocaleString()}.`;
  }

  if (usage.globalRemaining <= 0) {
    return `Kora has reached the global AI safety limit for today. The quota resets at ${new Date(usage.resetAt).toLocaleString()}.`;
  }

  return null;
}
function normalizeQuotaReservation(row: {
  allowed?: boolean | null;
  reservation_id?: string | null;
  reason?: string | null;
  user_used?: number | null;
  user_limit?: number | null;
  user_remaining?: number | null;
  global_used?: number | null;
  global_limit?: number | null;
  global_remaining?: number | null;
  reset_at?: string | null;
}): AiQuotaReservation {
  return {
    allowed: row.allowed === true,
    reservationId: row.reservation_id ?? null,
    reason: row.reason === "user_limit" || row.reason === "global_limit" || row.reason === "released" ? row.reason : null,
    userUsed: row.user_used ?? 0,
    userLimit: row.user_limit ?? DAILY_USER_AI_QUESTION_LIMIT,
    userRemaining: row.user_remaining ?? 0,
    globalUsed: row.global_used ?? 0,
    globalLimit: row.global_limit ?? DAILY_GLOBAL_AI_QUESTION_LIMIT,
    globalRemaining: row.global_remaining ?? 0,
    resetAt: row.reset_at ?? nextUtcDay().toISOString(),
  };
}

export async function reserveDailyAiQuota({
  organizationId,
  userId,
  idempotencyKey,
}: {
  organizationId: string;
  userId: string;
  idempotencyKey: string;
}): Promise<AiQuotaReservation> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("reserve_daily_ai_quota", {
    p_organization_id: organizationId,
    p_user_id: userId,
    p_idempotency_key: idempotencyKey,
    p_quantity: 1,
    p_user_limit: DAILY_USER_AI_QUESTION_LIMIT,
    p_global_limit: DAILY_GLOBAL_AI_QUESTION_LIMIT,
  });

  if (error) {
    throw error;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new Error("AI quota reservation did not return a result.");
  }

  return normalizeQuotaReservation(row);
}

export async function commitDailyAiQuotaReservation(input: {
  reservationId: string;
  provider: string | null;
  model: string | null;
  metadata: Record<string, unknown>;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("commit_ai_quota_reservation", {
    p_reservation_id: input.reservationId,
    p_provider: input.provider,
    p_model: input.model,
    p_metadata: input.metadata,
  });

  if (error || data !== true) {
    throw error ?? new Error("AI quota reservation could not be committed.");
  }
}

export async function releaseDailyAiQuotaReservation(reservationId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.rpc("release_ai_quota_reservation", {
    p_reservation_id: reservationId,
  });

  if (error) {
    throw error;
  }
}

