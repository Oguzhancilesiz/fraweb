import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { getPublicSiteMeta } from "@/lib/api/public-site";

export async function generateMetadata(): Promise<Metadata> {
  const m = await getPublicSiteMeta();
  const p = m?.pages?.privacy;
  return {
    title: p?.title?.split("|")[0]?.trim() ?? "Gizlilik",
    description: p?.metaDescription ?? "PT Fraoula gizlilik ve kişisel veri işleme bilgilendirmesi.",
  };
}

const items = [
  "Kişisel verileriniz yalnızca hizmet sunumu, faturalandırma ve yasal yükümlülükler için işlenir.",
  "Ödeme sağlayıcısı (ör. Shopier) işlemleri kendi gizlilik politikası kapsamında yürütür.",
  "Antrenman ve sağlıkla ilgili girdiğiniz verileri paylaşma tercihi size aittir; koç yalnızca yetkili olduğu ölçüde erişir.",
  "Hesabınızı ve şifrenizi kimseyle paylaşmayın.",
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 lg:px-6">
      <PageHeader
        eyebrow="Yasal"
        title="Gizlilik"
        lead="Kişisel verilerin nasıl işlendiğine dair özet bilgilendirme. Kesin metin ve hukuki onay için içeriği güncel tutun."
      />
      <ul className="space-y-4 rounded-2xl border border-white/10 bg-pf-raised/40 p-6 text-sm leading-relaxed text-zinc-400">
        {items.map((t) => (
          <li key={t} className="pl-1">
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}
