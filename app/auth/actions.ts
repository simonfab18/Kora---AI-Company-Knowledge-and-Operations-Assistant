"use server";

import { createClient } from "@/lib/supabase/server";
import { normalizeSlug } from "@/lib/auth";
import { getAuthCallbackUrl, getSafeAuthRedirect } from "@/lib/auth-redirect";
import type { ActionState } from "@/lib/action-state";
import { checkDistributedRateLimit, rateLimitMessage } from "@/lib/rate-limit";
import { checkPasswordCompromise, passwordCompromiseMessage } from "@/lib/password-security";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}


function getOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

function passwordStrengthError(password: string, email: string, firstName = "", lastName = "") {
  const lowerPassword = password.toLowerCase();
  const blockedTerms = [email.split("@")[0], firstName, lastName].map((value) => value.toLowerCase()).filter((value) => value.length >= 3);

  if (password.length < 8) return "Use at least 8 characters for a strong password.";
  if (!/[a-z]/.test(password)) return "Add at least one lowercase letter.";
  if (!/[A-Z]/.test(password)) return "Add at least one uppercase letter.";
  if (!/[0-9]/.test(password)) return "Add at least one number.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Add at least one symbol.";
  if (blockedTerms.some((term) => lowerPassword.includes(term))) return "Do not include your name or email in the password.";
  return null;
}

async function requestFingerprint() {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || headerStore.get("x-real-ip") || headerStore.get("user-agent") || "unknown-request";
}

async function checkPublicRateLimit(scope: string, identity: string, limit: number, windowMs: number) {
  const fingerprint = await requestFingerprint();
  const rateLimit = await checkDistributedRateLimit({
    key: `${scope}:${identity.toLowerCase()}:${fingerprint}`,
    limit,
    windowMs,
  });

  return rateLimit.allowed ? null : rateLimitMessage(rateLimit.retryAfterSeconds);
}

async function emailAlreadyRegistered(email: string) {
  try {
    const admin = createAdminClient();
    for (let page = 1; page <= 10; page += 1) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) return false;
      if (data.users.some((user) => user.email?.toLowerCase() === email)) return true;
      if (data.users.length < 1000) return false;
    }
  } catch {
    return false;
  }

  return false;
}

export async function signInAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = getString(formData, "email").toLowerCase();
  const password = getString(formData, "password");
  const next = getSafeAuthRedirect(getString(formData, "next") || "/app");

  if (!email || !password) {
    return { error: "Enter your company email and password." };
  }

  const rateLimitError = await checkPublicRateLimit("auth-login", email, 10, 10 * 60 * 1000);
  if (rateLimitError) {
    return { error: rateLimitError };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Email or password is incorrect." };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signInWithGoogleAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const mode = getString(formData, "mode") || "login";
  const next = getSafeAuthRedirect(getString(formData, "next") || "/app");
  const rateLimitError = await checkPublicRateLimit(`auth-google-${mode}`, "google", 10, 10 * 60 * 1000);

  if (rateLimitError) {
    return { error: rateLimitError };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getAuthCallbackUrl(getOrigin(), next),
    },
  });

  if (error || !data.url) {
    return { error: "Google sign-in could not be started. Check Supabase Google provider settings." };
  }

  redirect(data.url);
}

export async function signUpAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const firstName = getString(formData, "firstName");
  const lastName = getString(formData, "lastName");
  const email = getString(formData, "email").toLowerCase();
  const password = getString(formData, "password");
  const confirmPassword = getString(formData, "confirmPassword");
  const confirmAccount = getString(formData, "confirmAccount");
  const next = getSafeAuthRedirect(getString(formData, "next") || "/setup/organization");

  if (!firstName || !lastName || !email) {
    return { error: "Enter your first name, last name, and company email." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const strengthError = passwordStrengthError(password, email, firstName, lastName);
  if (strengthError) {
    return { error: strengthError };
  }

  if (confirmAccount !== "on") {
    return { error: "Confirm that your account details are correct." };
  }

  const rateLimitError = await checkPublicRateLimit("auth-signup", email, 5, 30 * 60 * 1000);
  if (rateLimitError) {
    return { error: rateLimitError };
  }

  if (await emailAlreadyRegistered(email)) {
    return { error: "An account already exists with this company email. Sign in instead." };
  }

  const compromiseError = passwordCompromiseMessage(await checkPasswordCompromise(password));
  if (compromiseError) {
    return { error: compromiseError };
  }

  const fullName = `${firstName} ${lastName}`.trim();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, first_name: firstName, last_name: lastName },
      emailRedirectTo: getAuthCallbackUrl(getOrigin(), next),
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user?.identities && data.user.identities.length === 0) {
    return { error: "An account already exists with this company email. Sign in instead." };
  }

  if (data.session) {
    revalidatePath("/", "layout");
    redirect(next);
  }

  return {
    message: next.startsWith("/invitations/")
      ? "Account created. Confirm your email, then continue the invitation from the confirmation link."
      : "Account created. Confirm your email, then continue workspace setup from the confirmation link.",
  };
}

export async function requestPasswordResetAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = getString(formData, "email").toLowerCase();

  if (!email) {
    return { error: "Enter the email for your Kora account." };
  }

  const rateLimitError = await checkPublicRateLimit("auth-password-reset", email, 3, 30 * 60 * 1000);
  if (rateLimitError) {
    return { error: rateLimitError };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getAuthCallbackUrl(getOrigin(), "/reset-password/update"),
  });

  if (error) {
    return { error: error.message };
  }

  return { message: "If that email is registered, a password reset link has been sent." };
}

export async function updatePasswordAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const password = getString(formData, "password");
  const confirmPassword = getString(formData, "confirmPassword");

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const strengthError = passwordStrengthError(password, "");
  if (strengthError) {
    return { error: strengthError };
  }

  const rateLimitError = await checkPublicRateLimit("auth-password-update", "active-session", 5, 30 * 60 * 1000);
  if (rateLimitError) {
    return { error: rateLimitError };
  }

  const compromiseError = passwordCompromiseMessage(await checkPasswordCompromise(password));
  if (compromiseError) {
    return { error: compromiseError };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/app");
}
export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function createOrganizationAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizationName = getString(formData, "organizationName");

  if (organizationName.length < 2) {
    return { error: "Enter an organization name with at least 2 characters." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Sign in before creating an organization." };
  }

  const rateLimit = await checkDistributedRateLimit({
    key: `organization-create:${user.id}`,
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return { error: rateLimitMessage(rateLimit.retryAfterSeconds) };
  }

  const admin = createAdminClient();
  const [
    { count: ownedOrganizationCount, error: ownedCountError },
    { count: activeMembershipCount, error: membershipCountError },
  ] = await Promise.all([
    admin
      .from("organizations")
      .select("id", { count: "exact", head: true })
      .eq("owner_user_id", user.id),
    admin
      .from("organization_members")
      .select("organization_id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "active"),
  ]);

  if (ownedCountError || membershipCountError) {
    return { error: "Could not verify organization creation permissions." };
  }

  if ((activeMembershipCount ?? 0) > 0 && (ownedOrganizationCount ?? 0) === 0) {
    return { error: "Only organization owners can create another organization." };
  }

  if ((ownedOrganizationCount ?? 0) >= 3) {
    return { error: "Owners can create up to 3 active organizations. Delete an organization before creating another one." };
  }

  const profileName =
    typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : null;

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    full_name: profileName,
  });

  if (profileError) {
    return { error: profileError.message };
  }

  const baseSlug = normalizeSlug(organizationName);
  const slug = baseSlug || `org-${user.id.slice(0, 8)}`;
  const { data: organizationId, error: rpcError } = await supabase.rpc("create_organization", {
    p_name: organizationName,
    p_slug: slug,
  });

  if (rpcError) {
    return { error: rpcError.message };
  }

  if (typeof organizationId === "string") {
    const cookieStore = await cookies();
    cookieStore.set("kora_active_organization_id", organizationId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  revalidatePath("/", "layout");
  redirect("/onboarding/welcome");
}
