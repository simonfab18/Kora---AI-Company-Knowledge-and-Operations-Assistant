import type { LucideIcon } from "lucide-react";
import { ArrowRight, BookOpen, Menu, Sparkles } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { PublicMotion } from "@/components/public-motion";
import { AnimatedAssistantPreview } from "@/components/animated-assistant-preview";
import { publicNavigation } from "@/lib/public-site";

export function PublicHeader() {
  return (
    <header className="public-header-enter fixed inset-x-0 top-0 z-40 border-b border-white/[0.06] bg-[#050505]/80 px-5 backdrop-blur-2xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3" aria-label="Kora home">
          <span className="glass-soft flex h-10 w-10 items-center justify-center rounded-lg text-blue-300"><Sparkles size={19} aria-hidden="true" /></span>
          <span className="font-outfit text-xl font-semibold">Kora</span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-slate-400 xl:flex" aria-label="Main navigation">
          {publicNavigation.map((item) => <Link key={item.href} className="nav-link whitespace-nowrap" href={item.href}>{item.label}</Link>)}
          <Link className="nav-link" href="/documentation">Documentation</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link className="hidden text-sm font-medium text-slate-300 hover:text-white sm:block" href="/login">Login</Link>
          <Link className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-slate-200" href="/signup" data-analytics-event="request_access">Request Access</Link>
          <details className="relative xl:hidden">
            <summary className="glass-soft flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-lg" aria-label="Open navigation"><Menu size={18} /></summary>
            <nav className="absolute right-0 mt-3 w-64 rounded-lg border border-white/15 bg-[#111318] p-2 shadow-2xl" aria-label="Mobile navigation">
              {[...publicNavigation, { href: "/documentation", label: "Documentation" }].map((item) => <Link key={item.href} className="block rounded-md px-3 py-2.5 text-sm text-slate-300 hover:bg-white/[0.06] hover:text-white" href={item.href}>{item.label}</Link>)}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  const columns = [
    ["Product", [["Overview", "/product"], ["How It Works", "/how-it-works"], ["Integrations", "/integrations"], ["Pricing", "/pricing"]]],
    ["Resources", [["Documentation", "/documentation"], ["Knowledge Gaps", "/knowledge-gaps"], ["Roadmap", "/roadmap"], ["Changelog", "/changelog"]]],
    ["Company", [["About", "/about"], ["Security", "/security"], ["Support", "/support"], ["Privacy", "/privacy"], ["Terms", "/terms"]]],
  ] as const;
  return (
    <footer className="relative z-10 border-t border-white/[0.07] px-5 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div><div className="flex items-center gap-3"><Sparkles className="text-blue-300" size={24} /><span className="font-outfit text-2xl font-semibold">Kora</span></div><p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">Grounded answers from approved company knowledge, with citations employees can verify and gaps admins can improve.</p></div>
          {columns.map(([title, links]) => <div key={title}><h2 className="text-sm font-semibold text-white">{title}</h2><ul className="mt-5 space-y-3">{links.map(([label, href]) => <li key={href}><Link className="text-sm text-slate-500 hover:text-white" href={href}>{label}</Link></li>)}</ul></div>)}
        </div>
        <div className="mt-14 flex flex-col gap-3 border-t border-white/[0.07] pt-6 text-xs text-slate-600 md:flex-row md:items-center md:justify-between"><p>Copyright 2026 Kora. Portfolio project.</p><p>Built to demonstrate grounded company knowledge workflows. No commercial service or certifications are implied.</p></div>
      </div>
    </footer>
  );
}

export function PublicShell({ children }: { children: ReactNode }) {
  return <main className="public-site min-h-screen overflow-hidden bg-[#050505] text-white"><div className="grain-overlay" /><PublicMotion /><PublicHeader />{children}<PublicFooter /></main>;
}

export function PublicHero({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: ReactNode }) {
  return <section className="relative z-10 px-5 pb-20 pt-36 md:pb-24 md:pt-44"><div className="mx-auto max-w-7xl"><div className="max-w-4xl"><p className="public-reveal text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">{eyebrow}</p><h1 className="public-reveal mt-5 font-outfit text-5xl font-semibold leading-[1.05] sm:text-6xl lg:text-7xl" data-delay="70">{title}</h1><p className="public-reveal mt-6 max-w-3xl text-lg leading-8 text-slate-400" data-delay="130">{description}</p>{children ? <div className="public-reveal mt-9" data-delay="190">{children}</div> : null}</div></div></section>;
}

export function SectionIntro({ eyebrow, title, description, centered = false }: { eyebrow: string; title: string; description: string; centered?: boolean }) {
  return <div className={`public-reveal ${centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}`}><p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">{eyebrow}</p><h2 className="mt-4 font-outfit text-4xl font-semibold leading-tight md:text-5xl">{title}</h2><p className="mt-5 text-base leading-8 text-slate-400 md:text-lg">{description}</p></div>;
}

export function FeatureGrid({ items }: { items: Array<{ title: string; description: string; icon: LucideIcon }> }) {
  return <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 md:grid-cols-2 lg:grid-cols-3">{items.map((item, index) => <article key={item.title} className="public-card public-reveal bg-[#0b0c0f] p-6 md:p-8" data-delay={String((index % 3) * 70)}><item.icon className="public-card-icon text-blue-300" size={23} aria-hidden="true" /><h3 className="mt-6 font-outfit text-2xl font-semibold">{item.title}</h3><p className="mt-3 text-sm leading-7 text-slate-400">{item.description}</p></article>)}</div>;
}

export function PrimaryActions({ secondaryHref = "/documentation", secondaryLabel = "Read documentation" }: { secondaryHref?: string; secondaryLabel?: string }) {
  return <div className="flex flex-col gap-3 sm:flex-row"><Link className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-ink hover:bg-slate-200" href="/signup" data-analytics-event="get_started">Get started <ArrowRight size={16} /></Link><Link className="glass-soft inline-flex h-12 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold text-slate-200 hover:text-white" href={secondaryHref}><BookOpen size={16} /> {secondaryLabel}</Link></div>;
}

export function ProductPreview({ variant = "assistant" }: { variant?: "assistant" | "dashboard" | "gaps" }) {
  if (variant === "dashboard") return <div className="public-preview public-reveal dashboard-preview" aria-label="Kora dashboard interface preview"><div className="preview-toolbar"><span /><span /><span /><b>Workspace overview</b></div><div className="grid gap-3 p-5 sm:grid-cols-3"><PreviewMetric label="Indexed pages" value="Ready" /><PreviewMetric label="Answer health" value="Grounded" /><PreviewMetric label="Open gaps" value="Review" /></div><div className="mx-5 mb-5 h-28 rounded-md border border-white/10 bg-white/[0.025] p-4"><div className="preview-chart-line h-2 w-28 rounded bg-blue-300/60" /><div className="preview-chart-line mt-5 h-2 w-4/5 rounded bg-white/10" /><div className="preview-chart-line mt-3 h-2 w-3/5 rounded bg-white/10" /></div></div>;
  if (variant === "gaps") return <div className="public-preview public-reveal gaps-preview" aria-label="Kora knowledge gaps interface preview"><div className="preview-toolbar"><span /><span /><span /><b>Knowledge gaps</b></div><div className="space-y-3 p-5">{["Missing onboarding approval steps", "Unclear refund exception policy", "Outdated escalation owner"].map((label, i) => <div className="preview-gap-row flex items-center justify-between gap-4 rounded-md border border-white/10 bg-white/[0.03] p-4" key={label}><div><p className="text-sm font-medium">{label}</p><p className="mt-1 text-xs text-slate-500">{i + 2} related questions</p></div><span className="rounded border border-amber-300/20 px-2 py-1 text-[10px] uppercase text-amber-200">Review</span></div>)}</div></div>;
  return <AnimatedAssistantPreview />;
}

function PreviewMetric({ label, value }: { label: string; value: string }) { return <div className="preview-metric rounded-md border border-white/10 bg-white/[0.03] p-4"><p className="text-xs uppercase tracking-wider text-slate-500">{label}</p><p className="mt-3 font-outfit text-xl font-semibold">{value}</p></div>; }

export function PortfolioNotice() { return <div className="rounded-lg border border-blue-300/20 bg-blue-400/[0.07] p-5 text-sm leading-7 text-blue-100"><strong>Portfolio project:</strong> Kora demonstrates a working company-knowledge workflow. It is not presented as a certified enterprise service, and no customer, compliance, or uptime claims are made.</div>; }


