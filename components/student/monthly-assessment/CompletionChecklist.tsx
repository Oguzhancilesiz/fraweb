"use client";

type Item = { id: string; label: string; done: boolean };

type Props = {
  items: Item[];
  title?: string;
};

export function CompletionChecklist({ items, title = "Fotoğraf kontrolü" }: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-pf-void/30 px-3 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{title}</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((it) => (
          <li key={it.id} className="flex items-center gap-2 text-sm">
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[10px] font-bold ${
                it.done
                  ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-200"
                  : "border-white/15 text-zinc-500"
              }`}
              aria-hidden
            >
              {it.done ? "✓" : ""}
            </span>
            <span className={it.done ? "text-zinc-400 line-through" : "text-zinc-200"}>{it.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
