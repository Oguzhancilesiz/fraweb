import Link from "next/link";
import { routes } from "@/lib/site";

const goals = [
  { label: "Yağ oranı", hint: "Kas korumalı deficit", id: "fat" },
  { label: "Kas inşası", hint: "Aşırı yüklenme ve beslenme", id: "muscle" },
  { label: "Duruş & core", hint: "Mobilite + güç", id: "posture" },
];

export function PathSection() {
  return (
    <section className="py-[4rem] sm:py-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="pf-home-path-shell relative overflow-hidden rounded-3xl border border-pf-orange/25 p-[1px] shadow-[0_32px_80px_-48px_rgba(249,115,22,0.45)]">
          <div className="pf-home-path-inner relative rounded-[1.365rem] px-6 py-11 sm:p-12">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.12]"
              aria-hidden
              style={{
                backgroundImage:
                  "radial-gradient(circle at 12% -10%, rgb(251 146 60), transparent 45%), radial-gradient(circle at 96% 100%, rgb(236 72 153), transparent 40%)",
              }}
            />
            <div className="relative">
              <p className="text-public-label text-xs font-bold uppercase tracking-[0.2em]">Yol haritası</p>
              <h2 className="font-display mt-2 max-w-xl text-2xl font-bold text-public-strong sm:text-3xl">
                Hedefe göre net bir ray
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-public-muted">
                Şablon değil, senin ritmin ve yaşam düzenin. Önce yön seç; paket yoğunluğu ve ilk hafta odağı buna göre
                şekillenir.
              </p>
              <div className="mt-9 grid gap-4 sm:grid-cols-3">
                {goals.map((g) => (
                  <div
                    key={g.id}
                    className="border-public-card pf-path-goal-card rounded-2xl border p-5 text-left backdrop-blur-sm transition hover:border-pf-orange/45"
                  >
                    <h3 className="font-display text-lg font-bold text-public-strong">{g.label}</h3>
                    <p className="mt-1 text-xs text-public-muted">{g.hint}</p>
                    <span className="pf-path-explore mt-4 inline-flex text-[11px] font-bold uppercase tracking-wide">
                      Keşfet →
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href={routes.packages}
                  className="rounded-full bg-gradient-to-r from-pf-orange to-pink-500 px-6 py-3 text-sm font-bold text-black shadow-lg shadow-pf-orange/20 transition hover:brightness-105"
                >
                  Kataloğu aç
                </Link>
                <Link
                  href={routes.contact}
                  className="pf-path-contact border-public-card rounded-full border px-6 py-3 text-sm font-bold backdrop-blur-sm transition hover:border-pf-pink/45"
                >
                  Bana uyanı sor
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
