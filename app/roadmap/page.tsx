import { PublicContentPage } from "@/components/public-content-page";
import { publicMetadata } from "@/lib/public-site";

export const metadata = publicMetadata(
  "Roadmap",
  "Review Kora's working foundation and its priorities for reliability, answer quality, evaluation, and deployment.",
  "/roadmap",
);

export default function RoadmapPage() {
  return (
    <PublicContentPage
      eyebrow="Roadmap"
      title="Improve the product before expanding its scope."
      description="Kora's roadmap is focused on making the existing Notion knowledge workflow more reliable, useful, accessible, and deployment-ready."
      sections={[
        {
          eyebrow: "Now",
          title: "Working product foundation.",
          description:
            "Authentication, organizations, Notion connection and sync, grounded Ask AI, citations, knowledge gaps, members, insights, settings, usage limits, collections, onboarding, and help content are implemented.",
          items: [
            {
              title: "Reliability",
              description:
                "Continue end-to-end regression checks across onboarding, sync, retrieval, invitations, and organization lifecycle.",
            },
            {
              title: "Answer quality",
              description:
                "Evaluate retrieval thresholds, citation coverage, answer usefulness, and gap grouping against a larger test set.",
            },
          ],
        },
        {
          eyebrow: "Next",
          title: "Hardening the existing experience.",
          description:
            "Future work stays centered on the current Notion-based product rather than adding more knowledge-source integrations.",
          items: [
            {
              title: "Production operations",
              description:
                "Complete environment-specific secrets, logging, scheduler, worker, alerting, backup, and recovery verification.",
              status: "Planned",
            },
            {
              title: "Evaluation suite",
              description:
                "Add repeatable grounded-answer and citation-quality datasets for multiple knowledge domains.",
              status: "Planned",
            },
            {
              title: "Accessibility and UX",
              description:
                "Continue keyboard, screen-reader, responsive-layout, loading-state, and error-recovery improvements.",
              status: "Planned",
            },
          ],
        },
      ]}
    />
  );
}
