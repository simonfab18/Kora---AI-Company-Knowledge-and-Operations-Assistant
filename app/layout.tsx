import type { Metadata } from "next";
import "./globals.css";

const siteUrl=process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export const metadata:Metadata={
  metadataBase:new URL(siteUrl),
  title:{default:"Kora | AI Company Knowledge Assistant",template:"%s | Kora"},
  description:"A grounded AI assistant that turns approved Notion pages into searchable company knowledge with citations and admin insights.",
  applicationName:"Kora",
  keywords:["company knowledge","grounded AI","Notion AI assistant","knowledge base","citations"],
  openGraph:{siteName:"Kora",type:"website",locale:"en_US",title:"Kora | Grounded AI for Company Knowledge",description:"Search approved company knowledge, verify every supported answer, and improve missing documentation."},
  twitter:{card:"summary_large_image",title:"Kora | Grounded AI for Company Knowledge",description:"Search approved company knowledge with grounded answers and citations."},
};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>}
