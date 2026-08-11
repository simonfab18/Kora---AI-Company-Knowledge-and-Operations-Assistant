import { BarChart3, BookOpenCheck, Bot, Database, FileWarning, Users } from "lucide-react";
import { PublicContentPage } from "@/components/public-content-page";
import { publicMetadata } from "@/lib/public-site";

export const metadata = publicMetadata("Product", "Explore Kora's grounded AI assistant, knowledge library, source management, gaps, roles, and usage insights.", "/product");

export default function ProductPage() { return <PublicContentPage eyebrow="Product" title="Company knowledge with an evidence trail." description="Kora combines a grounded assistant with the operational tools admins need to keep answers current, scoped, and useful." sections={[
  { eyebrow:"Ask AI",title:"Clear answers, exact sources.",description:"Kora retrieves relevant chunks from approved documents, generates an answer from that context, validates citation references, and preserves the conversation.",preview:"assistant" },
  { eyebrow:"Workspace",title:"The full knowledge lifecycle in one product.",description:"Each capability supports the path from connected page to trusted answer.",items:[
    {title:"AI Assistant",description:"Grounded answers, confidence states, exact source context, feedback, and conversation controls.",icon:Bot},
    {title:"Knowledge Library",description:"Search documents and collections, inspect indexed chunks, status, source use, errors, and last sync.",icon:BookOpenCheck},
    {title:"Source Management",description:"Connect Notion, run synchronization, retry failures, and inspect document-level processing.",icon:Database},
    {title:"Knowledge Gaps",description:"Group weak questions, identify missing topics, assign a status, and record resolution notes.",icon:FileWarning},
    {title:"Members and Roles",description:"Invite teammates and apply owner, admin, or member permissions within each organization.",icon:Users},
    {title:"Analytics and Usage",description:"Review questions, weak-answer rate, citations, source usage, sync health, feedback, and AI quotas.",icon:BarChart3},
  ]},
  { eyebrow:"Trust principles",title:"Grounded, scoped, inspectable, honest.",description:"Organization filters apply before retrieval. Connected content is treated as untrusted data, citations must reference retrieved context, and unsupported questions return an explicit insufficiency instead of invented company policy.",preview:"dashboard" },
]} />; }
