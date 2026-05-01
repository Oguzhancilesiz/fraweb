"use client";

type Row = { label: string; done: boolean };

type Props = { rows: Row[] };

export function AssessmentWhatToCompleteCard({ rows }: Props) {
  return (
    <div className="rounded-xl border border-pf-orange/25 bg-pf-orange/5 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-pf-orange-bright">Bu ay neleri tamamlamalısın?</p>
      <ul className="mt-2 space-y-1.5 text-sm text-zinc-200">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center gap-2">
            <span className={r.done ? "text-emerald-400" : "text-zinc-500"} aria-hidden>
              {r.done ? "✓" : "○"}
            </span>
            <span className={r.done ? "text-zinc-400" : ""}>{r.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
