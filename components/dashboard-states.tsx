import { AlertCircle, Loader2, SearchX } from "lucide-react";

type DashboardStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function DashboardEmptyState({ title, description, action }: DashboardStateProps) {
  return (
    <section className="glass-panel rounded-lg p-6 text-center md:p-8">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-white/[0.06] text-blue-300">
        <SearchX size={22} aria-hidden="true" />
      </div>
      <h2 className="mt-5 font-outfit text-2xl font-semibold">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">{description}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </section>
  );
}

export function DashboardLoadingState({ title, description }: DashboardStateProps) {
  return (
    <section className="glass-panel rounded-lg p-6 md:p-8" aria-live="polite">
      <div className="flex items-center gap-3">
        <Loader2 className="animate-spin text-blue-300" size={20} aria-hidden="true" />
        <div>
          <h2 className="font-outfit text-xl font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        </div>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {["one", "two", "three"].map((item) => (
          <div key={item} className="glass-soft h-28 animate-pulse rounded-lg" />
        ))}
      </div>
    </section>
  );
}

export function DashboardErrorState({ title, description, action }: DashboardStateProps) {
  return (
    <section className="glass-panel rounded-lg border-rose-400/25 p-6 text-center md:p-8" role="alert">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-rose-500/12 text-rose-300">
        <AlertCircle size={22} aria-hidden="true" />
      </div>
      <h2 className="mt-5 font-outfit text-2xl font-semibold">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">{description}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </section>
  );
}