import Image from "next/image";
import { marketingImages } from "@/components/marketing/marketing-assets";

const items = [
  "Kişiye özel planlama ve haftalık güncelleme",
  "Düzenli geri bildirim ve form düzeltmeleri",
  "Sürdürülebilir beslenme ve yaşam düzeni",
  "Yargısız, net ve profesyonel iletişim",
];

const tiles = [
  {
    title: "Değerlendirme",
    text: "Postür, hareket kalitesi ve hedefe göre başlangıç profili.",
    icon: "📋",
  },
  {
    title: "İlerleme",
    text: "Haftalık özet ve ay sonu raporlarıyla görünürlük.",
    icon: "📈",
  },
  {
    title: "Sağlık & güvenlik",
    text: "Ağrı, döngü, stres — plana dâhil, kontrollü yoğunluk.",
    icon: "🛡️",
  },
  {
    title: "Takım hissi",
    text: "Yalnız değilsin; hızlı dönüş, net yönlendirme.",
    icon: "🤝",
  },
];

export function AboutSection() {
  return (
    <section id="hakkimda" className="scroll-mt-24 py-[4.25rem] sm:py-24">
      <div className="mx-auto max-w-7xl space-y-12 px-4 lg:space-y-16 lg:px-8">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] lg:gap-16">
          <div>
            <p className="text-public-label text-xs font-bold uppercase tracking-[0.2em]">Hakkımızda</p>
            <h2 className="font-display mt-3 text-3xl font-bold text-public-strong sm:text-4xl">Merhaba, PT Fraoula</h2>
            <p className="mt-4 text-sm leading-relaxed text-public-body">
              Online koçlukta uzun süredir öğrencilerle birlikteyiz. Amacımız{" "}
              <strong className="text-public-strong">hayatına uyan, ölçülebilir ve güvenli</strong> bir
              antrenman sistemi kurman.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-public-body">
              Yaklaşımımız: bilimsel planlama, şeffaf iletişim ve seni gerçekten dinleyen bir takip. Her vücut
              benzersiz; şablon yok, <span className="font-semibold text-pf-orange-bright">senin tempon</span>{" "}
              geçerli.
            </p>
            <ul className="mt-7 space-y-3">
              {items.map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-sm text-public-body">
                  <span className="mt-0.5 font-bold text-pf-pink" aria-hidden>
                    ✓
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative lg:justify-self-end">
            <div
              className="pointer-events-none absolute -inset-1 rounded-[1.65rem] bg-gradient-to-br from-pf-orange/28 via-transparent to-pf-pink/22 opacity-85 blur-xl"
              aria-hidden
            />
            <div className="border-public-card bg-public-deep relative aspect-[5/6] w-full max-w-[420px] overflow-hidden rounded-2xl border shadow-xl">
              <Image
                src={marketingImages.aboutStudio}
                alt="Antrenman alanında çalışan sporcular"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 96vw, 400px"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/65 via-transparent to-pf-pink/10" aria-hidden />
            </div>
            <div className="border-public-card bg-public-deep absolute -bottom-4 left-4 max-w-[13rem] rounded-xl border px-4 py-3 text-xs shadow-lg backdrop-blur-md">
              <p className="text-public-label uppercase tracking-wide">Öne çıkan</p>
              <p className="mt-1 font-semibold text-public-strong">Uzaktan net form düzeltmesi</p>
            </div>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {tiles.map((t) => (
            <article
              key={t.title}
              className="border-public-card bg-public-elevated rounded-2xl border p-5 pf-card-sheen transition hover:border-pf-orange/35"
            >
              <div className="text-2xl opacity-95" aria-hidden>
                {t.icon}
              </div>
              <h3 className="font-display mt-3 text-public-strong text-sm font-bold">{t.title}</h3>
              <p className="mt-1 text-xs text-public-muted">{t.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
