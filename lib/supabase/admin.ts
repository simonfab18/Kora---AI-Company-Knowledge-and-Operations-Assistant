import { assertRequiredEnvironment } from "@/lib/env";
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  assertRequiredEnvironment(["SUPABASE_SERVICE_ROLE_KEY"]);
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

  if (!supabaseUrl) {
    throw new Error("Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}