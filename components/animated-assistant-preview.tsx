"use client";

import { ChevronRight, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const answer = "Complete account setup, review the role-specific SOPs, and confirm the first-week checklist with your manager.";

export function AnimatedAssistantPreview() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState("");

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setActive(true);
      setTypedAnswer(answer);
      return;
    }

    let intervalId: number | undefined;
    let timeoutId: number | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      setActive(true);
      observer.disconnect();
      timeoutId = window.setTimeout(() => {
        let index = 0;
        intervalId = window.setInterval(() => {
          index += 1;
          setTypedAnswer(answer.slice(0, index));
          if (index >= answer.length && intervalId) window.clearInterval(intervalId);
        }, 15);
      }, 500);
    }, { threshold: 0.35 });
    observer.observe(root);
    return () => {
      observer.disconnect();
      if (timeoutId) window.clearTimeout(timeoutId);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, []);

  const complete = typedAnswer.length === answer.length;
  return (
    <div ref={rootRef} className={`public-preview public-reveal assistant-preview ${active ? "preview-active reveal-active" : ""}`} aria-label="Kora Ask AI interface preview">
      <div className="preview-toolbar"><span /><span /><span /><b>Ask Kora</b></div>
      <div className="space-y-4 p-5 md:p-7">
        <div className="preview-question ml-auto max-w-lg rounded-lg bg-blue-400/15 p-4 text-sm">What steps should a new employee complete in their first week?</div>
        <div className="preview-answer max-w-2xl rounded-lg border border-white/10 bg-white/[0.04] p-5 text-sm leading-7 text-slate-300" aria-label={answer}>
          <p className="min-h-[56px]" aria-hidden="true">{typedAnswer}{!complete && active ? <span className="typing-cursor">|</span> : null}</p>
          <div className={`preview-source mt-4 flex items-center gap-2 border-t border-white/10 pt-3 text-xs text-blue-200 ${complete ? "source-visible" : ""}`}>
            <ShieldCheck size={14} /> Employee Onboarding Playbook <ChevronRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
}

