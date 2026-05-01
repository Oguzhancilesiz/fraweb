import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { listPublicPackages } from "@/lib/api/public-packages";
import { formatDisplayPrice } from "@/lib/packages/entitlements";
import { routes } from "@/lib/site";

export const metadata: Metadata = {
  title: "Koçluk paketleri",
  description: "Süre, destek türü ve canlı sohbet hakları — güncel katalog API üzerinden yüklenir.",
};

export default async function PackagesPage() {
  const packages = await listPublicPackages();
  const empty = !packages?.length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-6">
      <PageHeader
        eyebrow="Paket kataloğu"
        title="Koçluk paketleri"
        lead="Aktif paketler sunucudan gelir. API erişilemezse veya liste boşsa aşağıda bilgilendirme görürsün."
      />
      {empty ? (
        <div className="pf-public-package-card rounded-2xl border border-white/10 bg-pf-raised/40 p-8 text-center text-sm text-zinc-400">
          <p>Şu an vitrinde paket bulunamadı veya katalog yüklenemedi.</p>
          <p className="mt-3">
            <Link className="font-bold text-pf-orange-bright underline-offset-2 hover:underline" href={routes.contact}>
              İletişime geç
            </Link>
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {packages!.map((p) => {
            const highlights =
              p.highlightLinesShopPreview?.length > 0 ? p.highlightLinesShopPreview : p.highlightLines.slice(0, 5);
            const priceLabel = formatDisplayPrice(p.priceAmount, p.currency, p.displayPriceText);
            return (
              <article
                key={p.slug}
                className="pf-public-package-card flex flex-col gap-4 rounded-2xl border-2 border-white/10 bg-pf-card/50 p-6 md:flex-row md:items-stretch"
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {p.packageTier ? (
                      <span className="rounded-full bg-pf-orange/20 px-2 py-0.5 text-xs font-bold text-pf-orange-bright">
                        {p.packageTier}
                      </span>
                    ) : null}
                    <span className="pf-ppc-chip rounded-full bg-pf-void px-2 py-0.5 text-xs">
                      {p.durationDays} gün
                    </span>
                    {p.includesLiveCoachChat ? (
                      <span className="rounded-full bg-pf-orange/18 px-2 py-0.5 text-xs font-bold text-pf-orange-bright">
                        Canlı sohbet
                      </span>
                    ) : null}
                  </div>
                  <h2 className="pf-ppc-title font-display mt-2 text-xl font-bold text-white">{p.name}</h2>
                  {p.tagline ? <p className="pf-ppc-muted text-sm text-zinc-500">{p.tagline}</p> : null}
                  {p.description ? <p className="pf-ppc-body mt-2 text-sm text-zinc-400">{p.description}</p> : null}
                  {p.isPurchasable ? (
                    <p className="mt-2 font-display text-2xl font-bold text-pf-orange-bright">{priceLabel}</p>
                  ) : (
                    <p className="pf-ppc-muted mt-2 text-sm font-bold text-zinc-500">Şu an satışa kapalı</p>
                  )}
                </div>
                <div className="pf-ppc-aside w-full max-w-sm rounded-xl border border-white/10 bg-pf-void/50 p-4 text-sm">
                  <p className="pf-ppc-aside-heading text-xs font-bold uppercase text-pf-mist">Özellikler (özet)</p>
                  <ul className="pf-ppc-list mt-2 list-inside list-disc text-zinc-500">
                    {highlights.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/paketler/${encodeURIComponent(p.slug)}`}
                      className="pf-ppc-outline-btn rounded-full border border-white/20 px-4 py-1.5 text-xs font-bold"
                    >
                      Detay
                    </Link>
                    {p.isPurchasable ? (
                      <span className="rounded-full bg-gradient-to-r from-pf-orange to-pink-500 px-4 py-1.5 text-xs font-bold text-black shadow-sm">
                        Satın alma — detay sayfasından
                      </span>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
