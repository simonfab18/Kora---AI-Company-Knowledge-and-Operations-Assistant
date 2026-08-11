"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function PublicMotion() {
  const pathname = usePathname();
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      document.querySelectorAll(".public-reveal").forEach((node) => node.classList.add("reveal-active"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const delay = Number((entry.target as HTMLElement).dataset.delay || 0);
        window.setTimeout(() => entry.target.classList.add("reveal-active"), delay);
        observer.unobserve(entry.target);
      }),
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    );
    document.querySelectorAll(".public-reveal").forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [pathname]);
  return null;
}


