import Image from "next/image";
import { marketingImages } from "@/components/marketing/marketing-assets";

const steps = [
  {
    step: "Adım 1",
    title: "Profil & hedef",
    text: "Süre, ekipman, geçmiş ve gününe uyan günler — kısa bir yönlendirmeyle net çizgi çizilir.",
  },
  {
    step: "Adım 2",
    title: "Eşleşme & plan",
    text: "Ağırlık, tempo ve sağlık sınırlarınla uyumlu program taslağını görürsün; ilk haftanın odağı belli.",
  },
  {
    step: "Adım 3",
    title: "İlk hafta & geri bildirim",
    text: "Hareket kalitesi video ve check-in ile ince ayar. Net talimat, az gürültü.",
  },
];

export function ProcessSection() {
  return (
    <section id="nasil-calisir" className="pf-site-section-muted scroll-mt-24 border-b border-white/5 py-[4rem] transition-colors duration-300 sm:py-[4.75rem]">
      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.95fr)]">
          <div>
            <p className="text-center text-public-label text-xs font-bold uppercase tracking-[0.2em] lg:text-left">
              Sahada uygulama
            </p>
            <h2 className="font-display mt-2 text-center text-3xl font-bold text-public-strong sm:text-4xl lg:text-left">
              3 adımda ileri git
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-public-muted lg:mx-0 lg:text-left">
              Tam akış: paket, ödeme, öğrenci alanı ve koç desteği. Üst düzey rehber için{" "}
              <a href="/nasil-calisir" className="font-bold text-pf-orange-bright underline-offset-4 hover:text-pink-400 hover:underline">
                Nasıl çalışır?
              </a>{" "}
              sayfasına göz at.
            </p>
            <div className="mt-11 grid gap-5 md:grid-cols-3">
              {steps.map((s) => (
                <div
                  key={s.title}
                  className="border-public-card bg-public-elevated group relative rounded-2xl border border-pf-orange/15 bg-gradient-to-b from-transparent to-pf-orange/5 p-5 transition hover:border-pf-pink/30"
                  style={{
                    clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%)",
                  }}
                >
                  <span className="text-xs font-bold uppercase tracking-wide text-pf-pink">{s.step}</span>
                  <h3 className="font-display mt-2 text-xl font-bold text-public-strong">{s.title}</h3>
                  <p className="mt-3 text-sm text-public-muted">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative isolate hidden lg:block">
            <div
              className="pointer-events-none absolute -inset-3 rounded-[1.85rem] bg-gradient-to-bl from-pf-orange/30 to-pf-pink/25 opacity-80 blur-xl"
              aria-hidden
            />
            <div className="border-public-card relative aspect-[4/5] overflow-hidden rounded-2xl border shadow-2xl">
              <Image
                src={marketingImages.processTeam}
                alt="Ağırlık antrenmanı yapan sporcular"
                fill
                className="object-cover"
                sizes="360px"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/75 via-transparent to-pf-orange/15" aria-hidden />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-public-label text-[11px] font-bold uppercase tracking-[0.2em]">
                  Süreç güvencesi
                </p>
                <p className="font-display mt-1 text-xl font-bold text-white">Her haftaya net çıktılar</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
