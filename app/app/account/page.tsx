import { updateAccountPreferencesAction } from "@/app/app/utility-actions";
import { AppShell } from "@/components/app-shell";
import { AccountPreferencesForm } from "@/components/utility-forms";
import { requireActiveOrganization } from "@/lib/authorization";
import { createAdminClient } from "@/lib/supabase/admin";
import { ShieldCheck } from "lucide-react";

type AccountProfile = {
  appearance_preference: string | null;
  notification_preferences: { sync?: boolean; members?: boolean; gaps?: boolean } | null;
};

export default async function AccountPage() {
  const { user } = await requireActiveOrganization();
  const supabase = createAdminClient();
  const { data } = await supabase.from("profiles").select("appearance_preference, notification_preferences").eq("id", user.id).maybeSingle();
  const profile = data as AccountProfile | null;

  return (
    <AppShell title="Account Settings" description="Review account security, authentication, sessions, and personal preferences.">
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="glass-panel rounded-lg p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Account</p>
          <h2 className="mt-3 font-outfit text-2xl font-semibold">Security overview</h2>
          <div className="mt-5 grid gap-3 text-sm text-slate-300">
            <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4">Email address: <span className="font-semibold text-white">{user.email}</span></div>
            <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4">Password changes are handled through the reset-password flow.</div>
            <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4">Active sessions are managed by Supabase Auth.</div>
          </div>
          <AccountPreferencesForm action={updateAccountPreferencesAction} appearancePreference={profile?.appearance_preference ?? "dark"} notificationPreferences={profile?.notification_preferences ?? { sync: true, members: true, gaps: true }} />
        </section>
        <section className="glass-panel rounded-lg p-6">
          <ShieldCheck className="text-blue-200" size={24} aria-hidden="true" />
          <h2 className="mt-4 font-outfit text-2xl font-semibold">Account deletion</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">Account deletion is intentionally not self-serve in this portfolio build. Organization deletion is available to owners from Settings.</p>
        </section>
      </div>
    </AppShell>
  );
}
