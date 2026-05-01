import Image from "next/image";
import Link from "next/link";
import { marketingImages } from "@/components/marketing/marketing-assets";
import { routes } from "@/lib/site";

const chips = ["Hedef odaklı plan", "Ölçülebilir haftalar", "Video & form geri bildirimi", "Şeffaf iletişim"];

const stats = [
  { n: "320+", l: "Aktif üye" },
  { n: "%97", l: "Memnuniyet" },
  { n: "7/7", l: "Destek hattı" },
  { n: "100%", l: "Kişiye özel" },
];

export function HeroSection() {
  return (
    <section id="ust" className="pf-mesh-hero relative scroll-mt-20 overflow-hidden border-b border-white/10 transition-colors duration-300">
      <div className="pf-glow-orb -left-20 top-20 h-72 w-72 bg-pf-orange/25" aria-hidden />
      <div className="pf-glow-orb -right-28 bottom-12 h-96 w-96 bg-pf-pink/20" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:py-20 lg:grid lg:grid-cols-[1.05fr_minmax(0,0.95fr)] lg:items-center lg:gap-14 lg:px-8 lg:py-28">
        <div className="relative z-[1]">
          <p className="text-public-label text-xs font-bold uppercase tracking-[0.22em]">
            Premium online fitness koçluğu
          </p>
          <h1 className="font-display mt-4 text-[2.125rem] font-bold leading-[1.08] tracking-tight text-public-strong sm:text-5xl lg:text-[3.05rem]">
            Hedefine giden yolu
            <span className="bg-gradient-to-r from-pf-orange-bright via-pf-orange to-pf-pink bg-clip-text text-transparent">
              {" "}
              birlikte
            </span>{" "}
            netleştiriyoruz
          </h1>
          <p className="mt-5 max-w-xl text-public-body text-[1.025rem] leading-relaxed">
            Bilgi kirliliği olmadan: kişiye özel plan, net metrikler ve sürdürülebilir rutin. Antrenman
            akışınız tek çatı altında — profesyonel takip ve sizi duyan iletişim.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/#onboarding-demo"
              className="inline-flex min-h-[2.75rem] items-center justify-center rounded-full bg-gradient-to-r from-pf-orange via-pf-orange-bright to-pink-500 px-7 text-sm font-bold text-black shadow-lg shadow-orange-900/35 transition hover:brightness-105"
            >
              Programa başla
            </Link>
            <Link
              href={routes.packages}
              className="border-public-card bg-public-deep inline-flex min-h-[2.75rem] items-center justify-center rounded-full border px-7 text-sm font-bold text-public-strong backdrop-blur-sm transition hover:border-pf-orange/45 hover:bg-pf-orange/8"
            >
              Paketleri incele
            </Link>
          </div>
          <p className="mt-5 text-sm text-public-muted">
            <Link href={routes.how} className="font-semibold text-pf-orange-bright underline-offset-2 hover:underline">
              Nasıl işlediğini
            </Link>{" "}
            oku · Yaklaşık <span className="font-medium text-public-body">bir dakikada</span> sana uygun yönü
            seçebilirsin.
          </p>
          <div className="mt-7 flex flex-wrap gap-2" role="group" aria-label="Odak başlıkları">
            {chips.map((c) => (
              <span key={c} className="border-public-card bg-public-deep rounded-xl border px-3 py-1.5 text-xs font-semibold text-public-body backdrop-blur-sm">
                {c}
              </span>
            ))}
          </div>
          <dl className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.l} className="border-public-card bg-public-deep rounded-2xl border px-3 py-3.5 text-center pf-card-sheen">
                <dt className="sr-only">{s.l}</dt>
                <dd className="font-display text-2xl font-bold text-pf-orange-bright">{s.n}</dd>
                <div className="mt-1 text-public-soft text-[11px] font-medium uppercase tracking-wide">{s.l}</div>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative z-[1] mt-14 lg:mt-0">
          <div
            className="pointer-events-none absolute -inset-3 rounded-[1.85rem] bg-gradient-to-br from-pf-orange/35 via-transparent to-pf-pink/30 opacity-85 blur-xl"
            aria-hidden
          />
          <div className="border-public-card relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-2xl border bg-gradient-to-b from-pf-raised to-pf-void shadow-2xl shadow-black/40 lg:mr-0">
            <Image
              src={marketingImages.heroCoach}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 1024px) min(520px, 100vw), 460px"
              priority
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/82 via-black/35 to-transparent"
              aria-hidden
            />
            <div className="absolute inset-x-0 bottom-0 p-7">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/72">Çalışma alanı</p>
              <p className="font-display mt-1.5 text-2xl font-bold text-white">Bilimsel ilerleme</p>
              <p className="mt-2 max-w-sm text-sm text-white/78">
                Güvenli yoğunluk artışı, net geri bildirim ve haftalık ölçülebilir adımlar.
              </p>
            </div>
            <div className="border-public-card bg-public-deep absolute right-4 top-4 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold text-pf-orange-bright backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-pf-orange pf-stat-pulse" aria-hidden />
              Sertifikalı eğitmen
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
