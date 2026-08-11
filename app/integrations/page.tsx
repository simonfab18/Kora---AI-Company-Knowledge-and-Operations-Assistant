import { NotebookText } from "lucide-react";
import { PublicContentPage } from "@/components/public-content-page";
import { publicMetadata } from "@/lib/public-site";

export const metadata = publicMetadata(
  "Integrations",
  "See how Kora connects approved Notion knowledge and why the portfolio remains intentionally Notion-focused.",
  "/integrations",
);

export default function IntegrationsPage() {
  return (
    <PublicContentPage
      eyebrow="Integrations"
      title="One knowledge source, implemented deeply."
      description="Kora is intentionally focused on Notion as its connected knowledge source. No additional source integrations are currently planned."
      sections={[
        {
          eyebrow: "Available now",
          title: "Notion is Kora's working source integration.",
          description:
            "Owners and admins authorize a Notion workspace, share approved pages with the integration, run synchronization, and inspect page-level results.",
          items: [
            {
              title: "Notion",
              description:
                "OAuth connection, approved-page discovery, nested block extraction, incremental content checks, document indexing, and links back to the source page.",
              icon: NotebookText,
              status: "Available",
            },
          ],
        },
        {
          eyebrow: "Focused scope",
          title: "Better Notion knowledge operations, not more connectors.",
          description:
            "Keeping one source allows the project to prioritize synchronization reliability, retrieval quality, exact citations, knowledge-gap detection, permissions, and a clearer employee experience.",
        },
      ]}
    />
  );
}
