import type { MetadataRoute } from "next";
import { koraDocumentationGuides } from "@/lib/kora-documentation-corpus";
import { publicRoutes } from "@/lib/public-site";
export default function sitemap():MetadataRoute.Sitemap{const base=process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";return [...publicRoutes,...koraDocumentationGuides.map(guide=>`/documentation/${guide.slug}`)].map(path=>({url:`${base}${path}`,lastModified:new Date(),changeFrequency:path.startsWith("/documentation")?"monthly":"weekly",priority:path===""?1:0.7}))}
