import { submitSupportTicketAction } from "@/app/app/utility-actions";
import { PublicHero, PublicShell } from "@/components/public-site";
import { SupportTicketForm } from "@/components/utility-forms";
import { publicMetadata } from "@/lib/public-site";
export const metadata=publicMetadata("Support","Find Kora documentation, troubleshooting guidance, and a safe support request form.","/support");
export default function SupportPage(){return <PublicShell><PublicHero eyebrow="Support" title="Help for setup, sync, answers, and access." description="Start with the documentation for common workflows. When you still need help, send a support request without including secrets, tokens, passwords, or private document text."/><section className="relative z-10 px-5 pb-24"><div className="mx-auto max-w-3xl rounded-lg border border-white/10 bg-white/[0.04] p-6 md:p-8"><h2 className="font-outfit text-3xl font-semibold">Contact support</h2><p className="mt-3 text-sm leading-7 text-slate-400">Requests are saved for review in this portfolio workspace. Response times are not guaranteed.</p><SupportTicketForm action={submitSupportTicketAction}/></div></section></PublicShell>}
