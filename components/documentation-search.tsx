"use client";
import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type Guide = { slug: string; category: string; title: string; summary: string; readTime: string };
export function DocumentationSearch({ guides }: { guides: Guide[] }) {
  const [query,setQuery]=useState("");
  const visible=useMemo(()=>{const q=query.trim().toLowerCase();return q?guides.filter(g=>`${g.title} ${g.summary} ${g.category}`.toLowerCase().includes(q)):guides},[guides,query]);
  return <><label className="mt-10 flex h-12 max-w-2xl items-center gap-3 rounded-lg border border-white/10 bg-black/20 px-3"><Search size={17} className="text-slate-500"/><span className="sr-only">Search documentation</span><input value={query} onChange={event=>setQuery(event.target.value)} className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600" placeholder="Search setup, sync, citations, roles..."/></label><p className="mt-4 text-sm text-slate-500">{visible.length} {visible.length===1?"guide":"guides"}</p><div className="mt-6 grid gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 md:grid-cols-2 xl:grid-cols-3">{visible.map(guide=><Link key={guide.slug} href={`/documentation/${guide.slug}`} className="group bg-[#0b0c0f] p-6"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">{guide.category}</p><h2 className="mt-4 font-outfit text-2xl font-semibold leading-8 group-hover:text-blue-100">{guide.title}</h2><p className="mt-3 text-sm leading-6 text-slate-400">{guide.summary}</p><div className="mt-6 flex items-center justify-between text-xs text-slate-500"><span>{guide.readTime}</span><span className="inline-flex items-center gap-1 text-slate-200">Read <ArrowRight size={14}/></span></div></Link>)}</div>{!visible.length?<div className="mt-6 rounded-lg border border-dashed border-white/10 p-10 text-center text-sm text-slate-400">No guide matches “{query}”. Try a broader term.</div>:null}</>;
}
