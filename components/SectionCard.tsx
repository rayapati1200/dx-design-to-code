import { PropsWithChildren } from 'react';

export function SectionCard({
  title,
  description,
  children
}: PropsWithChildren<{ title: string; description?: string }>) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft backdrop-blur">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
