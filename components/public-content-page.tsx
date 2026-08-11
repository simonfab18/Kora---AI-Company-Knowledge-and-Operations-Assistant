import type { LucideIcon } from "lucide-react";
import { PrimaryActions, ProductPreview, PublicHero, PublicShell, SectionIntro } from "@/components/public-site";

export type ContentSection = {
  eyebrow: string;
  title: string;
  description: string;
  items?: Array<{ title: string; description: string; icon?: LucideIcon; status?: string }>;
  preview?: "assistant" | "dashboard" | "gaps";
};

function itemSpan(index: number, total: number) {
  const remainder = total % 3;
  if (remainder === 1 && index === total - 1) return "md:col-span-6";
  if (remainder === 2 && index >= total - 2) return "md:col-span-3";
  return "md:col-span-2";
}
export function PublicContentPage({ eyebrow, title, description, sections, cta = true }: { eyebrow: string; title: string; description: string; sections: ContentSection[]; cta?: boolean }) {
  return <PublicShell>
    <PublicHero eyebrow={eyebrow} title={title} description={description}><PrimaryActions /></PublicHero>
    {sections.map((section, index) => <section key={section.title} className={`relative z-10 px-5 py-20 md:py-24 ${index % 2 ? "border-y border-white/[0.07] bg-white/[0.02]" : ""}`}><div className="mx-auto max-w-7xl"><div className={section.preview ? "grid gap-12 lg:grid-cols-2 lg:items-center" : ""}><SectionIntro eyebrow={section.eyebrow} title={section.title} description={section.description} />{section.preview ? <ProductPreview variant={section.preview} /> : null}</div>{section.items ? <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 md:grid-cols-6">{section.items.map((item, itemIndex) => <article key={item.title} className={"public-card public-reveal bg-[#0b0c0f] p-6 md:p-8 " + itemSpan(itemIndex, section.items!.length)} data-delay={String((itemIndex % 3) * 70)}>{item.icon ? <item.icon className="public-card-icon text-blue-300" size={22} /> : null}<div className="flex items-start justify-between gap-3"><h3 className="font-outfit text-2xl font-semibold">{item.title}</h3>{item.status ? <span className={`rounded border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${item.status === "Available" ? "border-emerald-300/20 text-emerald-200" : "border-slate-400/20 text-slate-400"}`}>{item.status}</span> : null}</div><p className="mt-3 text-sm leading-7 text-slate-400">{item.description}</p></article>)}</div> : null}</div></section>)}
    {cta ? <section className="relative z-10 px-5 py-24 text-center"><div className="mx-auto max-w-4xl border-y border-white/10 py-14"><h2 className="font-outfit text-4xl font-semibold">Start with approved knowledge.</h2><p className="mx-auto mt-4 max-w-xl text-slate-400">Connect a focused set of useful Notion pages, validate the answers, then expand coverage.</p><div className="mt-8 flex justify-center"><PrimaryActions /></div></div></section> : null}
  </PublicShell>;
}



