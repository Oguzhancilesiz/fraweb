import Image from "next/image";
import Link from "next/link";
import { marketingImages } from "@/components/marketing/marketing-assets";
import type { PublicBeforeAfterSpotlightDto } from "@/lib/api/public-before-after-spotlight";
import { resolveMediaUrl } from "@/lib/media";
import { routes } from "@/lib/site";

const fallbackMarketing = [
  { key: "a", label: "12 hafta", sub: "Yağ + kuvvet dengesi", unified: marketingImages.spotlightA },
  { key: "b", label: "8 hafta", sub: "Postür & core", unified: marketingImages.spotlightB },
  { key: "c", label: "16 hafta", sub: "Kas kütlesi", unified: marketingImages.spotlightC },
  { key: "d", label: "6 hafta", sub: "Yoğun tempo reset", unified: marketingImages.spotlightD },
];

type SpotlightSectionProps = {
  rows?: PublicBeforeAfterSpotlightDto[];
};

function SpotlightApiCard({ row }: { row: PublicBeforeAfterSpotlightDto }) {
  const beforeSrc = resolveMediaUrl(row.beforeImageUrls[0]) ?? "";
  const afterSrc = resolveMediaUrl(row.afterImageUrls[0]) ?? "";
  if (!beforeSrc || !afterSrc) return null;

  const label = row.periodLabel?.trim() || row.heading;
  const sub = row.periodLabel?.trim() ? row.heading.slice(0, 80) : row.descriptionExcerpt.slice(0, 96);
  const href = `${routes.beforeAfter}?focusPost=${encodeURIComponent(row.postPublicId)}`;
  const unopt =
    beforeSrc.startsWith("http://localhost") ||
    beforeSrc.startsWith("http://127.0.0.1") ||
    afterSrc.startsWith("http://localhost") ||
    afterSrc.startsWith("http://127.0.0.1");

  return (
    <Link
      href={href}
      className="border-public-card group relative block aspect-[3/4] overflow-hidden rounded-2xl border shadow-lg outline-offset-4 transition hover:ring-2 hover:ring-pf-orange/40 focus-visible:outline focus-visible:outline-pf-orange/60"
    >
      <div className="absolute inset-0 flex">
        <div className="relative h-full min-w-0 flex-1">
          <Image
            src={beforeSrc}
            alt=""
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 23vw, 11vw"
            unoptimized={unopt}
          />
        </div>
        <div className="relative h-full min-w-0 flex-1">
          <Image
            src={afterSrc}
            alt=""
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 23vw, 11vw"
            unoptimized={unopt}
          />
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/38 to-transparent" aria-hidden />
      <div
        className="absolute left-[50%] top-[46%] z-[1] w-[110%] -translate-x-[50%] rotate-[-2deg] border-t-2 border-dashed border-pf-orange/65"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 text-xs font-bold uppercase tracking-wide">
        <span className="w-fit rounded-md bg-black/65 px-1.5 py-0.5 text-[10px] text-white">Öncesi</span>
        <span className="ml-auto mt-auto w-fit rounded-md bg-black/68 px-1.5 py-0.5 text-[10px] text-pf-orange-bright">
          Sonrası
        </span>
      </div>
      {row.authorIsCoach ? (
        <span className="pointer-events-none absolute right-3 top-3 z-[2] rounded-md bg-black/55 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-pf-orange-bright backdrop-blur-sm">
          Koç
        </span>
      ) : null}
      <div className="absolute bottom-0 z-[2] w-full px-4 pb-4 pt-8">
        <p className="font-display text-sm font-bold text-white">{label}</p>
        <p className="mt-1 line-clamp-2 text-[11px] text-white/78">{sub || row.descriptionExcerpt}</p>
      </div>
    </Link>
  );
}

function SpotlightMarketingCard(b: { label: string; sub: string; unified: string }) {
  return (
    <div className="border-public-card group relative aspect-[3/4] overflow-hidden rounded-2xl border shadow-lg">
      <Image
        src={b.unified}
        alt=""
        fill
        className="object-cover transition duration-500 group-hover:scale-[1.04]"
        sizes="(max-width: 640px) 46vw, 22vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/38 to-transparent" aria-hidden />
      <div
        className="absolute left-0 top-[46%] w-full rotate-[-2deg] border-t-2 border-dashed border-pf-orange/55"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 text-xs font-bold uppercase tracking-wide">
        <span className="w-fit rounded-md bg-black/65 px-1.5 py-0.5 text-[10px] text-white">Öncesi</span>
        <span className="ml-auto mt-auto w-fit rounded-md bg-black/68 px-1.5 py-0.5 text-[10px] text-pf-orange-bright">
          Sonrası
        </span>
      </div>
      <div className="absolute bottom-0 w-full px-4 pb-4 pt-8">
        <p className="font-display text-sm font-bold text-white">{b.label}</p>
        <p className="mt-1 text-[11px] text-white/76">{b.sub}</p>
      </div>
    </div>
  );
}

export function SpotlightSection({ rows = [] }: SpotlightSectionProps) {
  const apiRowsOk = rows.filter((row) => {
    const b = resolveMediaUrl(row.beforeImageUrls[0]) ?? "";
    const a = resolveMediaUrl(row.afterImageUrls[0]) ?? "";
    return Boolean(b && a);
  });

  const gridItems =
    apiRowsOk.length > 0 ? (
      apiRowsOk.map((row) => <SpotlightApiCard key={row.postPublicId} row={row} />)
    ) : (
      fallbackMarketing.map((b) => (
        <SpotlightMarketingCard key={b.key} label={b.label} sub={b.sub} unified={b.unified} />
      ))
    );

  return (
    <section className="relative pb-6 pt-[4rem] sm:pb-10 sm:pt-[4.75rem]">
      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-xl">
            <p className="text-public-label text-xs font-bold uppercase tracking-[0.2em]">Öncesi &amp; sonrası</p>
            <h2 className="font-display mt-2 text-2xl font-bold text-public-strong sm:text-4xl">
              Dönüşüm vitrininden örnekler
            </h2>
            <p className="mt-3 text-sm text-public-muted">
              {apiRowsOk.length > 0 ? (
                <>
                  Onaylanmış vitrin içerikleri; önce koç paylaşımları, ana sayfa vitrinine izin veren üye
                  hikâyelerini gösteriyoruz. Kendi dönüşümünü eklemek için panele bağlan.
                </>
              ) : (
                <>
                  Örnek görseller; vitrin içeriği eklendiğinde burası veritabanından otomatik dolar. Kendi sürecini
                  vitrine taşımak için panele bağlanarak devam et.
                </>
              )}
            </p>
          </div>
          <Link
            href={routes.beforeAfter}
            className="border-public-card inline-flex min-h-[2.75rem] items-center justify-center rounded-full border border-pf-orange/55 bg-white/92 px-6 py-2.5 text-sm font-bold text-orange-950 shadow-sm backdrop-blur-sm transition hover:border-pf-orange hover:bg-orange-50/95 sm:py-3 dark:border-pf-orange/40 dark:bg-transparent dark:bg-gradient-to-r dark:from-pf-orange/18 dark:via-pink-500/14 dark:to-transparent dark:text-pf-orange-bright dark:hover:text-orange-50"
          >
            Tüm dönüşümler
          </Link>
        </div>
        <div className="mt-11 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">{gridItems}</div>
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent via-[rgb(254_243_237_/0.75)] to-[rgb(255_252_249_/0.98)] dark:via-black/48 dark:to-black/82"
        aria-hidden
      />
    </section>
  );
}
