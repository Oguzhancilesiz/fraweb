"use client";

type Props = {
  completedSections: number;
  totalSections: number;
  percent: number;
};

export function FormProgress({ completedSections, totalSections, percent }: Props) {
  const pct = Math.min(100, Math.max(0, Math.round(percent)));
  return (
    <div className="rounded-xl border border-white/10 bg-pf-card/40 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
        <span className="font-medium text-zinc-300">İlerleme</span>
        <span className="tabular-nums text-pf-orange-bright">
          %{pct} · {completedSections}/{totalSections} bölüm tamam
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-pf-orange to-pf-orange-bright transition-[width] duration-200 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
