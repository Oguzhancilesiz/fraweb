import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { getPublicPackageBySlug } from "@/lib/api/public-packages";
import {
  formatDisplayPrice,
  formatLiveChatImages,
  formatLiveChatMessages,
  formatMonthlyQa,
} from "@/lib/packages/entitlements";
import { PackageCheckoutClient } from "@/components/packages/PackageCheckoutClient";
import { routes } from "@/lib/site";

export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicPackageBySlug(slug);
  const p = data?.package;
  if (!p) return { title: "Paket" };
  return {
    title: p.name,
    description: (p.tagline ?? p.description ?? "").trim() || undefined,
  };
}

export default async function PackageDetailPage({ params }: Props) {
  const { slug } = await params;
  const data = await getPublicPackageBySlug(slug);
  const p = data?.package;
  if (!p) notFound();

  const priceLabel = formatDisplayPrice(p.priceAmount, p.currency, p.displayPriceText);
  const assessmentLabel = p.allowsMonthlyAssessment
    ? `Evet (ayda ${p.maxAssessmentsPerMonth ?? 0})`
    : "Hayır";
  const videoLabel =
    !p.totalVideoCallSessions || p.totalVideoCallSessions <= 0
      ? "Dahil değil"
      : `${p.totalVideoCallSessions} seans (paket süresince)`;

  return (
    <div className="pf-public-package-detail mx-auto max-w-3xl px-4 py-10 lg:px-6">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-zinc-500">
        <ol className="flex flex-wrap gap-1">
          <li>
            <Link href={routes.packages} className="font-semibold text-pf-orange-bright hover:underline">
              Paketler
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-zinc-400">{p.name}</li>
        </ol>
      </nav>
      <PageHeader
        eyebrow="Paket detayı"
        title={p.name}
        lead={(p.tagline ?? p.description ?? "Süre, haklar ve paket kapsamı aşağıda.").trim()}
      />
      <p className="font-display text-2xl font-bold text-pf-orange-bright">{priceLabel}</p>
      <div className="prose-pf mt-6 space-y-4 text-sm text-zinc-300">
        <p>{p.detailedDescription ?? p.description ?? "Bu paket için açıklama yakında eklenecek."}</p>
        {p.highlightLines.length > 0 ? (
          <div className="rounded-2xl border border-white/10 bg-pf-raised/40 p-4">
            <p className="text-xs font-bold uppercase text-pf-mist">Pakete dahil</p>
            <ul className="mt-2 list-inside list-disc text-zinc-400">
              {p.highlightLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-4 rounded-2xl border border-white/10 bg-pf-void/50 p-4 text-sm">
          <div>
            <span className="block text-xs text-zinc-500">Süre</span>
            <span className="font-bold text-white">{p.durationDays} gün</span>
          </div>
          <div>
            <span className="block text-xs text-zinc-500">Ödeme</span>
            <span className="font-bold text-white">Shopier</span>
          </div>
          <div>
            <span className="block text-xs text-zinc-500">Program kotası</span>
            <span className="font-bold text-white">{p.maxProgramsActive ?? 1} eşzamanlı</span>
          </div>
          <div>
            <span className="block text-xs text-zinc-500">Aylık değerlendirme</span>
            <span className="font-bold text-white">{assessmentLabel}</span>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-pf-raised/30 p-4">
          <p className="text-xs font-bold uppercase text-pf-mist">Paket hakları</p>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-[minmax(0,140px)_1fr]">
            <dt className="text-zinc-500">Soru–cevap (aylık)</dt>
            <dd className="font-semibold text-zinc-200">{formatMonthlyQa(p.monthlyQaAllowance ?? 0)}</dd>
            <dt className="text-zinc-500">Görüntülü görüşme</dt>
            <dd className="font-semibold text-zinc-200">{videoLabel}</dd>
            <dt className="text-zinc-500">WhatsApp desteği</dt>
            <dd className="font-semibold text-zinc-200">{p.includesWhatsAppSupport ? "Evet" : "Hayır"}</dd>
            <dt className="text-zinc-500">Sesli yanıt</dt>
            <dd className="font-semibold text-zinc-200">{p.includesVoiceReplies ? "Evet" : "Hayır"}</dd>
            <dt className="text-zinc-500">Kan tahlili yorumu</dt>
            <dd className="font-semibold text-zinc-200">{p.includesBloodWorkReview ? "Evet" : "Hayır"}</dd>
            <dt className="text-zinc-500">Gıda intolerans</dt>
            <dd className="font-semibold text-zinc-200">{p.includesIntoleranceTest ? "Evet" : "Hayır"}</dd>
            <dt className="text-zinc-500">Kür planlaması</dt>
            <dd className="font-semibold text-zinc-200">{p.includesCyclePlanning ? "Evet" : "Hayır"}</dd>
            <dt className="text-zinc-500">Canlı koç sohbeti</dt>
            <dd className="font-semibold text-zinc-200">{p.includesLiveCoachChat ? "Evet" : "Hayır"}</dd>
            {p.includesLiveCoachChat ? (
              <>
                <dt className="text-zinc-500">Sohbet mesaj kotası</dt>
                <dd className="font-semibold text-zinc-200">
                  {formatLiveChatMessages(p.liveChatStudentMessageQuota ?? 0)}
                </dd>
                <dt className="text-zinc-500">Sohbet görsel kotası</dt>
                <dd className="font-semibold text-zinc-200">
                  {formatLiveChatImages(p.liveChatStudentImageQuota ?? 0)}
                </dd>
              </>
            ) : null}
          </dl>
          <p className="mt-3 text-xs text-zinc-500">
            Ödeme onayında bu haklar hesabına kilitlenir; paket tanımı sonradan değişse bile satın aldığın haklar korunur.
          </p>
        </div>
        {!p.isPurchasable ? (
          <p className="rounded-xl border border-zinc-600/50 bg-pf-void/60 p-3 text-xs text-zinc-400" role="status">
            Bu paket şu an satışa kapalı. İçeriği inceleyebilirsin; ödeme başlatılamaz.
          </p>
        ) : null}
        {p.isPurchasable ? (
          <PackageCheckoutClient
            packageId={p.id}
            slug={p.slug}
            packageName={p.name}
            isPurchasable={p.isPurchasable}
            coaches={(data?.selectableCoaches ?? []).map((c) => ({
              id: String(c.id),
              displayName: c.displayName,
            }))}
          />
        ) : null}
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href={routes.packages}
            className="rounded-full border border-white/20 px-4 py-2 text-xs font-bold hover:border-pf-green/50"
          >
            Tüm paketlere dön
          </Link>
          <Link href={routes.contact} className="rounded-full bg-pf-orange px-4 py-2 text-xs font-bold text-black">
            Soru sor
          </Link>
        </div>
      </div>
    </div>
  );
}
