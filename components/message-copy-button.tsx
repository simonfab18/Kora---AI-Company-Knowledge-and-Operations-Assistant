"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function MessageCopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  async function copyMessage() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button type="button" onClick={copyMessage} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/[0.06] hover:text-white" aria-label={copied ? "Answer copied" : "Copy answer"} title={copied ? "Copied" : "Copy answer"}>
      {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
    </button>
  );
}

