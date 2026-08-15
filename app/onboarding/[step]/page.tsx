import { inviteMemberAction } from "@/app/app/organization-actions";
import {
  completeOnboardingAction,
  continueOnboardingAction,
  saveCompanyContextOnboardingAction,
  saveOrganizationOnboardingAction,
  savePreferencesOnboardingAction,
  saveProfileOnboardingAction,
  saveUseCasesOnboardingAction,
  skipOnboardingStepAction,
  syncOnboardingAction,
} from "@/app/onboarding/actions";
import { OnboardingForm } from "@/components/onboarding-form";
import { InviteMemberForm } from "@/components/organization-forms";
import { requireActiveOrganization } from "@/lib/authorization";
import type { OnboardingProgress, Organization, OrganizationPreference, Profile } from "@/lib/database.types";
import { onboardingProgressPercent, previousStepFor, safeStepForRole, stepLabels, stepsForRole, suggestedQuestions, type OnboardingStep } from "@/lib/onboarding";
import { createAdminClient } from "@/lib/supabase/admin";
import { ArrowLeft, CheckCircle2, Database, FileText, MessageSquareText, PlugZap, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "Workspace onboarding" };

const inputClass = "mt-2 h-11 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-300";
const textareaClass = "mt-2 min-h-28 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-300";
const selectClass = "mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#111] px-3 text-white outline-none focus:border-blue-300";
const buttonClass = "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-ink transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60";
const quietButtonClass = "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-slate-200 transition hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-60";

const useCaseOptions = [
  "Employees cannot find documentation",
  "New hires ask repeated questions",
  "Information is scattered across Notion",
  "Teams sometimes follow outdated processes",
  "We want an internal AI assistant",
  "We want to identify documentation gaps",
];

const departmentOptions = ["Entire company", "Engineering", "Operations", "Human Resources", "Customer Support", "Sales", "Leadership", "Other"];
const userDepartments = ["Engineering", "Product", "Human Resources", "Operations", "Customer Support", "Sales", "Marketing", "Leadership", "Other"];

type PageProps = {
  params: Promise<{ step: string }>;
};

function HiddenStep({ step }: { step: OnboardingStep }) {
  return <input type="hidden" name="step" value={step} />;
}

function ContinueForm({ step, label = "Continue" }: { step: OnboardingStep; label?: string }) {
  return <OnboardingForm action={continueOnboardingAction} submitLabel={label} pendingLabel="Saving progress..." submitClassName={buttonClass}><HiddenStep step={step} /></OnboardingForm>;
}

function SkipForm({ step }: { step: OnboardingStep }) {
  return <OnboardingForm action={skipOnboardingStepAction} submitLabel="Skip for now" pendingLabel="Skipping..." submitClassName={quietButtonClass}><HiddenStep step={step} /></OnboardingForm>;
}

function CompleteForm({ step, label = "Open workspace" }: { step: OnboardingStep; label?: string }) {
  return <OnboardingForm action={completeOnboardingAction} submitLabel={label} pendingLabel="Opening workspace..." submitClassName={buttonClass}><HiddenStep step={step} /></OnboardingForm>;
}

function checked(value: string, selected: string[]) {
  return selected.includes(value);
}

export default async function OnboardingStepPage({ params }: PageProps) {
  const [{ step: requestedStep }, { user, membership }] = await Promise.all([params, requireActiveOrganization()]);
  const role = membership.role;
  const step = safeStepForRole(role, requestedStep);

  if (step !== requestedStep) redirect(`/onboarding/${step}`);

  const supabase = createAdminClient();
  const organizationId = membership.organization.id;
  const [{ data: organization }, { data: profile }, { data: preferences }, { data: progress }, { data: connection }, { data: documents }, { data: syncJobs }] = await Promise.all([
    supabase.from("organizations").select("*").eq("id", organizationId).maybeSingle(),
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("organization_preferences").select("*").eq("organization_id", organizationId).maybeSingle(),
    supabase.from("onboarding_progress").select("*").eq("organization_id", organizationId).eq("user_id", user.id).maybeSingle(),
    supabase.from("notion_connections").select("id, notion_workspace_name, status, last_synced_at").eq("organization_id", organizationId).neq("status", "disconnected").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("documents").select("id, title, sync_status").eq("organization_id", organizationId).limit(1000),
    supabase.from("sync_jobs").select("id, status, processed_items, failed_items, total_items, error_message, created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(1),
  ]);

  const org = organization as Organization | null;
  const profileRow = profile as Profile | null;
  const pref = preferences as OrganizationPreference | null;
  const progressRow = progress as OnboardingProgress | null;
  const completedSteps = progressRow?.completed_steps ?? [];
  const percent = onboardingProgressPercent(role, completedSteps);
  const steps = stepsForRole(role);
  const previous = previousStepFor(role, step);
  const indexedDocs = ((documents ?? []) as { sync_status: string }[]).filter((document) => document.sync_status === "indexed").length;
  const latestSync = syncJobs?.[0] as { status: string; processed_items: number; failed_items: number; total_items: number; error_message: string | null } | undefined;
  const questions = suggestedQuestions(profileRow?.department, pref?.primary_use_cases ?? []);

  return (
    <main className="min-h-screen bg-ink px-6 py-10 text-white">
      <div className="grain-overlay" />
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Onboarding</p>
            <h1 className="mt-2 font-outfit text-3xl font-semibold">{stepLabels[step]}</h1>
            <p className="mt-2 text-sm text-slate-400">{org?.name ?? membership.organization.name} / {role}</p>
          </div>
          <Link href="/app" className={quietButtonClass}>Continue later</Link>
        </header>

        <section className="glass-panel mb-6 rounded-lg p-4">
          <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            <span>{percent}% complete</span>
            <span>{steps.indexOf(step) + 1} of {steps.length}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-blue-300 transition-all" style={{ width: `${percent}%` }} /></div>
        </section>

        <section className="glass-strong rounded-lg p-6 md:p-8">
          {step === "welcome" ? (
            <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-center">
              <div>
                <Sparkles className="text-blue-200" size={28} aria-hidden="true" />
                <h2 className="mt-5 font-outfit text-4xl font-semibold">Let&apos;s personalize your workspace</h2>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">Kora works best after it understands your company, your role, and where approved Notion knowledge lives. You can leave and resume this setup anytime.</p>
                <div className="mt-6 flex flex-wrap gap-3"><ContinueForm step={step} label="Get started" /><Link href="/app" className={quietButtonClass}>Continue later</Link></div>
              </div>
              <div className="space-y-3">
                {["Personalize workspace", "Connect approved Notion pages", "Ask the first grounded question"].map((item) => <div key={item} className="rounded-lg border border-white/10 bg-white/[0.025] p-4 text-sm text-slate-300"><CheckCircle2 className="mr-2 inline text-emerald-200" size={16} />{item}</div>)}
              </div>
            </div>
          ) : null}

          {step === "organization" ? (
            <OnboardingForm action={saveOrganizationOnboardingAction} className="grid gap-4 md:grid-cols-2" submitLabel="Save company profile" pendingLabel="Saving company profile..." submitClassName={buttonClass} submitContainerClassName="flex gap-3 md:col-span-2">
              <label className="text-sm font-medium text-slate-300">Organization name<input className={inputClass} name="name" defaultValue={org?.name ?? ""} required /></label>
              <label className="text-sm font-medium text-slate-300">Workspace slug<input className={inputClass} name="slug" defaultValue={org?.slug ?? ""} required /></label>
              <label className="text-sm font-medium text-slate-300">Industry<input className={inputClass} name="industry" defaultValue={org?.industry ?? ""} placeholder="Software, retail, healthcare..." /></label>
              <label className="text-sm font-medium text-slate-300">Company size<select className={selectClass} name="companySize" defaultValue={org?.company_size ?? "11-50"}>{["1-10", "11-50", "51-200", "201-1,000", "1,000+"].map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="text-sm font-medium text-slate-300 md:col-span-2">Website<input className={inputClass} name="website" defaultValue={org?.website ?? ""} placeholder="https://company.com" /></label>
            </OnboardingForm>
          ) : null}

          {step === "profile" ? (
            <OnboardingForm action={saveProfileOnboardingAction} className="grid gap-4 md:grid-cols-2" submitLabel="Save profile" pendingLabel="Saving profile..." submitClassName={buttonClass} submitContainerClassName="md:col-span-2">
              <label className="text-sm font-medium text-slate-300">Full name<input className={inputClass} name="fullName" defaultValue={profileRow?.full_name ?? user.user_metadata.full_name ?? ""} required /></label>
              <label className="text-sm font-medium text-slate-300">Display name<input className={inputClass} name="displayName" defaultValue={profileRow?.display_name ?? ""} /></label>
              <label className="text-sm font-medium text-slate-300">Job title<input className={inputClass} name="jobTitle" defaultValue={profileRow?.job_title ?? ""} /></label>
              <label className="text-sm font-medium text-slate-300">Department<select className={selectClass} name="department" defaultValue={profileRow?.department ?? "Operations"}>{userDepartments.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="text-sm font-medium text-slate-300 md:col-span-2">Main responsibility<textarea className={textareaClass} name="mainResponsibility" defaultValue={profileRow?.main_responsibility ?? ""} placeholder="What do you usually help the team with?" /></label>
            </OnboardingForm>
          ) : null}

          {step === "use-cases" ? (
            <OnboardingForm action={saveUseCasesOnboardingAction} className="space-y-6" submitLabel="Save use cases" pendingLabel="Saving use cases..." submitClassName={buttonClass}>
              <div><h2 className="font-outfit text-2xl font-semibold">What problems are you trying to solve?</h2><div className="mt-4 grid gap-3 md:grid-cols-2">{useCaseOptions.map((item) => <label key={item} className="rounded-lg border border-white/10 bg-white/[0.025] p-3 text-sm text-slate-300"><input className="mr-3 accent-blue-300" type="checkbox" name="useCases" value={item} defaultChecked={checked(item, pref?.primary_use_cases ?? [])} />{item}</label>)}</div></div>
              <div><p className="text-sm font-semibold text-slate-300">Which teams will use Kora first?</p><div className="mt-3 grid gap-3 md:grid-cols-2">{departmentOptions.map((item) => <label key={item} className="rounded-lg border border-white/10 bg-white/[0.025] p-3 text-sm text-slate-300"><input className="mr-3 accent-blue-300" type="checkbox" name="departments" value={item} defaultChecked={checked(item, pref?.initial_departments ?? [])} />{item}</label>)}</div></div>
            </OnboardingForm>
          ) : null}

          {step === "company-context" ? (
            <OnboardingForm action={saveCompanyContextOnboardingAction} className="grid gap-4" submitLabel="Save context" pendingLabel="Saving context..." submitClassName={buttonClass}>
              <label className="text-sm font-medium text-slate-300">Short company description<textarea className={textareaClass} name="description" defaultValue={org?.description ?? ""} placeholder="What does the company do, and who uses the knowledge base?" /></label>
              <div className="grid gap-4 md:grid-cols-2"><label className="text-sm font-medium text-slate-300">Preferred term for people<select className={selectClass} name="employeeTerm" defaultValue={org?.employee_term ?? "Team members"}>{["Employees", "Team members", "Associates", "Consultants", "Partners"].map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-sm font-medium text-slate-300">Default language<select className={selectClass} name="defaultLanguage" defaultValue={org?.default_language ?? "question_language"}><option value="question_language">Use question language</option><option value="english">English</option><option value="filipino">Filipino</option></select></label></div>
            </OnboardingForm>
          ) : null}

          {step === "connect-notion" ? (
            <div>
              <PlugZap className="text-blue-200" size={28} /><h2 className="mt-4 font-outfit text-3xl font-semibold">Connect approved Notion knowledge</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Select only the pages your team approves during Notion authorization. You can adjust access later in Notion and Settings.</p>
              <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.025] p-4"><p className="text-sm text-slate-300">Status: <span className="font-semibold text-white">{connection?.status ?? "not connected"}</span>{connection?.notion_workspace_name ? ` / ${connection.notion_workspace_name}` : ""}</p></div>
              <div className="mt-6 flex flex-wrap gap-3"><a href="/api/notion/authorize?returnTo=/onboarding/sync" className={buttonClass}>Connect Notion</a><SkipForm step={step} /></div>
            </div>
          ) : null}

          {step === "sync" ? (
            <div>
              <Database className="text-blue-200" size={28} /><h2 className="mt-4 font-outfit text-3xl font-semibold">Start initial synchronization</h2><p className="mt-3 text-sm leading-6 text-slate-400">Kora reads approved Notion pages, extracts content, creates chunks, and builds the searchable knowledge base.</p>
              <div className="mt-6 grid gap-3 md:grid-cols-3"><div className="rounded-lg border border-white/10 p-4"><p className="font-mono text-2xl">{indexedDocs}</p><p className="text-xs text-slate-500">Indexed pages</p></div><div className="rounded-lg border border-white/10 p-4"><p className="font-mono text-2xl">{latestSync?.status ?? "not started"}</p><p className="text-xs text-slate-500">Latest sync</p></div><div className="rounded-lg border border-white/10 p-4"><p className="font-mono text-2xl">{latestSync ? `${latestSync.processed_items}/${latestSync.total_items || latestSync.processed_items + latestSync.failed_items}` : "0/0"}</p><p className="text-xs text-slate-500">Processed</p></div></div>
              {latestSync?.status === "failed" && latestSync.error_message ? <p className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100" role="alert">{latestSync.error_message}</p> : null}
              <div className="mt-6 flex flex-wrap gap-3"><OnboardingForm action={syncOnboardingAction} submitLabel="Start sync" pendingLabel="Starting sync..." submitClassName={buttonClass} /><ContinueForm step={step} label="Continue" /></div>
            </div>
          ) : null}

          {step === "preferences" ? (
            <OnboardingForm action={savePreferencesOnboardingAction} className="grid gap-4 md:grid-cols-3" submitLabel="Save preferences" pendingLabel="Saving preferences..." submitClassName={buttonClass} submitContainerClassName="md:col-span-3">
              <label className="text-sm font-medium text-slate-300">Answer length<select className={selectClass} name="answerLength" defaultValue={pref?.answer_length ?? "balanced"}><option value="concise">Concise</option><option value="balanced">Balanced</option><option value="detailed">Detailed</option></select></label>
              <label className="text-sm font-medium text-slate-300">Tone<select className={selectClass} name="answerTone" defaultValue={pref?.answer_tone ?? "friendly"}><option value="professional">Professional</option><option value="friendly">Friendly</option><option value="direct">Direct</option><option value="technical">Technical</option></select></label>
              <label className="text-sm font-medium text-slate-300">Language<select className={selectClass} name="defaultLanguage" defaultValue={pref?.default_language ?? "question_language"}><option value="question_language">Use question language</option><option value="english">English</option><option value="filipino">Filipino</option></select></label>
              <p className="rounded-lg border border-white/10 bg-white/[0.025] p-4 text-sm leading-6 text-slate-400 md:col-span-3">Citations stay required for grounded company answers. Security, source grounding, and organization isolation cannot be disabled.</p>
            </OnboardingForm>
          ) : null}

          {step === "invite-team" ? (<div><Users className="text-blue-200" size={28} /><h2 className="mt-4 font-outfit text-3xl font-semibold">Invite your first teammates</h2><p className="mt-3 text-sm leading-6 text-slate-400">This is optional. Invite admins only when they need operational control.</p><div className="mt-6"><InviteMemberForm action={inviteMemberAction} /></div><div className="mt-4"><ContinueForm step={step} label="Continue to review" /></div></div>) : null}

          {step === "review" ? (<div><FileText className="text-blue-200" size={28} /><h2 className="mt-4 font-outfit text-3xl font-semibold">Your workspace is ready</h2><div className="mt-6 grid gap-3 md:grid-cols-2">{[["Organization", org?.name], ["Connected source", connection?.status === "connected" ? connection.notion_workspace_name : "Notion not connected"], ["Indexed pages", String(indexedDocs)], ["Answer style", `${pref?.answer_length ?? "balanced"} / ${pref?.answer_tone ?? "friendly"}`]].map(([label, value]) => <div key={label} className="rounded-lg border border-white/10 bg-white/[0.025] p-4"><p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p><p className="mt-2 font-semibold text-white">{value}</p></div>)}</div><div className="mt-6 flex gap-3"><ContinueForm step={step} label="Ask first question" /><Link href="/app/settings" className={quietButtonClass}>Change settings</Link></div></div>) : null}

          {step === "first-question" ? (<div><MessageSquareText className="text-blue-200" size={28} /><h2 className="mt-4 font-outfit text-3xl font-semibold">Try your first grounded question</h2><p className="mt-3 text-sm leading-6 text-slate-400">Start with a question likely to exist in your approved workspace knowledge. Kora will answer with citations when sources support it.</p><div className="mt-6 grid gap-3 md:grid-cols-3">{questions.map((question) => <Link key={question} href={`/app/ask?q=${encodeURIComponent(question)}`} className="rounded-lg border border-white/10 bg-white/[0.025] p-4 text-sm font-semibold text-white transition hover:border-blue-300/50">{question}</Link>)}</div><div className="mt-6 flex gap-3"><Link href="/app/ask" className={buttonClass}>Open Ask AI</Link><CompleteForm step={step} label="Finish onboarding" /></div></div>) : null}
        </section>

        {previous ? <Link href={`/onboarding/${previous}`} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white"><ArrowLeft size={15} />Back</Link> : null}
      </div>
    </main>
  );
}
