import { AppShell } from "@/components/app-shell";
import { loadDailyAiUsage } from "@/lib/ai-usage";
import { requireActiveOrganization } from "@/lib/authorization";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "AI usage" };

export default async function UsagePage() {
  const { user, membership } = await requireActiveOrganization();
  const supabase = createAdminClient();
  const organizationId = membership.organization.id;
  const [dailyUsage, { count: answersGenerated }, { count: documentsIndexed }, { count: chunksCreated }, { count: activeMembers }] = await Promise.all([
    loadDailyAiUsage(organizationId, user.id),
    supabase.from("messages").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("role", "assistant"),
    supabase.from("documents").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("sync_status", "indexed"),
    supabase.from("document_chunks").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    supabase.from("organization_members").select("user_id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "active"),
  ]);

  const metrics = [
    ["Questions today", `${dailyUsage.userUsed} / ${dailyUsage.userLimit}`],
    ["Global AI today", `${dailyUsage.globalUsed} / ${dailyUsage.globalLimit}`],
    ["Answers generated", String(answersGenerated ?? 0)],
    ["Documents indexed", `${documentsIndexed ?? 0} / 100`],
    ["Embedding chunks", String(chunksCreated ?? 0)],
    ["Active users", `${activeMembers ?? 0} / 10`],
  ];

  return (
    <AppShell title="AI Usage" description="Monitor demonstration AI usage for this Portfolio Free workspace.">
      <section className="glass-panel rounded-lg p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Usage this period</p>
        <h2 className="mt-3 font-outfit text-3xl font-semibold">Portfolio Free monitoring</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Usage is informational only. It helps you see activity and protect the free AI quota, but it never creates charges.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {metrics.map(([label, value]) => (
            <div key={label} className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
              <p className="mt-3 font-mono text-2xl font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-lg border border-blue-300/20 bg-blue-400/10 p-4 text-sm leading-6 text-blue-100">
          This workspace uses the Portfolio Free plan. Usage is shown for demonstration and monitoring only. No charges will be made.
        </div>
      </section>
    </AppShell>
  );
}
