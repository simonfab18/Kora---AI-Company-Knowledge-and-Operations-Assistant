import type { MetadataRoute } from "next";
import { publicDocumentationGuides } from "@/lib/public-documentation-guides";
import { publicRoutes } from "@/lib/public-site";
export default function sitemap():MetadataRoute.Sitemap{const base=process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";return [...publicRoutes,...publicDocumentationGuides.map(guide=>`/documentation/${guide.slug}`)].map(path=>({url:`${base}${path}`,lastModified:new Date(),changeFrequency:path.startsWith("/documentation")?"monthly":"weekly",priority:path===""?1:0.7}))}
