import { submitProblemReportAction } from "@/app/app/utility-actions";
import { ProblemReportForm } from "@/components/utility-forms";
import Link from "next/link";

export const metadata = { title: "Report a problem" };

export default async function ReportProblemPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams;
  const returnToApp = from === "app";

  return (
    <main className="ambient-bg min-h-screen bg-ink px-5 py-8 text-white md:px-10">
      <div className="grain-overlay" />
      <section className="relative z-10 mx-auto max-w-3xl rounded-lg border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-200">Report a problem</p>
        <h1 className="mt-3 font-outfit text-4xl font-semibold">Tell us what broke</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">Problem reports are now saved for review. Do not include secrets, access tokens, full document contents, or personal data in diagnostic submissions.</p>
        <ProblemReportForm action={submitProblemReportAction} />
        <Link href={returnToApp ? "/app" : "/"} className="mt-6 inline-block text-sm font-semibold text-slate-300 hover:text-white">
          {returnToApp ? "Back to app" : "Back to home"}
        </Link>
      </section>
    </main>
  );
}
