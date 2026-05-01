"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { primaryDashboardPath } from "@/lib/auth/paths";
import { PageHeader } from "@/components/PageHeader";
import { routes } from "@/lib/site";
import type { StudentPackageRowJson } from "@/lib/api/types-dashboard";
import { DashboardShell, EmptyState, ErrorState, LoadingState, SectionCard } from "@/components/dashboard/DashboardUI";

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("tr-TR", { dateStyle: "medium" });
  } catch {
    return iso;
  }
}

function fmtDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function packageStatusLabel(s: number | undefined) {
  if (s === 1) return "Aktif";
  if (s === 0) return "Aktivasyon bekliyor";
  if (s === 2) return "Süresi doldu";
  if (s === 3) return "İptal";
  return "Durum bilinmiyor";
}

function YesNo({ value }: { value: boolean | undefined }) {
  const v = value === true;
  return (
    <span className={v ? "font-medium text-emerald-300" : "text-zinc-500"}>{v ? "Dahil" : "Dahil değil"}</span>
  );
}

function QuotaMeter({
  label,
  used,
  quota,
  unitLabel,
}: {
  label: string;
  used: number;
  quota: number;
  unitLabel: string;
}) {
  if (quota <= 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
        <p className="text-xs font-medium text-zinc-400">{label}</p>
        <p className="mt-0.5 text-sm text-zinc-500">Bu pakette {unitLabel.toLowerCase()} hakkı tanımlı değil.</p>
      </div>
    );
  }

  const u = Math.max(0, used);
  const usedPct = Math.min(100, (u / quota) * 100);
  const remaining = Math.max(0, quota - u);

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-medium text-zinc-300">{label}</p>
        <p className="text-xs text-zinc-400">
          <span className="font-semibold text-white">{remaining}</span> / {quota} kalan
        </p>
      </div>
      <p className="mt-0.5 text-[11px] text-zinc-500">
        Kullanılan: {u} {unitLabel}
      </p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800" aria-hidden>
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-500/90 to-emerald-500/90 transition-[width]"
          style={{ width: `${100 - usedPct}%` }}
        />
      </div>
    </div>
  );
}

function LiveChatBlock({ p }: { p: StudentPackageRowJson }) {
  const live = p.includesLiveCoachChat === true;
  if (!live) {
    return (
      <div className="rounded-xl border border-white/10 bg-pf-void/30 px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Canlı koç sohbeti</p>
        <p className="mt-1 text-sm text-zinc-400">Bu pakette panel içi canlı sohbet tanımlı değil.</p>
      </div>
    );
  }

  const msgQ = p.liveChatMessageQuota ?? 0;
  const imgQ = p.liveChatImageQuota ?? 0;
  const msgUsed = p.liveChatMessagesUsed ?? 0;
  const imgUsed = p.liveChatImagesUsed ?? 0;
  const unlimitedMsg = msgQ === -1;

  return (
    <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-200/90">Canlı koç sohbeti (panel içi)</p>
        <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-100">Açık</span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-zinc-300">
        Koçunla yazılı mesaj ve (hak varsa) görsel paylaşımı bu özellik üzerinden yapılır. Haklar paket satın aldığın andaki tanıma göre sabittir.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {unlimitedMsg ? (
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
            <p className="text-xs font-medium text-zinc-300">Metin mesajı</p>
            <p className="mt-1 text-sm text-white">Sınırsız</p>
            <p className="mt-0.5 text-[11px] text-zinc-500">Şu ana kadar gönderilen: {msgUsed}</p>
          </div>
        ) : (
          <QuotaMeter label="Metin mesajı" used={msgUsed} quota={msgQ} unitLabel="mesaj" />
        )}
        <QuotaMeter label="Görsel eki" used={imgUsed} quota={imgQ} unitLabel="görsel" />
      </div>
      {p.liveChatStatusSummary?.trim() ? (
        <p className="mt-3 text-[11px] leading-snug text-zinc-500">{p.liveChatStatusSummary}</p>
      ) : null}
    </div>
  );
}

function PackageCard({ p }: { p: StudentPackageRowJson }) {
  const status = p.status;
  const isActive = status === 1;
  const highlights = p.packageHighlights?.length ? p.packageHighlights : p.packageHighlightsPreview ?? [];

  const entitlementRows: { label: string; value: ReactNode }[] = [
    { label: "Aylık soru–cevap (koça yazılı)", value: p.monthlyQaAllowanceDisplay ?? "—" },
    { label: "Görüntülü görüşme", value: p.totalVideoCallSessionsDisplay ?? "—" },
    { label: "WhatsApp desteği", value: <YesNo value={p.includesWhatsAppSupport} /> },
    { label: "Sesli yanıt (koçtan)", value: <YesNo value={p.includesVoiceReplies} /> },
    { label: "Kan tahlili yorumu", value: <YesNo value={p.includesBloodWorkReview} /> },
    { label: "Gıda intolerans testi / yorum", value: <YesNo value={p.includesIntoleranceTest} /> },
    { label: "Kür / döngü planlaması", value: <YesNo value={p.includesCyclePlanning} /> },
  ];

  return (
    <article className="flex flex-col rounded-2xl border border-white/10 bg-pf-card/40 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-white sm:text-2xl">{p.packageName}</h2>
          {p.packageTagline ? <p className="mt-1 max-w-prose text-sm text-zinc-400">{p.packageTagline}</p> : null}
        </div>
        <span
          className={
            isActive
              ? "shrink-0 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-100"
              : "shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-zinc-400"
          }
        >
          {packageStatusLabel(status)}
        </span>
      </div>

      <p className="mt-4 text-sm text-zinc-300">
        <span className="font-medium text-zinc-200">Paket süresi:</span> {fmtDate(p.startsAtUtc)} — {fmtDate(p.endsAtUtc)}
      </p>

      {highlights.length > 0 ? (
        <section className="mt-5 rounded-xl border border-pf-orange/20 bg-pf-orange/5 px-4 py-3">
          <h3 className="text-xs font-bold uppercase tracking-wide text-pf-orange-bright">Pakette öne çıkanlar</h3>
          <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm leading-relaxed text-zinc-200">
            {highlights.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-5">
        <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-500">Haklar ve içerik</h3>
        <dl className="mt-3 divide-y divide-white/5 rounded-xl border border-white/10">
          {entitlementRows.map((row) => (
            <div key={row.label} className="grid gap-1 px-3 py-2.5 sm:grid-cols-[minmax(0,11rem)_1fr] sm:items-center sm:gap-4">
              <dt className="text-xs font-medium text-zinc-500">{row.label}</dt>
              <dd className="text-sm text-zinc-100">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-5">
        <LiveChatBlock p={p} />
      </section>

      {(p.paidAmount != null && p.paidAmount > 0) || p.paidAtUtc || p.paymentReference ? (
        <section className="mt-5 rounded-xl border border-white/5 bg-pf-void/30 px-3 py-2 text-xs text-zinc-500">
          {p.paidAmount != null && p.paidAmount > 0 ? (
            <p>
              <span className="text-zinc-400">Ödenen:</span>{" "}
              <span className="font-medium text-zinc-200">
                {p.paidAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                {p.currency ?? ""}
              </span>
            </p>
          ) : null}
          {p.paidAtUtc ? (
            <p className="mt-1">
              <span className="text-zinc-400">Ödeme zamanı:</span> {fmtDateTime(p.paidAtUtc)}
            </p>
          ) : null}
          {p.paymentReference ? (
            <p className="mt-1 break-all font-mono text-[11px] text-zinc-600">{p.paymentReference}</p>
          ) : null}
        </section>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {isActive && p.includesLiveCoachChat ? (
          <Link
            href={routes.studentLiveChat}
            className="inline-flex items-center justify-center rounded-xl bg-pf-orange-bright px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
          >
            Canlı sohbete git
          </Link>
        ) : null}
        {p.packageSlug ? (
          <Link
            href={`${routes.packages}/${encodeURIComponent(p.packageSlug)}`}
            className="inline-flex items-center justify-center rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-white/5"
          >
            Paket tanıtım sayfası
          </Link>
        ) : null}
      </div>
    </article>
  );
}

export function StudentPackagesClient() {
  const router = useRouter();
  const { token, ready, user } = useAuth();
  const [rows, setRows] = useState<StudentPackageRowJson[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace(`${routes.login}?returnUrl=${encodeURIComponent(routes.studentPackages)}`);
      return;
    }
    if (!user?.roles?.includes("Student")) {
      router.replace(primaryDashboardPath(user?.roles ?? []) ?? routes.home);
      return;
    }
    let cancel = false;
    void (async () => {
      setLoading(true);
      const r = await apiFetch<StudentPackageRowJson[]>("/api/v1/student/my-packages", { accessToken: token });
      if (cancel) return;
      if (!r.ok) {
        setErr(r.message);
        setRows([]);
      } else {
        setErr(null);
        setRows(Array.isArray(r.data) ? r.data : []);
      }
      setLoading(false);
    })();
    return () => {
      cancel = true;
    };
  }, [ready, token, user, router]);

  if (!ready || loading) return <LoadingState label="Paketlerin yükleniyor..." />;
  if (err) {
    return <ErrorState message={err} />;
  }

  return (
    <DashboardShell className="py-2">
      <PageHeader
        eyebrow="Öğrenci paneli"
        title="Paketlerim"
        lead="Her kartta paket süresi, mağazada vaat edilen öne çıkanlar, soru–cevap / görüntülü görüşme ve ek hizmetler satır satır listelenir. Canlı sohbet hakları ayrı kutuda; kalan kotanı ilerleme çubuğuyla görebilirsin."
      />

      {rows.length === 0 ? (
        <SectionCard>
          <EmptyState
            title="Paket kaydı bulunamadı"
            message="Aktif bir paketin olduğunda haklar ve kullanım durumu bu ekranda görünecek."
            action={
              <Link href={routes.packages} className="rounded-full bg-pf-orange-bright px-3 py-1.5 text-xs font-semibold text-black">
                Paket mağazasına git
              </Link>
            }
          />
        </SectionCard>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {rows.map((p) => (
            <PackageCard key={p.studentPackageId} p={p} />
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
