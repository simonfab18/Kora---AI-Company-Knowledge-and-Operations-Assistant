"use server";

import { syncNotionNowAction } from "@/app/app/sync-actions";
import type { ActionState } from "@/lib/action-state";
import { getCurrentUser, getPrimaryOrganization, normalizeSlug } from "@/lib/auth";
import { nextStepFor, safeStepForRole, type OnboardingStep } from "@/lib/onboarding";
import { checkDistributedRateLimit, rateLimitMessage } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type DatabaseError = {
  code?: string;
  message: string;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getAllStrings(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim());
}

function databaseErrorMessage(error: DatabaseError, fallback: string) {
  if (error.code === "23505") {
    return "That workspace URL is already used. Choose a different workspace slug.";
  }

  if (["42P01", "42703", "PGRST204", "PGRST205"].includes(error.code ?? "")) {
    return "Onboarding storage is not ready. Run the latest onboarding migration, then try again.";
  }

  return `${fallback} ${error.message}`;
}

function validWebsite(value: string) {
  if (!value) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function requireOnboardingContext() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await getPrimaryOrganization(user.id);
  if (!membership) redirect("/setup/organization");

  return { user, membership };
}

async function saveProgress(input: {
  organizationId: string;
  userId: string;
  completedStep: OnboardingStep;
  nextStep: OnboardingStep | null;
  skipped?: boolean;
  complete?: boolean;
}): Promise<string | null> {
  const supabase = createAdminClient();
  const { data: existing, error: readError } = await supabase
    .from("onboarding_progress")
    .select("completed_steps, skipped_steps")
    .eq("organization_id", input.organizationId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (readError) {
    return databaseErrorMessage(readError, "Onboarding progress could not be read.");
  }

  const completedSteps = new Set<string>((existing?.completed_steps as string[] | null) ?? []);
  const skippedSteps = new Set<string>((existing?.skipped_steps as string[] | null) ?? []);
  completedSteps.add(input.completedStep);

  if (input.skipped) {
    skippedSteps.add(input.completedStep);
  } else {
    skippedSteps.delete(input.completedStep);
  }

  const { error: saveError } = await supabase.from("onboarding_progress").upsert({
    organization_id: input.organizationId,
    user_id: input.userId,
    current_step: input.complete ? "completed" : input.nextStep ?? "first-question",
    completed_steps: [...completedSteps],
    skipped_steps: [...skippedSteps],
    completed_at: input.complete ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  });

  return saveError
    ? databaseErrorMessage(saveError, "Onboarding progress could not be saved.")
    : null;
}

async function completeStep(
  step: OnboardingStep,
  options: { skipped?: boolean; complete?: boolean } = {},
): Promise<ActionState> {
  const { user, membership } = await requireOnboardingContext();
  const next = options.complete ? null : nextStepFor(membership.role, step);
  const progressError = await saveProgress({
    organizationId: membership.organization.id,
    userId: user.id,
    completedStep: step,
    nextStep: next,
    skipped: options.skipped,
    complete: options.complete,
  });

  if (progressError) {
    return { error: progressError };
  }

  if (options.complete) {
    const supabase = createAdminClient();
    const completedAt = new Date().toISOString();
    const [{ error: organizationError }, { error: profileError }] = await Promise.all([
      supabase
        .from("organizations")
        .update({ onboarding_status: "completed", onboarding_completed_at: completedAt })
        .eq("id", membership.organization.id),
      supabase
        .from("profiles")
        .update({ onboarding_completed_at: completedAt })
        .eq("id", user.id),
    ]);

    if (organizationError) {
      return { error: databaseErrorMessage(organizationError, "Organization onboarding could not be completed.") };
    }

    if (profileError) {
      return { error: databaseErrorMessage(profileError, "Your onboarding profile could not be completed.") };
    }

    revalidatePath("/", "layout");
    redirect("/app");
  }

  revalidatePath("/", "layout");
  redirect(`/onboarding/${next ?? "first-question"}`);
}

export async function continueOnboardingAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { membership } = await requireOnboardingContext();
  const step = safeStepForRole(membership.role, getString(formData, "step"));
  return completeStep(step);
}

export async function skipOnboardingStepAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { membership } = await requireOnboardingContext();
  const step = safeStepForRole(membership.role, getString(formData, "step"));
  return completeStep(step, { skipped: true });
}

export async function saveOrganizationOnboardingAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user, membership } = await requireOnboardingContext();

  if (membership.role !== "owner" && membership.role !== "admin") {
    return { error: "Only owners and admins can update the company profile." };
  }

  const rateLimit = await checkDistributedRateLimit({
    key: `onboarding-org:${membership.organization.id}:${user.id}`,
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return { error: rateLimitMessage(rateLimit.retryAfterSeconds) };
  }

  const name = getString(formData, "name");
  const slug = normalizeSlug(getString(formData, "slug") || name);
  const industry = getString(formData, "industry");
  const companySize = getString(formData, "companySize");
  const website = getString(formData, "website");

  if (name.length < 2 || name.length > 100) {
    return { error: "Enter an organization name between 2 and 100 characters." };
  }

  if (slug.length < 2 || slug.length > 72) {
    return { error: "Use a workspace slug between 2 and 72 letters, numbers, or hyphens." };
  }

  if (!validWebsite(website)) {
    return { error: "Enter a complete website URL beginning with http:// or https://." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("organizations")
    .update({
      name,
      slug,
      industry: industry || null,
      company_size: companySize || null,
      website: website || null,
      onboarding_status: "organization_created",
    })
    .eq("id", membership.organization.id)
    .select("id")
    .single();

  if (error) {
    return { error: databaseErrorMessage(error, "Company profile could not be saved.") };
  }

  return completeStep("organization");
}

export async function saveProfileOnboardingAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user } = await requireOnboardingContext();
  const fullName = getString(formData, "fullName");
  const displayName = getString(formData, "displayName");
  const jobTitle = getString(formData, "jobTitle");
  const department = getString(formData, "department");
  const mainResponsibility = getString(formData, "mainResponsibility");

  if (fullName.length < 2) {
    return { error: "Enter your full name." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    full_name: fullName,
    display_name: displayName || null,
    job_title: jobTitle || null,
    department: department || null,
    main_responsibility: mainResponsibility || null,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return { error: databaseErrorMessage(error, "Profile could not be saved.") };
  }

  return completeStep("profile");
}

export async function saveUseCasesOnboardingAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { membership } = await requireOnboardingContext();

  if (membership.role !== "owner" && membership.role !== "admin") {
    return { error: "Only owners and admins can update company use cases." };
  }

  const useCases = getAllStrings(formData, "useCases");
  const departments = getAllStrings(formData, "departments");

  if (useCases.length === 0) {
    return { error: "Choose at least one use case." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("organization_preferences").upsert({
    organization_id: membership.organization.id,
    primary_use_cases: useCases,
    initial_departments: departments,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return { error: databaseErrorMessage(error, "Use cases could not be saved.") };
  }

  return completeStep("use-cases");
}

export async function saveCompanyContextOnboardingAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { membership } = await requireOnboardingContext();

  if (membership.role !== "owner" && membership.role !== "admin") {
    return { error: "Only owners and admins can update company context." };
  }

  const description = getString(formData, "description");
  const employeeTerm = getString(formData, "employeeTerm") || "Team members";
  const defaultLanguage = getString(formData, "defaultLanguage") || "question_language";

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("organizations")
    .update({
      description: description || null,
      employee_term: employeeTerm,
      default_language: defaultLanguage,
    })
    .eq("id", membership.organization.id)
    .select("id")
    .single();

  if (error) {
    return { error: databaseErrorMessage(error, "Company context could not be saved.") };
  }

  return completeStep("company-context");
}

export async function savePreferencesOnboardingAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { membership } = await requireOnboardingContext();

  if (membership.role !== "owner" && membership.role !== "admin") {
    return { error: "Only owners and admins can update assistant preferences." };
  }

  const answerLength = getString(formData, "answerLength") || "balanced";
  const answerTone = getString(formData, "answerTone") || "friendly";
  const defaultLanguage = getString(formData, "defaultLanguage") || "question_language";

  const supabase = createAdminClient();
  const { error } = await supabase.from("organization_preferences").upsert({
    organization_id: membership.organization.id,
    answer_length: answerLength,
    answer_tone: answerTone,
    default_language: defaultLanguage,
    citations_required: true,
    no_answer_behavior: "clear_gap",
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return { error: databaseErrorMessage(error, "Preferences could not be saved.") };
  }

  return completeStep("preferences");
}

export async function syncOnboardingAction(): Promise<ActionState> {
  return syncNotionNowAction();
}

export async function completeOnboardingAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { membership } = await requireOnboardingContext();
  const step = safeStepForRole(membership.role, getString(formData, "step") || "first-question");
  return completeStep(step, { complete: true });
}
