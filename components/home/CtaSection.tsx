import Link from "next/link";
import { routes } from "@/lib/site";

export function CtaSection() {
  return (
    <section className="pb-[4rem] pt-4 sm:pb-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="border-public-card bg-public-deep relative overflow-hidden rounded-3xl border p-10 text-center shadow-[0_40px_100px_-60px_rgba(236,72,153,0.55)] sm:p-14">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-[22rem] w-[22rem] rounded-full bg-gradient-to-br from-pf-orange/40 to-transparent blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-28 -left-20 h-[20rem] w-[20rem] rounded-full bg-gradient-to-tr from-pf-pink/35 to-transparent blur-3xl"
            aria-hidden
          />
          <h2 className="relative font-display text-2xl font-bold text-public-strong sm:text-[2rem]">Hâlâ emin değil misin?</h2>
          <p className="relative mx-auto mt-3 max-w-lg text-sm text-public-muted">
            Kısa bir ön görüşmede doğru paketi ve ilk adımını netleştirebilirsin. Satış baskısı yok; şeffaf yönlendirme.
          </p>
          <div className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={routes.contact}
              className="border-public-card w-full min-h-[3rem] content-center rounded-full border border-pf-pink/40 bg-gradient-to-br from-pf-pink/12 to-transparent px-8 py-3 text-sm font-bold text-pf-orange-bright backdrop-blur-sm transition hover:border-pf-orange/60 sm:w-auto"
            >
              Soru sor
            </Link>
            <Link
              href={routes.packages}
              className="w-full min-h-[3rem] content-center rounded-full bg-gradient-to-r from-pf-orange via-pf-orange-bright to-pink-500 px-8 py-3 text-center text-sm font-bold text-black shadow-lg hover:brightness-105 sm:w-auto"
            >
              Paketleri aç
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
