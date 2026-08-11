"use client";

import { ChevronLeft, ChevronRight, Folder, Plus } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

export type KnowledgeCollectionCard = {
  id: string;
  name: string;
  description: string | null;
  visibility: string;
  documentCount: number;
  href: string;
  active: boolean;
};

export function KnowledgeCollectionsRow({ collections, manageHref }: { collections: KnowledgeCollectionCard[]; manageHref: string }) {
  const rowRef = useRef<HTMLDivElement>(null);

  function slide(direction: "previous" | "next") {
    const row = rowRef.current;
    if (!row) return;
    row.scrollBy({ left: direction === "next" ? row.clientWidth * 0.78 : -row.clientWidth * 0.78, behavior: "smooth" });
  }

  return (
    <section className="glass-panel rounded-lg p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Collections</p>
          <h2 className="mt-2 font-outfit text-2xl font-semibold">Browse knowledge folders</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Group Notion pages by team, topic, workflow, or policy area.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => slide("previous")}
            className="glass-soft inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-200 transition hover:text-white"
            aria-label="Previous collections"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => slide("next")}
            className="glass-soft inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-200 transition hover:text-white"
            aria-label="Next collections"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
          <Link href={manageHref} className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-3 text-sm font-semibold text-ink transition hover:bg-slate-200">
            <Plus size={16} aria-hidden="true" />
            Manage
          </Link>
        </div>
      </div>

      {collections.length ? (
        <div ref={rowRef} className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={collection.href}
              className={`group flex min-h-36 w-[260px] shrink-0 snap-start flex-col justify-between rounded-lg border p-4 sm:w-[300px] ${
                collection.active ? "border-blue-300/60 bg-blue-400/10" : "border-white/10 bg-white/[0.025]"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <span className="glass-soft inline-flex h-11 w-11 items-center justify-center rounded-lg text-blue-200">
                    <Folder size={20} aria-hidden="true" />
                  </span>
                  <span className="rounded border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{collection.visibility}</span>
                </div>
                <h3 className="mt-4 line-clamp-1 font-outfit text-xl font-semibold text-white">{collection.name}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{collection.description || "No description yet."}</p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-500">
                <span>{collection.documentCount} page{collection.documentCount === 1 ? "" : "s"}</span>
                <span className="text-blue-200 transition group-hover:text-white">Open folder</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-white/10 p-5 text-sm leading-6 text-slate-400">
          No collections yet. Create folders for teams, policies, onboarding, products, or support topics.
        </div>
      )}
    </section>
  );
}