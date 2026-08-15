import { DocumentationSearch } from "@/components/documentation-search";
import { PublicHero, PublicShell } from "@/components/public-site";
import { koraDocumentationGuides } from "@/lib/kora-documentation-corpus";
import { publicMetadata } from "@/lib/public-site";

export const metadata=publicMetadata("Documentation","Practical guides for setting up, operating, securing, and improving a Kora workspace.","/documentation");
export default function DocumentationPage(){return <PublicShell><PublicHero eyebrow="Documentation" title="Run Kora with trusted company knowledge." description="Learn how to create a workspace, connect Notion, synchronize approved pages, ask grounded questions, inspect citations, manage access, and improve missing documentation."/><section className="relative z-10 px-5 pb-24"><div className="mx-auto max-w-7xl"><DocumentationSearch guides={koraDocumentationGuides}/></div></section></PublicShell>}
