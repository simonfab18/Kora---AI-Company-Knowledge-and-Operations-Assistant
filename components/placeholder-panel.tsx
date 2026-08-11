type PlaceholderPanelProps = {
  title: string;
  eyebrow: string;
  description: string;
  items: string[];
};

export function PlaceholderPanel({ title, eyebrow, description, items }: PlaceholderPanelProps) {
  return (
    <section className="glass-panel rounded-lg p-6 md:p-8">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
        {eyebrow}
      </p>
      <h2 className="font-outfit text-2xl font-semibold">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">{description}</p>
      <div className="mt-8 grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <div key={item} className="glass-soft rounded-lg p-4 text-sm text-slate-300">
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}
