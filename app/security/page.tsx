import { Eye, KeyRound, LockKeyhole, ScrollText, ShieldCheck, UserCog } from "lucide-react";
import { PortfolioNotice, PublicHero, PublicShell } from "@/components/public-site";
import { publicMetadata } from "@/lib/public-site";

export const metadata = publicMetadata("Security", "Review Kora's implemented security controls, designed deployment protections, and honest portfolio limitations.", "/security");
const controls = [
  [ShieldCheck,"Organization isolation","Membership and organization IDs scope durable data and retrieval. Database policies add a second authorization boundary."],
  [UserCog,"Role-based access","Owner, admin, and member roles restrict organization settings, sync, invitations, gaps, and member operations."],
  [LockKeyhole,"Approved sources","Notion can only return pages shared with the authorized integration. Archived or failed documents are excluded from retrieval."],
  [KeyRound,"Server-held secrets","Service credentials, AI keys, Notion tokens, and encryption keys stay outside the browser bundle."],
  [Eye,"Grounded responses","Retrieved documents are treated as untrusted data. Citation identifiers are validated before an answer is saved."],
  [ScrollText,"Operational visibility","Audit events, sync jobs, usage records, and safe error states make sensitive workflows inspectable."],
] as const;
export default function SecurityPage(){return <PublicShell><PublicHero eyebrow="Security" title="Scoped knowledge, explicit boundaries." description="Kora is designed to keep company knowledge separated by organization, credentials off the client, and generated claims attached to supporting evidence."/><section className="relative z-10 px-5 pb-24"><div className="mx-auto max-w-7xl"><div className="grid gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 md:grid-cols-2 lg:grid-cols-3">{controls.map(([Icon,title,description])=><article className="bg-[#0b0c0f] p-7" key={title}><Icon className="text-blue-300" size={23}/><h2 className="mt-6 font-outfit text-2xl font-semibold">{title}</h2><p className="mt-3 text-sm leading-7 text-slate-400">{description}</p></article>)}</div><div className="mt-12 grid gap-8 lg:grid-cols-2"><div><h2 className="font-outfit text-3xl font-semibold">Production deployment design</h2><p className="mt-4 text-sm leading-7 text-slate-400">The architecture specifies restricted CORS, JWT validation, encrypted integration tokens, secret management, authenticated scheduler calls, rate limits, and centralized logs. Deployment operators must configure and verify these controls in their environment.</p></div><PortfolioNotice /></div></div></section></PublicShell>}
