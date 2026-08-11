import { DashboardLoadingState } from "@/components/dashboard-states";

export default function Loading() {
  return (
    <div className="ambient-bg min-h-screen bg-ink p-5 text-white md:p-8 lg:ml-[280px] lg:p-10">
      <div className="grain-overlay" />
      <DashboardLoadingState
        title="Loading workspace"
        description="Preparing the authenticated dashboard shell."
      />
    </div>
  );
}