import { AppShell } from "@/components/app-shell";
import { CreditCard } from "lucide-react";

export default function BillingPage() {
  return (
    <AppShell title="Billing" description="Portfolio Free plan information. No payment method or paid subscription is required.">
      <section className="glass-panel rounded-lg p-6 md:p-8">
        <div className="flex items-start gap-4">
          <CreditCard className="text-blue-200" size={28} aria-hidden="true" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Current plan</p>
            <h2 className="mt-3 font-outfit text-3xl font-semibold">Portfolio Free</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">This project is free to use for demonstration and portfolio purposes. No payment method is required, no charges will be made, and upgrades are not available in this build.</p>
          </div>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[["Monthly price", "$0"], ["Payment method", "Not required"], ["Billing history", "None"], ["Upgrade", "Not available"]].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
              <p className="mt-3 font-mono text-lg font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
