import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { getPublicSiteMeta } from "@/lib/api/public-site";

export async function generateMetadata(): Promise<Metadata> {
  const m = await getPublicSiteMeta();
  const p = m?.pages?.terms;
  return {
    title: p?.title?.split("|")[0]?.trim() ?? "Kullanım şartları",
    description: p?.metaDescription ?? "PT Fraoula platform kullanım şartları.",
  };
}

const items = [
  "Platform, koçluk ve eğitim içeriği sunar; tıbbi teşhis veya tedavi vaadi içermez.",
  "Kullanıcılar hesap güvenliğinden ve paylaştıkları bilgilerin doğruluğundan sorumludur.",
  "Ödeme ve aktivasyon koşulları ilgili paket sayfasında ve satın alma akışında belirtilir.",
  "Hizmet sürekliliği için makul çaba gösterilir; kesintisiz erişim garanti edilmez.",
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 lg:px-6">
      <PageHeader
        eyebrow="Yasal"
        title="Kullanım şartları"
        lead="Platform kullanımına dair özet şartlar. Yayına almadan önce hukuki inceleme ile güncelleyin."
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
