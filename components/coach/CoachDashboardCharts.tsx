"use client";

import { useEffect, useRef } from "react";

type Slice = { label: string; count: number; color: string };
type ActivityPoint = {
  year: number;
  month: number;
  submittedToCoachCount: number;
  coachCompletedCount: number;
};
type DashData = { activity?: ActivityPoint[]; formSlices?: Slice[]; programSlices?: Slice[] };

const monthsTr = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

function monthLabel(y: number, m: number) {
  return `${monthsTr[(m || 1) - 1]} ${y}`;
}

export function CoachDashboardCharts({ chartsJson }: { chartsJson: string }) {
  const lineRef = useRef<HTMLCanvasElement>(null);
  const formRef = useRef<HTMLCanvasElement>(null);
  const progRef = useRef<HTMLCanvasElement>(null);
  const formLegendRef = useRef<HTMLUListElement>(null);
  const progLegendRef = useRef<HTMLUListElement>(null);
  const inst = useRef<{ destroy: () => void }[]>([]);

  useEffect(() => {
    let data: DashData = {};
    try {
      data = JSON.parse(chartsJson || "{}") as DashData;
    } catch {
      data = {};
    }

    let cancelled = false;
    void (async () => {
      const { Chart, registerables } = await import("chart.js");
      Chart.register(...registerables);
      if (cancelled) return;
      inst.current.forEach((c) => c.destroy());
      inst.current = [];
      if (formLegendRef.current) formLegendRef.current.innerHTML = "";
      if (progLegendRef.current) progLegendRef.current.innerHTML = "";

      const font = { family: "var(--font-manrope), system-ui, sans-serif" };
      const grid = "rgba(255,255,255,0.06)";
      const tick = "#a1a1aa";
      const title = "#fafafa";
      const accent = "#fb923c";
      const accentSoft = "rgba(251, 146, 60, 0.15)";
      const success = "#4ade80";
      const successSoft = "rgba(74, 222, 128, 0.12)";
      const doughnutBorder = "#0a0a0a";

      const activity = data.activity ?? [];
      const labels = activity.map((x) => monthLabel(x.year, x.month));
      const submitted = activity.map((x) => x.submittedToCoachCount ?? 0);
      const closed = activity.map((x) => x.coachCompletedCount ?? 0);
      const hasLine =
        labels.length > 0 && (submitted.some((n) => n > 0) || closed.some((n) => n > 0)) && lineRef.current;

      if (hasLine && lineRef.current) {
        const chart = new Chart(lineRef.current, {
          type: "line",
          data: {
            labels,
            datasets: [
              {
                label: "Koça iletilen",
                data: submitted,
                borderColor: accent,
                backgroundColor: accentSoft,
                fill: true,
                tension: 0.35,
                pointRadius: 4,
                pointHoverRadius: 6,
              },
              {
                label: "Tamamlanan (inceleme)",
                data: closed,
                borderColor: success,
                backgroundColor: successSoft,
                fill: true,
                tension: 0.35,
                pointRadius: 4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: "index" },
            plugins: {
              legend: { position: "top", labels: { font, usePointStyle: true, color: title } },
            },
            scales: {
              x: { grid: { color: grid }, ticks: { font, color: tick } },
              y: { beginAtZero: true, ticks: { stepSize: 1, font, color: tick }, grid: { color: grid } },
            },
          },
        });
        inst.current.push(chart);
      }

      function doughnut(canvas: HTMLCanvasElement | null, slices: Slice[] | undefined, legendEl: HTMLElement | null) {
        if (!canvas || !slices?.length) return;
        const total = slices.reduce((s, x) => s + (x.count ?? 0), 0);
        if (total === 0) return;
        const chart = new Chart(canvas, {
          type: "doughnut",
          data: {
            labels: slices.map((x) => x.label),
            datasets: [
              {
                data: slices.map((x) => x.count),
                backgroundColor: slices.map((x) => x.color),
                borderWidth: 2,
                borderColor: doughnutBorder,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "62%",
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label(ctx) {
                    const v = Number(ctx.raw) || 0;
                    const pct = total ? Math.round((v / total) * 100) : 0;
                    return `${ctx.label}: ${v} (${pct}%)`;
                  },
                },
              },
            },
          },
        });
        inst.current.push(chart);
        if (legendEl) {
          legendEl.innerHTML = slices
            .map(
              (x) =>
                `<li class="flex items-center gap-2 text-xs text-zinc-300 mb-1"><span class="h-2 w-2 shrink-0 rounded-full" style="background:${x.color}"></span><span>${x.label}</span><span class="ml-auto font-semibold text-white">${x.count}</span></li>`,
            )
            .join("");
        }
      }

      doughnut(formRef.current, data.formSlices, formLegendRef.current);
      doughnut(progRef.current, data.programSlices, progLegendRef.current);
    })();

    return () => {
      cancelled = true;
      inst.current.forEach((c) => c.destroy());
      inst.current = [];
    };
  }, [chartsJson]);

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-8 rounded-2xl border border-white/10 bg-pf-card/40 p-4 md:p-5">
        <h2 className="text-sm font-bold text-white">Aylık form akışı</h2>
        <p className="text-xs text-zinc-500">Son 6 ay — koça iletilen ve tamamlanan (UTC)</p>
        <div className="mt-4 h-[280px] w-full">
          <canvas ref={lineRef} aria-label="Aylık form grafiği" />
        </div>
      </div>
      <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-pf-card/40 p-4 md:p-5">
        <h2 className="text-sm font-bold text-white">Güncel form durumu</h2>
        <p className="text-xs text-zinc-500">Öğrenci başına son form</p>
        <div className="mt-4 flex flex-col items-center">
          <div className="h-[220px] w-full max-w-[260px]">
            <canvas ref={formRef} aria-label="Form durum dağılımı" />
          </div>
          <ul ref={formLegendRef} className="mt-3 w-full max-w-xs space-y-0.5" />
        </div>
      </div>
      <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-pf-card/40 p-4 md:p-5">
        <h2 className="text-sm font-bold text-white">Program envanteri</h2>
        <p className="text-xs text-zinc-500">Tüm sürümler — duruma göre</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
          <div className="h-[200px] w-[200px]">
            <canvas ref={progRef} aria-label="Program durumları" />
          </div>
          <ul ref={progLegendRef} className="min-w-[10rem] flex-1 space-y-0.5 text-sm" />
        </div>
      </div>
    </div>
  );
}
