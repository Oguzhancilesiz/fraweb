import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { getPublicSiteMeta } from "@/lib/api/public-site";
import { routes } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const m = await getPublicSiteMeta();
  const p = m?.pages?.howItWorks;
  return {
    title: p?.title?.split("|")[0]?.trim() ?? "Nasıl çalışır?",
    description: p?.metaDescription ?? "Paket, ödeme, aktivasyon ve öğrenci alanında koçluk sürecinin adımları.",
  };
}

const steps = [
  {
    n: "01",
    title: "Paket seç",
    text: "Sana uygun koçluk paketini incele; canlı fiyat ve haklar katalogda. Ödeme sayfasına ilerle.",
  },
  {
    n: "02",
    title: "Ödeme ve aktivasyon",
    text: "Ödeme tamamlandıktan sonra hesabına aktivasyon kodunu uygula; öğrenci alanının açılır.",
  },
  {
    n: "03",
    title: "Öğrenci alanı",
    text: "Aylık değerlendirme formlarını doldur; programını, antrenman günlerini ve bildirimlerini buradan yönet.",
  },
  {
    n: "04",
    title: "Koç desteği",
    text: "Koç formlarını inceler, programı yayınlar, geri bildirim bırakır. Paketine göre canlı sohbet ve video hakları açılır.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-6">
      <PageHeader
        eyebrow="Şeffaf süreç"
        title="Nasıl çalışır?"
        lead="Dört adımda öğrenci alanına geçiş. Karmaşık formlar yok; her adımın amacı net. Bu ekran canlı uygulamadaki akışı özetler; gerçek ödeme ve veri yok."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {steps.map((s) => (
          <article
            key={s.n}
            className="relative flex gap-4 rounded-2xl border border-white/10 bg-pf-raised/40 p-5"
          >
            <span className="font-display text-3xl font-bold text-pf-green-bright/60">{s.n}</span>
            <div>
              <h2 className="font-display text-lg font-bold text-white">{s.title}</h2>
              <p className="mt-1 text-sm text-zinc-500">{s.text}</p>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-10 rounded-2xl border border-pf-orange/25 bg-pf-void/60 p-5">
        <h3 className="font-display text-lg font-bold">Hızlı yönlendirme</h3>
        <ul className="mt-3 flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:gap-3">
          <li>
            <Link className="font-bold text-pf-orange-bright underline-offset-2 hover:underline" href={routes.packages}>
              Paketlere git
            </Link>
          </li>
          <li>
            <Link className="font-bold text-pf-green-bright underline-offset-2 hover:underline" href={routes.register}>
              Öğrenci kaydı
            </Link>
          </li>
          <li>
            <Link className="font-bold text-white underline-offset-2 hover:underline" href={routes.contact}>
              Soru sor
            </Link>
          </li>
        </ul>
        <p className="mt-4 text-xs text-zinc-500">
          Ana sayfadaki demo bölümü ile deneyimi önizleyebilirsin: <Link href="/#onboarding-demo" className="text-pf-mist">onboarding-demo</Link>.
        </p>
      </div>
    </div>
  );
}
