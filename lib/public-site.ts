import type { Metadata } from "next";

export const publicNavigation = [
  { href: "/product", label: "Product" },
  { href: "/solutions", label: "Solutions" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/security", label: "Security" },
  { href: "/integrations", label: "Integrations" },
  { href: "/pricing", label: "Pricing" },
];

export const publicRoutes = [
  "",
  "/product",
  "/solutions",
  "/how-it-works",
  "/security",
  "/integrations",
  "/pricing",
  "/about",
  "/knowledge-gaps",
  "/roadmap",
  "/changelog",
  "/documentation",
  "/support",
  "/privacy",
  "/terms",
];

export function publicMetadata(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName: "Kora", type: "website" },
  };
}

