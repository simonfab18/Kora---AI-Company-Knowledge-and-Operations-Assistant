import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function GlassPanel({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <section className={cn("glass-panel rounded-lg", className)} {...props}>
      {children}
    </section>
  );
}

export function GlassCard({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <article className={cn("glass-panel rounded-lg", className)} {...props}>
      {children}
    </article>
  );
}

export function Eyebrow({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-xs font-semibold uppercase tracking-[0.2em] text-blue-400",
        className,
      )}
      {...props}
    >
      {children}
    </p>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="glass-soft rounded-lg p-5 text-sm">
      <p className="font-semibold text-white">{title}</p>
      <p className="mt-2 leading-6 text-slate-400">{description}</p>
    </div>
  );
}

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="glass-soft flex items-center gap-3 rounded-lg p-4 text-sm text-slate-300">
      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-blue-400" />
      {label}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
      {message}
    </div>
  );
}