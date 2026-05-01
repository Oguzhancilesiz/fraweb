import Link from "next/link";
import { routes } from "@/lib/site";

const programs = [
  {
    title: "Birebir online koçluk",
    popular: true,
    desc: "Tam kişiselleştirme, doğrudan geri bildirim ve esnek iletişim.",
    forWhom: "Net hedef ve düzenli temas isteyenler.",
    highlight: "Haftalık plan revizyonu",
    details: ["Form kontrolü ve video geri bildirim", "Yaşam temposuna göre yoğunluk"],
  },
  {
    title: "Yağ yakımı programı",
    desc: "Kas kütlesini koruyarak yağ oranı düşürmeye odaklı bloklar.",
    forWhom: "Metabolik sağlık ve görünür sıkılaşma.",
    highlight: "Adım + güç kombinasyonu",
    details: ["NEAT hedefleri", "Protein ve doygunluk odaklı iskelet"],
  },
  {
    title: "Kas gelişimi programı",
    desc: "Progresyon, hacim ve toparlanma dengesi.",
    forWhom: "Güçlenmek ve şekil almak isteyenler.",
    highlight: "Set–tekrar günlüğü",
    details: ["Haftalık aşırı yüklenme", "Ekipman alternatifleri"],
  },
  {
    title: "Sıkılaşma programı",
    desc: "Core, duruş ve vücut hatlarına hedefli çalışma.",
    forWhom: "Ton ve güçlü duruş.",
    highlight: "Bölgesel güç + mobilite",
    details: ["Ev / salon split", "Kısa yoğunluk seansları"],
  },
  {
    title: "Başlangıç programı",
    desc: "Teknik temel, güven ve alışkanlık kazanımı.",
    forWhom: "Spor salonuna yeni başlayanlar.",
    highlight: "Hareket öğrenme modülleri",
    details: ["Video referans kütüphanesi", "Düşük riskli ilerleme"],
  },
];

export function ProgramsSection() {
  return (
    <section id="programlar" className="scroll-mt-24 border-y border-white/10 py-[4rem] transition-colors duration-300 sm:py-[4.75rem]">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="text-public-label text-xs font-bold uppercase tracking-[0.2em]">Hizmetler</p>
            <h2 className="font-display mt-2 text-3xl font-bold text-public-strong sm:text-4xl">Hedefe göre seçenekler</h2>
            <p className="mt-3 text-sm text-public-muted">
              Kartlarda kimler için olduğu ve büyük fayda özeti var. Özet satırlarını okuyarak hızlı
              tarayabilir, detayı aşağıdan açabilirsin.
            </p>
          </div>
          <Link
            href={routes.packages}
            className="inline-flex shrink-0 items-center rounded-full border border-pf-orange/45 bg-gradient-to-br from-pf-orange/12 to-transparent px-6 py-2.5 text-sm font-bold text-pf-orange-bright transition hover:border-pf-orange/70"
          >
            Canlı paket fiyatları
          </Link>
        </div>
        <div className="mt-11 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {programs.map((p) => (
            <article
              key={p.title}
              className="border-public-card bg-public-elevated flex flex-col rounded-2xl border p-6 pf-card-sheen transition hover:border-pf-orange/38"
            >
              {p.popular ? (
                <span className="mb-2 inline-flex w-fit rounded-full bg-gradient-to-r from-pf-orange/25 to-pf-pink/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-pf-orange-bright">
                  En çok tercih
                </span>
              ) : null}
              <h3 className="font-display text-lg font-bold text-public-strong">{p.title}</h3>
              <p className="mt-2 text-sm text-public-muted">{p.desc}</p>
              <p className="mt-4 text-xs text-public-body">
                <span className="text-public-soft">Kimler için:</span> {p.forWhom}
              </p>
              <p className="mt-2 text-xs">
                <span className="bg-gradient-to-r from-pf-orange-bright to-pf-pink bg-clip-text font-semibold text-transparent">
                  Öne çıkan:
                </span>{" "}
                <span className="text-public-body">{p.highlight}</span>
              </p>
              <details className="border-public-card mt-4 border-t pt-4 text-xs">
                <summary className="cursor-pointer font-semibold text-public-strong">Fayda özeti</summary>
                <ul className="mt-3 list-disc space-y-1.5 pl-4 text-public-muted">
                  {p.details.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </details>
              <div className="mt-5">
                <Link
                  href="/#onboarding-demo"
                  className="inline-block rounded-full border border-pf-pink/40 bg-gradient-to-r from-pf-orange/15 to-pf-pink/10 px-4 py-2 text-xs font-bold text-pf-orange-bright transition hover:border-pf-orange/55"
                >
                  Uygunluğumu değerlendir
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
