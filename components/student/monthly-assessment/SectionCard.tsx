"use client";

import type { ReactNode } from "react";

type Props = {
  id: string;
  title: string;
  hint?: string;
  active: boolean;
  done: boolean;
  stepIndex: number;
  children: ReactNode;
  onActivate: () => void;
};

export function SectionCard({ id, title, hint, active, done, stepIndex, children, onActivate }: Props) {
  return (
    <section
      id={id}
      className={`scroll-mt-28 rounded-2xl border bg-pf-card/30 p-4 transition-colors md:p-5 ${
        active
          ? "border-pf-orange/50 shadow-[0_0_0_1px_rgba(249,115,22,0.12)] ring-1 ring-pf-orange/20"
          : "border-white/10"
      }`}
      aria-labelledby={`${id}-heading`}
    >
      <header className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <button
          type="button"
          onClick={onActivate}
          className="group flex flex-1 flex-wrap items-center gap-2 text-left"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-pf-void/60 text-xs font-bold text-zinc-400 group-hover:border-white/25">
            {stepIndex + 1}
          </span>
          <div>
            <h2 id={`${id}-heading`} className="text-base font-semibold text-white group-hover:text-pf-orange-bright/95">
              {title}
            </h2>
            {hint ? <p className="mt-0.5 text-xs text-zinc-500">{hint}</p> : null}
          </div>
        </button>
        {done ? (
          <span
            className="inline-flex items-center gap-1 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-200"
            aria-label="Bu bölüm tamamlandı"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                clipRule="evenodd"
              />
            </svg>
            Tamam
          </span>
        ) : null}
      </header>
      <div className="text-sm">{children}</div>
    </section>
  );
}
