"use client";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";
export function ResourceFeedback(){const [rating,setRating]=useState<"yes"|"no"|null>(null);return <div><p className="text-sm font-semibold">Was this resource helpful?</p>{rating?<p className="mt-3 text-sm text-emerald-200" role="status">Thanks. Your feedback was recorded for this session.</p>:<div className="mt-4 flex gap-3"><button onClick={()=>setRating("yes")} className="glass-soft inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm"><ThumbsUp size={16}/>Yes</button><button onClick={()=>setRating("no")} className="glass-soft inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm"><ThumbsDown size={16}/>No</button></div>}</div>}
