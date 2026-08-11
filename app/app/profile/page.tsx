import { updateProfileAction } from "@/app/app/utility-actions";
import { AppShell } from "@/components/app-shell";
import { ProfileSettingsForm } from "@/components/utility-forms";
import { requireActiveOrganization } from "@/lib/authorization";
import { createAdminClient } from "@/lib/supabase/admin";

type ProfileSettings = {
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  job_title: string | null;
  department: string | null;
  preferred_language: string | null;
};

export default async function ProfilePage() {
  const { user } = await requireActiveOrganization();
  const supabase = createAdminClient();
  const { data } = await supabase.from("profiles").select("full_name, display_name, avatar_url, job_title, department, preferred_language").eq("id", user.id).maybeSingle();
  const profile = data as ProfileSettings | null;
  const fullName = profile?.full_name || (typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : "");
  const label = profile?.display_name || fullName || user.email || "User";

  return (
    <AppShell title="Profile" description="Manage how your name and identity appear inside Kora.">
      <section className="glass-panel rounded-lg p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Personal profile</p>
        <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
          <div className="flex h-32 w-32 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-slate-500 to-slate-900 font-outfit text-3xl font-semibold">
            {label.slice(0, 2).toUpperCase()}
          </div>
          <ProfileSettingsForm
            action={updateProfileAction}
            fullName={fullName}
            displayName={profile?.display_name ?? ""}
            jobTitle={profile?.job_title ?? ""}
            department={profile?.department ?? ""}
            preferredLanguage={profile?.preferred_language ?? "English"}
          />
        </div>
      </section>
    </AppShell>
  );
}
