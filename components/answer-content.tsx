import type { ReactNode } from "react";

function inlineContent(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[\d+\])/g).filter(Boolean);
  return parts.map((part, index): ReactNode => {
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={`${part}-${index}`} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    if (/^\[\d+\]$/.test(part)) return <span key={`${part}-${index}`} className="ml-0.5 font-mono text-xs font-semibold text-blue-200">{part}</span>;
    return part;
  });
}

export function AnswerContent({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  return (
    <div className="space-y-2 text-sm leading-6 text-slate-200">
      {lines.map((rawLine, index) => {
        const line = rawLine.trim();
        if (!line) return <div key={`space-${index}`} className="h-1" aria-hidden="true" />;
        const heading = line.match(/^#{1,4}\s+(.+)$/);
        if (heading) return <h3 key={`heading-${index}`} className="pt-1 font-semibold text-white">{inlineContent(heading[1])}</h3>;
        const numbered = line.match(/^(\d+)[.)]\s+(.+)$/);
        if (numbered) return <div key={`step-${index}`} className="grid grid-cols-[24px_minmax(0,1fr)] gap-2"><span className="font-mono text-xs font-semibold text-blue-200">{numbered[1]}.</span><p>{inlineContent(numbered[2])}</p></div>;
        const bullet = line.match(/^[-*]\s+(.+)$/);
        if (bullet) return <div key={`bullet-${index}`} className="grid grid-cols-[10px_minmax(0,1fr)] gap-2"><span className="text-blue-300">&bull;</span><p>{inlineContent(bullet[1])}</p></div>;
        return <p key={`paragraph-${index}`}>{inlineContent(line)}</p>;
      })}
    </div>
  );
}

