import Link from "next/link";
import { Sparkles } from "lucide-react";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="ambient-bg relative grid min-h-screen place-items-center overflow-hidden bg-ink px-5 py-12 text-white">
      <div className="grain-overlay" />
      <section className="glass-strong relative z-10 grid w-full max-w-5xl overflow-hidden rounded-lg lg:grid-cols-[0.92fr_1.08fr]">
        <div className="border-b border-white/10 p-8 md:p-10 lg:border-b-0 lg:border-r">
          <Link href="/" className="mb-10 flex items-center gap-3" aria-label="Kora home">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-ink">
              <Sparkles size={20} aria-hidden="true" />
            </span>
            <span className="font-outfit text-2xl font-semibold">Kora</span>
          </Link>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400">{eyebrow}</p>
          <h1 className="mt-4 font-outfit text-4xl font-semibold leading-tight md:text-5xl">{title}</h1>
          <p className="mt-5 text-sm leading-6 text-slate-400">{description}</p>
          <div className="mt-10 grid gap-3 text-sm text-slate-300">
            {[
              "Grounded answers from approved Notion pages",
              "Organization-scoped access from the start",
              "Admin visibility into stale and missing knowledge",
            ].map((item) => (
              <div key={item} className="glass-soft rounded-lg p-3">
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="p-8 md:p-10">
          {children}
        </div>
      </section>
    </main>
  );
}