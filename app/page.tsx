import type { Metadata } from "next";
import { CheckCircle2, CircleAlert, FileCheck2, FileSearch, MessageSquareText, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { FeatureGrid, PortfolioNotice, PrimaryActions, ProductPreview, PublicShell, SectionIntro } from "@/components/public-site";

export const metadata: Metadata = {
  title: { absolute: "Kora | Grounded AI for Company Knowledge" },
  description: "Turn approved Notion pages into a searchable AI workspace with grounded answers, citations, sync visibility, and knowledge-gap insights.",
  alternates: { canonical: "/" },
};

const faq = [
  ["How does Kora connect to Notion?", "An owner or admin completes the official Notion OAuth flow and grants access to approved pages. Kora can only synchronize content available to that integration."],
  ["Does Kora answer from the public internet?", "No. Company-specific answers are generated from retrieved, organization-scoped knowledge. When context is not enough, Kora says so instead of inventing a claim."],
  ["How do citations work?", "Kora saves the document and exact source chunk behind each grounded answer. Users can inspect that context in Kora or open the original Notion page."],
  ["What happens when documentation is missing?", "Insufficient and low-confidence answers can create a knowledge gap that admins review after improving the source material."],
  ["Is Kora a production enterprise service?", "Kora is a working portfolio project with a production-minded architecture. It does not claim certifications, contractual uptime, or enterprise support coverage."],
];

export default function HomePage() {
  const comparison = [
    ["Company context", "Approved workspace sources", "Broad model knowledge"],
    ["Evidence", "Saved source chunks and links", "Varies by product and prompt"],
    ["Missing information", "Records an insufficiency and gap", "May produce a plausible response"],
    ["Administration", "Sync, roles, usage, gaps, source health", "Not tied to your documentation lifecycle"],
  ];
  return <PublicShell>
    <section className="relative z-10 px-5 pb-16 pt-32 text-center md:pt-32"><div className="mx-auto max-w-6xl">
      <p className="public-reveal mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-slate-300"><span className="h-1.5 w-1.5 rounded-full bg-blue-400" />Grounded company knowledge</p>
      <h1 className="public-reveal mt-6 font-outfit text-6xl font-semibold leading-[1.02] sm:text-7xl lg:text-8xl" data-delay="80">Your company knowledge,<br /><span className="text-slate-400">instantly accessible.</span></h1>
      <p className="public-reveal mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-400 md:text-xl" data-delay="150">Kora connects approved company knowledge from Notion, turns it into a searchable AI workspace, and gives employees clear answers with citations back to the original source.</p>
      <p className="public-reveal mx-auto mt-2 max-w-2xl text-sm leading-7 text-slate-500" data-delay="190">Policies, SOPs, technical documentation, onboarding guides, and operating knowledge stay usable in one verified answer flow.</p>
      <div className="public-reveal mt-6 flex justify-center" data-delay="230"><PrimaryActions secondaryHref="/product" secondaryLabel="Explore the product" /></div>
      <div className="public-reveal mx-auto mt-10 max-w-5xl text-left" data-delay="300"><ProductPreview /></div>
    </div></section>

    <section className="relative z-10 px-5 py-24"><div className="mx-auto max-w-7xl"><SectionIntro eyebrow="What Kora is" title="An answer layer for knowledge your team already maintains." description="Kora is not a replacement for source documents. It makes approved knowledge easier to ask, verify, and improve." centered /><FeatureGrid items={[
      { title: "Ask", description: "Employees ask natural-language questions across approved workspace knowledge.", icon: MessageSquareText },
      { title: "Verify", description: "Every supported answer includes the source context used to generate it.", icon: FileCheck2 },
      { title: "Improve", description: "Weak answers and negative feedback become visible documentation gaps.", icon: FileSearch },
    ]} /></div></section>

    <section className="relative z-10 border-y border-white/[0.07] bg-black/30 px-5 py-24"><div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-2 lg:items-center"><SectionIntro eyebrow="Why teams need Kora" title="Search finds pages. Kora helps people reach a supported answer." description="Knowledge is often scattered and inconsistently titled. Kora retrieves relevant sections and keeps the evidence attached." /><div>{["Reduce repeated operational questions", "Keep answers tied to approved sources", "Show admins what employees cannot find", "Make stale or failed sync visible"].map((item) => <div className="flex items-center gap-3 border-b border-white/10 py-4 text-slate-300" key={item}><CheckCircle2 size={19} className="text-emerald-300" />{item}</div>)}</div></div></section>

    <section className="relative z-10 px-5 py-24"><div className="mx-auto max-w-7xl"><SectionIntro eyebrow="Different by design" title="Kora versus a general chatbot" description="Kora is designed for organization-scoped questions where the source and the boundary of what is known matter." /><div className="mt-12 overflow-x-auto rounded-lg border border-white/10"><div className="min-w-[680px]"><div className="grid grid-cols-3 bg-white/[0.04] text-sm font-semibold"><div className="p-4">Capability</div><div className="p-4">Kora</div><div className="p-4">General chatbot</div></div>{comparison.map((row) => <div className="grid grid-cols-3 border-t border-white/[0.07] text-sm" key={row[0]}>{row.map((cell, i) => <div className={`p-4 leading-6 ${i ? "text-slate-400" : "text-white"}`} key={cell}>{cell}</div>)}</div>)}</div></div></div></section>

    <section className="relative z-10 px-5 py-24"><div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-center"><SectionIntro eyebrow="Product workflow" title="Connect, sync, ask, verify, improve." description="Kora synchronizes approved pages, retrieves matching sections, saves citations, and turns uncertain answers into documentation work." /><div className="grid gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 sm:grid-cols-2">{[["01","Connect","Authorize Notion and share approved pages."],["02","Synchronize","Extract, chunk, embed, and index changed documents."],["03","Ask","Retrieve organization-scoped context."],["04","Improve","Review citations, feedback, and knowledge gaps."]].map(([n,t,d]) => <article className="public-card public-reveal bg-[#0a0b0e] p-6" key={n}><p className="font-mono text-xs text-blue-300">{n}</p><h3 className="mt-5 font-outfit text-2xl font-semibold">{t}</h3><p className="mt-2 text-sm leading-7 text-slate-400">{d}</p></article>)}</div></div></section>

    <section className="relative z-10 border-y border-white/[0.07] bg-white/[0.02] px-5 py-24"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center"><div><CircleAlert className="text-amber-200" size={30} /><SectionIntro eyebrow="Honest when knowledge is missing" title="A useful refusal is better than a confident guess." description="If sources do not support a reliable answer, Kora explains that context is insufficient and can create a trackable gap." /></div><ProductPreview variant="gaps" /></div></section>

    <section className="relative z-10 px-5 py-24"><div className="mx-auto max-w-7xl"><SectionIntro eyebrow="Role-aware workspace" title="A focused experience for every role." description="Members ask and verify. Admins manage knowledge operations. Owners control organization settings and lifecycle." /><FeatureGrid items={[{title:"Members",description:"Ask Kora, inspect citations, manage conversations, and submit feedback.",icon:Users},{title:"Admins",description:"Run sync, review knowledge health, manage members, and resolve gaps.",icon:RefreshCw},{title:"Owners",description:"Control organization settings, retrieval preferences, and access.",icon:ShieldCheck}]} /><div className="mt-16 grid gap-8 lg:grid-cols-2"><ProductPreview variant="dashboard" /><ProductPreview variant="gaps" /></div></div></section>

    <section className="relative z-10 px-5 py-24"><div className="mx-auto max-w-4xl"><SectionIntro eyebrow="FAQ" title="The important questions, answered plainly." description="Working capabilities are described as working; future capabilities are labeled clearly." /><div className="mt-10 space-y-3">{faq.map(([q,a]) => <details key={q} className="rounded-lg border border-white/10 bg-white/[0.03] p-5"><summary className="cursor-pointer list-none font-semibold">{q}</summary><p className="mt-4 text-sm leading-7 text-slate-400">{a}</p></details>)}</div></div></section>

    <section className="relative z-10 px-5 py-24"><div className="mx-auto max-w-5xl border-y border-white/10 py-14 text-center"><h2 className="font-outfit text-4xl font-semibold md:text-5xl">Make company knowledge easier to trust.</h2><p className="mx-auto mt-5 max-w-2xl text-slate-400">Create a workspace, connect approved Notion pages, and ask your first grounded question.</p><div className="mt-8 flex justify-center"><PrimaryActions /></div><div className="mx-auto mt-10 max-w-3xl text-left"><PortfolioNotice /></div></div></section>
  </PublicShell>;
}



