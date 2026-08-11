import { PublicContentPage } from "@/components/public-content-page";
import { publicMetadata } from "@/lib/public-site";

export const metadata = publicMetadata("How It Works", "Follow Kora's seven-step path from approved Notion pages to grounded answers and knowledge improvements.", "/how-it-works");
const steps = [
  ["1. Create a workspace","Create an organization and assign its owner, admins, and members."],
  ["2. Connect Notion","Complete OAuth and grant the Kora integration access to approved pages."],
  ["3. Synchronize","Fetch readable pages and nested blocks, normalize content, and track job results."],
  ["4. Chunk and embed","Split documents along useful boundaries and create compatible vector embeddings."],
  ["5. Ask a question","Search only the active organization's indexed documents for relevant evidence."],
  ["6. Generate and cite","Answer from retrieved context and save validated citations to exact chunks."],
  ["7. Improve the source","Use weak answers, feedback, and repeated gaps to guide documentation work."],
];
export default function HowItWorksPage() { return <PublicContentPage eyebrow="How It Works" title="From approved page to verified answer." description="Kora's workflow keeps ingestion, retrieval, generation, and improvement connected so users can see where an answer came from and admins can see what is missing." sections={[
  {eyebrow:"Seven steps",title:"A traceable knowledge pipeline.",description:"Each stage leaves durable product state instead of hiding the workflow behind one chat request.",items:steps.map(([title,description])=>({title,description}))},
  {eyebrow:"Architecture",title:"A production-minded portfolio stack.",description:"The designed deployment uses a Next.js frontend, a FastAPI service boundary, Supabase PostgreSQL with pgvector, the Notion API, Gemini provider adapters, and background synchronization through Celery and Redis. The local portfolio build also includes server-side Next.js routes for working product flows.",preview:"dashboard"},
  {eyebrow:"Boundaries",title:"What the pipeline will not do.",description:"Kora does not expose service credentials to the browser, search another organization's content, obey instructions embedded in documents, or cite sources that were not part of the retrieved context."},
]} />; }
