import { Headphones, HeartHandshake, Settings2, TerminalSquare } from "lucide-react";
import { PublicContentPage } from "@/components/public-content-page";
import { publicMetadata } from "@/lib/public-site";

export const metadata = publicMetadata("Solutions", "See how engineering, operations, HR, and support teams use Kora with approved company knowledge.", "/solutions");
export default function SolutionsPage() { return <PublicContentPage eyebrow="Solutions" title="Answers shaped around the work teams already do." description="Kora uses the same grounded workflow across departments while letting each organization choose the pages employees are allowed to search." sections={[{eyebrow:"Teams",title:"One knowledge layer, different operating questions.",description:"Start with the workflows where repeat questions and source verification matter most.",items:[
  {title:"Engineering",description:"Find deployment runbooks, incident steps, architectural decisions, environment guidance, and API conventions.",icon:TerminalSquare},
  {title:"Operations",description:"Answer SOP, approval, escalation, vendor, facility, and recurring process questions.",icon:Settings2},
  {title:"People and HR",description:"Make onboarding, leave, benefits, conduct, and internal policy guidance easier to verify.",icon:HeartHandshake},
  {title:"Support",description:"Retrieve approved troubleshooting, escalation, product, warranty, and customer-response guidance.",icon:Headphones},
]},{eyebrow:"Shared outcome",title:"Less time searching, more confidence checking.",description:"Employees receive a concise answer and can inspect the supporting source. Admins see where the knowledge base did not provide enough evidence.",preview:"assistant"}]} />; }
