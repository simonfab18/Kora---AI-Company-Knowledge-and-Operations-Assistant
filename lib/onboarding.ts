import type { OrganizationRole } from "@/lib/database.types";

export type OnboardingStep =
  | "welcome"
  | "organization"
  | "profile"
  | "use-cases"
  | "company-context"
  | "connect-notion"
  | "sync"
  | "preferences"
  | "invite-team"
  | "review"
  | "first-question";

export const ownerOnboardingSteps: OnboardingStep[] = [
  "welcome",
  "organization",
  "profile",
  "use-cases",
  "company-context",
  "connect-notion",
  "sync",
  "preferences",
  "invite-team",
  "review",
  "first-question",
];

export const adminOnboardingSteps: OnboardingStep[] = ["welcome", "profile", "review", "first-question"];
export const memberOnboardingSteps: OnboardingStep[] = ["welcome", "profile", "first-question"];

export const stepLabels: Record<OnboardingStep, string> = {
  welcome: "Welcome",
  organization: "Company profile",
  profile: "Your profile",
  "use-cases": "Use cases",
  "company-context": "Company context",
  "connect-notion": "Connect Notion",
  sync: "Initial sync",
  preferences: "Assistant preferences",
  "invite-team": "Invite team",
  review: "Review setup",
  "first-question": "First question",
};

export function stepsForRole(role: OrganizationRole) {
  if (role === "owner") return ownerOnboardingSteps;
  if (role === "admin") return adminOnboardingSteps;
  return memberOnboardingSteps;
}

export function isOnboardingStep(value: string): value is OnboardingStep {
  return value in stepLabels;
}

export function nextStepFor(role: OrganizationRole, step: OnboardingStep) {
  const steps = stepsForRole(role);
  const index = steps.indexOf(step);
  return index >= 0 ? steps[index + 1] ?? null : steps[0];
}

export function previousStepFor(role: OrganizationRole, step: OnboardingStep) {
  const steps = stepsForRole(role);
  const index = steps.indexOf(step);
  return index > 0 ? steps[index - 1] : null;
}

export function safeStepForRole(role: OrganizationRole, requested: string | undefined | null) {
  const steps = stepsForRole(role);
  if (requested && isOnboardingStep(requested) && steps.includes(requested)) return requested;
  return steps[0];
}

export function onboardingProgressPercent(role: OrganizationRole, completedSteps: string[]) {
  const steps = stepsForRole(role);
  const completed = new Set(completedSteps);
  const count = steps.filter((step) => completed.has(step)).length;
  return Math.round((count / steps.length) * 100);
}

export function suggestedQuestions(department: string | null | undefined, useCases: string[]) {
  const normalizedDepartment = (department ?? "").toLowerCase();
  if (normalizedDepartment.includes("human") || normalizedDepartment === "hr") {
    return ["What is our leave policy?", "How does employee onboarding work?", "What benefits are available?"];
  }
  if (normalizedDepartment.includes("engineer") || normalizedDepartment.includes("product")) {
    return ["Where is the deployment procedure?", "What is our incident response process?", "How should I document a product change?"];
  }
  if (normalizedDepartment.includes("support") || normalizedDepartment.includes("sales")) {
    return ["How should I answer common customer questions?", "What is the escalation process?", "Which product or service details should I confirm first?"];
  }
  if (useCases.some((useCase) => useCase.toLowerCase().includes("documentation gaps"))) {
    return ["Which topics are missing documentation?", "What questions are employees asking most?", "Which sources are cited most often?"];
  }
  return ["What policies should I know first?", "How do I find the right company process?", "What documents were synced most recently?"];
}