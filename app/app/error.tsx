"use client";

import { DashboardErrorState } from "@/components/dashboard-states";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="ambient-bg min-h-screen bg-ink p-5 text-white md:p-8 lg:ml-[280px] lg:p-10">
      <div className="grain-overlay" />
      <DashboardErrorState
        title="Dashboard could not load"
        description="Try again. If it keeps happening, the active organization session may need to be refreshed."
        action={
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-slate-200"
          >
            Retry
          </button>
        }
      />
    </div>
  );
}