import Link from "next/link";
import { routes } from "@/lib/site";

export function OnboardingSection() {
  return (
    <section id="onboarding-demo" className="scroll-mt-24 border-y border-white/10 py-[4rem] transition-colors duration-300 sm:py-[4.75rem]">
      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        <div className="pf-onboarding-surface relative mx-auto max-w-3xl rounded-[1.75rem] border border-white/14 bg-gradient-to-br from-pf-raised/70 via-black/58 to-black/92 px-6 py-12 text-center shadow-[0_24px_64px_-32px_rgba(236,72,153,0.35)] sm:px-10 sm:py-14">
          <div
            className="pointer-events-none absolute inset-0 rounded-[1.75rem] opacity-[0.11]"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 120% 60% at 50% -20%, rgb(251 146 60), transparent 55%), radial-gradient(ellipse 80% 50% at 100% 100%, rgb(236 72 153), transparent 50%)",
            }}
            aria-hidden
          />
          <div className="relative text-zinc-50">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-pf-orange-bright">Başlangıç</p>
            <h2 className="font-display mt-2 text-3xl font-bold text-white sm:text-[2rem]">Kayıt akışı özet</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-white/76">
              Paket, ödeme ve hesap aktivasyonu tamamlanınca program, form ve (paket dahilinde) topluluğa aynı çatıdan
              erişirsin.
            </p>
            <ol className="mx-auto mt-9 max-w-2xl space-y-3 text-left text-sm text-white/82 sm:pl-2">
              <li className="flex gap-3">
                <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pf-orange/40 to-pf-pink/35 text-[11px] font-bold text-white">
                  1
                </span>
                <span>Katalogdan paket seç, güvenli ödeme akışına ilerle.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pf-orange/40 to-pf-pink/35 text-[11px] font-bold text-white">
                  2
                </span>
                <span>Ödeme sonrası e-posta doğrulama ve gerekiyorsa aktivasyon kodu.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pf-orange/40 to-pf-pink/35 text-[11px] font-bold text-white">
                  3
                </span>
                <span>Öğrenci paneli açılır — program ve değerlendirmeler (paket içeriğine göre).</span>
              </li>
            </ol>
            <div className="mt-11 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={routes.register}
                className="w-full min-h-[3rem] content-center rounded-full bg-gradient-to-r from-pf-orange to-pink-500 px-10 text-center text-sm font-bold text-black shadow-lg shadow-pf-orange/20 sm:w-auto"
              >
                Kayıt ol
              </Link>
              <Link
                href={routes.packages}
                className="w-full min-h-[3rem] content-center rounded-full border border-white/22 bg-black/42 px-8 text-center text-sm font-bold text-white backdrop-blur-sm transition hover:border-white/35 hover:bg-black/52 sm:w-auto"
              >
                Paketleri aç
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
