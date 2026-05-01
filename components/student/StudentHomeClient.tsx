"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api/client";
import type {
  StudentHomeOverviewJson,
  StudentMonthlyAssessmentIndexJson,
  StudentPackageRowJson,
  StudentProgramOverviewJson,
} from "@/lib/api/types-dashboard";
import { primaryDashboardPath } from "@/lib/auth/paths";
import { routes } from "@/lib/site";
import { usePanelTheme } from "@/contexts/PanelThemeContext";
import {
  ActionCard,
  Badge,
  cn,
  DashboardShell,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  SectionCard,
  StatCard,
} from "@/components/dashboard/DashboardUI";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("tr-TR", { dateStyle: "medium" });
  } catch {
    return iso;
  }
}

function formatTodayLong() {
  try {
    return new Date().toLocaleDateString("tr-TR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return new Date().toLocaleDateString("tr-TR");
  }
}

export function StudentHomeClient() {
  const router = useRouter();
  const { theme, enabled } = usePanelTheme();
  const L = enabled && theme === "light";
  const { token, ready, user } = useAuth();
  const [data, setData] = useState<StudentHomeOverviewJson | null>(null);
  const [programData, setProgramData] = useState<StudentProgramOverviewJson | null>(null);
  const [assessmentData, setAssessmentData] = useState<StudentMonthlyAssessmentIndexJson | null>(null);
  const [packagesData, setPackagesData] = useState<StudentPackageRowJson[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace(`${routes.login}?returnUrl=${encodeURIComponent(routes.student)}`);
      return;
    }
    if (!user?.roles?.includes("Student")) {
      router.replace(primaryDashboardPath(user?.roles ?? []) ?? routes.home);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      const [r, prog, forms, packs] = await Promise.all([
        apiFetch<StudentHomeOverviewJson>("/api/v1/student/home/overview", { accessToken: token }),
        apiFetch<StudentProgramOverviewJson>("/api/v1/student/my-program/overview", { accessToken: token }),
        apiFetch<StudentMonthlyAssessmentIndexJson>("/api/v1/student/monthly-assessments", { accessToken: token }),
        apiFetch<StudentPackageRowJson[]>("/api/v1/student/my-packages", { accessToken: token }),
      ]);
      if (cancelled) return;
      if (!r.ok) {
        if (r.status === 401 || r.status === 403) {
          router.replace(routes.login);
          return;
        }
        setErr(r.message);
        setData(null);
      } else {
        setData(r.data);
        setProgramData(prog.ok ? prog.data : null);
        setAssessmentData(forms.ok ? forms.data : null);
        setPackagesData(packs.ok ? packs.data : null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, token, user, router]);

  if (!ready || loading) {
    return <LoadingState label="Öğrenci paneli yükleniyor..." />;
  }

  if (err) {
    return <ErrorState message={err} />;
  }

  const name = user?.fullName?.trim() || user?.email?.split("@")[0] || "Öğrenci";
  const pkg = data?.activePackage;
  const prog = data?.currentProgram;
  const progressPct = Math.min(100, Math.max(0, data?.programWorkoutCompletionPercent ?? 0));
  const packagePct = Math.min(100, Math.max(0, data?.activePackageTimelineBarPercent ?? 0));
  const packageHighlights = data?.packageHighlightPreviewLines ?? [];

  const packageFeatureChips: string[] = [];
  if (pkg?.includesLiveCoachChat) packageFeatureChips.push("Canlı sohbet");
  if (pkg?.includesWhatsAppSupport) packageFeatureChips.push("WhatsApp");
  if (pkg?.includesVoiceReplies) packageFeatureChips.push("Sesli yanıt");
  if (pkg?.includesBloodWorkReview) packageFeatureChips.push("Kan tahlili");
  if (pkg?.includesIntoleranceTest) packageFeatureChips.push("İntolerans");
  if (pkg?.includesCyclePlanning) packageFeatureChips.push("Döngü planı");

  const forms = assessmentData?.items ?? [];
  const formsSubmitted = forms.filter((x) => x.formStatus !== 0).length;
  const formsApproved = forms.filter((x) => x.formStatus === 3).length;
  const formsRevision = forms.filter((x) => x.formStatus === 4).length;
  const latestForm = forms[0] ?? null;
  const prevForm = forms[1] ?? null;
  const packages = packagesData ?? [];
  const activePackages = packages.filter((x) => x.status === 1).length;
  const completedPackages = packages.filter((x) => x.status === 2).length;
  const archivedPrograms = (programData?.program?.programStatus ?? -1) === 2 ? 1 : 0;
  const adherencePct = Math.max(
    0,
    Math.min(
      100,
      programData?.progress?.trainingDaysCompletedPercent ??
        programData?.progress?.completionPercent ??
        data?.programWorkoutCompletionPercent ??
        0,
    ),
  );
  const adherenceLabel =
    adherencePct >= 80 ? "Yüksek sadakat" : adherencePct >= 50 ? "Orta sadakat" : "Geliştirilebilir sadakat";

  return (
    <DashboardShell className="py-2">
      <PageHeader
        eyebrow="Öğrenci paneli"
        title={`Merhaba, ${name}`}
        lead={`${formatTodayLong()} · Programını takip et, değerlendirme gönder ve koçunla bağlantıda kal.`}
        actions={
          <>
            <Link href={routes.studentProgram} className="rounded-full bg-pf-orange-bright px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90">
              Programa devam et
            </Link>
            <Link
              href={routes.studentAssessments}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition",
                L ? "border-orange-800/28 text-stone-900 hover:bg-orange-950/[0.04]" : "border-white/20 text-zinc-100 hover:bg-white/5",
              )}
            >
              Değerlendirme gönder
            </Link>
          </>
        }
      />

      <div className="mt-8 grid gap-4 xl:grid-cols-2">
        <SectionCard className="border-pf-orange/25 bg-pf-raised/45">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={cn("text-xs font-bold uppercase", L ? "text-stone-600" : "text-zinc-400")}>Aktif paket</p>
              <h2 className={cn("mt-1 font-display text-xl font-bold", L ? "text-stone-900" : "text-white")}>{pkg?.packageName ?? "Aktif paket yok"}</h2>
              {pkg?.packageTagline ? (
                <p className={cn("mt-1 text-sm", L ? "text-stone-600" : "text-zinc-300")}>{pkg.packageTagline}</p>
              ) : null}
            </div>
            <Link
              href={routes.studentPackages}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                L ? "border-orange-800/28 text-stone-800 hover:bg-orange-950/[0.05]" : "border-white/20 text-zinc-200 hover:bg-white/5",
              )}
            >
              Paketlerim
            </Link>
          </div>

          {pkg ? (
            <>
              <div className={cn("mt-4 h-2 overflow-hidden rounded-full", L ? "bg-orange-100" : "bg-pf-void")}>
                <div className="h-full rounded-full bg-gradient-to-r from-pf-green to-pf-green-bright" style={{ width: `${packagePct}%` }} />
              </div>
              <div className={cn("mt-2 flex flex-wrap gap-2 text-xs", L ? "text-stone-600" : "text-zinc-300")}>
                <span>
                  Bitiş: <strong className={L ? "text-stone-900" : "text-zinc-100"}>{formatDate(pkg.endsAtUtc)}</strong>
                </span>
                <span>·</span>
                <span>
                  Kalan gün: <strong className="text-pf-green-bright">{data?.activePackageDaysRemaining ?? 0}</strong>
                </span>
              </div>
              <p className={cn("mt-3 text-xs", L ? "text-stone-600" : "text-zinc-300")}>
                Soru-cevap: <strong className={L ? "text-stone-900" : "text-zinc-100"}>{pkg.monthlyQaAllowanceDisplay ?? "-"}</strong> · Görüntülü:{" "}
                <strong className={L ? "text-stone-900" : "text-zinc-100"}>{pkg.totalVideoCallSessionsDisplay ?? "-"}</strong>
              </p>
              {pkg.liveChatStatusSummary ? (
                <p className={cn("mt-2 text-xs", L ? "text-stone-600" : "text-zinc-300")}>Canlı sohbet: {pkg.liveChatStatusSummary}</p>
              ) : null}
            {pkg.includesLiveCoachChat ? (
              <div className="mt-3">
                <Link href={routes.studentLiveChat} className="text-xs font-semibold text-pf-orange-bright hover:underline">
                  Sohbete git →
                </Link>
              </div>
            ) : null}

              {packageHighlights.length > 0 ? (
                <ul className={cn("mt-4 list-inside list-disc space-y-1 text-sm", L ? "text-stone-700" : "text-zinc-200")}>
                  {packageHighlights.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : null}

              {packageFeatureChips.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {packageFeatureChips.map((chip) => (
                    <span
                      key={chip}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs",
                        L ? "border-orange-800/18 bg-orange-50 text-stone-800" : "border-white/15 bg-white/5 text-zinc-200",
                      )}
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div
              className={cn(
                "mt-4 rounded-xl border border-dashed p-4 text-sm",
                L ? "border-orange-300/65 bg-orange-50/60 text-stone-700" : "border-white/15 bg-pf-void/40 text-zinc-300",
              )}
            >
              Aktif paket görünmüyor. Paket satın alındığında program ve değerlendirme akışı burada aktifleşir.
            </div>
          )}
        </SectionCard>

        <SectionCard id="program" className="scroll-mt-24 bg-pf-card/50">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={cn("text-xs font-bold uppercase", L ? "text-stone-600" : "text-zinc-400")}>Antrenman</p>
              <h2 className={cn("mt-1 font-display text-xl font-bold", L ? "text-stone-900" : "text-white")}>{prog?.title ?? "Güncel program"}</h2>
              {prog ? (
                <p className={cn("mt-1 text-sm", L ? "text-stone-600" : "text-zinc-300")}>
                  {prog.startDate} → {prog.endDate}
                </p>
              ) : (
                <p className={cn("mt-1 text-sm", L ? "text-stone-600" : "text-zinc-300")}>Henüz atanmış bir program görünmüyor.</p>
              )}
            </div>
            {prog ? (
              <Link href={routes.studentProgram} className="rounded-full bg-pf-orange-bright px-3 py-1.5 text-xs font-semibold text-black hover:opacity-90">
                Aç
              </Link>
            ) : null}
          </div>

          {prog ? (
            <>
              <div className={cn("mt-4 h-2 overflow-hidden rounded-full", L ? "bg-orange-100" : "bg-pf-void")}>
                <div className="h-full rounded-full bg-gradient-to-r from-pf-orange to-pf-orange-bright" style={{ width: `${progressPct}%` }} />
              </div>
              <p className={cn("mt-2 text-xs", L ? "text-stone-600" : "text-zinc-300")}>
                <strong className={L ? "text-stone-900" : "text-zinc-100"}>{data?.programWorkoutDaysCompleted ?? 0}</strong> / {data?.programWorkoutDaysPlanned ?? 0}{" "}
                antrenman günü tamamlandı · %{progressPct}
              </p>
              {prog.goalSummary ? (
                <p className={cn("mt-3 border-t pt-3 text-sm", L ? "border-orange-200/80 text-stone-700" : "border-white/10 text-zinc-200")}>
                  <strong className={L ? "text-stone-900" : "text-zinc-100"}>Hedef:</strong> {prog.goalSummary}
                </p>
              ) : null}
            </>
          ) : (
            <div
              className={cn(
                "mt-4 rounded-xl border border-dashed p-4 text-sm",
                L ? "border-orange-300/65 bg-orange-50/60 text-stone-700" : "border-white/15 bg-pf-void/40 text-zinc-300",
              )}
            >
              Koç programı yayınladığında burada özetini göreceksin. Aylık değerlendirmeyi güncel tutman ilerlemeyi hızlandırır.
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard title="İlerleme panosu" className="bg-pf-card/40">
        <div className="mb-4 flex items-center justify-between">
          <span />
          <Badge>{adherenceLabel}</Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Program sadakati" value={`%${adherencePct}`} hint="Tamamlama oranı" tone="orange" />
          <article
            className={cn(
              "rounded-xl border p-4",
              L ? "border-orange-200/70 bg-orange-50/80" : "border-white/10 bg-black/25",
            )}
          >
            <div className={cn("mt-2 h-1.5 overflow-hidden rounded-full", L ? "bg-orange-100" : "bg-pf-void")}>
              <div className="h-full rounded-full bg-gradient-to-r from-pf-orange to-pf-orange-bright" style={{ width: `${adherencePct}%` }} />
            </div>
          </article>
          <article
            className={cn(
              "rounded-xl border p-4",
              L ? "border-orange-200/70 bg-orange-50/80" : "border-white/10 bg-black/25",
            )}
          >
            <p className={cn("text-xs", L ? "text-stone-600" : "text-zinc-300")}>Gönderilen formlar</p>
            <p className={cn("mt-1 text-2xl font-bold", L ? "text-stone-900" : "text-white")}>{formsSubmitted}</p>
            <p className={cn("mt-1 text-xs", L ? "text-stone-600" : "text-zinc-400")}>
              Onaylanan: {formsApproved} · Revizyon: {formsRevision}
            </p>
          </article>
          <article
            className={cn(
              "rounded-xl border p-4",
              L ? "border-orange-200/70 bg-orange-50/80" : "border-white/10 bg-black/25",
            )}
          >
            <p className={cn("text-xs", L ? "text-stone-600" : "text-zinc-300")}>Paket geçmişi</p>
            <p className={cn("mt-1 text-2xl font-bold", L ? "text-stone-900" : "text-white")}>{packages.length}</p>
            <p className={cn("mt-1 text-xs", L ? "text-stone-600" : "text-zinc-400")}>
              Aktif: {activePackages} · Tamamlanan: {completedPackages}
            </p>
          </article>
          <article
            className={cn(
              "rounded-xl border p-4",
              L ? "border-orange-200/70 bg-orange-50/80" : "border-white/10 bg-black/25",
            )}
          >
            <p className={cn("text-xs", L ? "text-stone-600" : "text-zinc-300")}>Program durumu</p>
            <p className={cn("mt-1 text-2xl font-bold", L ? "text-stone-900" : "text-white")}>{programData?.hasProgram ? "Aktif" : "Beklemede"}</p>
            <p className={cn("mt-1 text-xs", L ? "text-stone-600" : "text-zinc-400")}>Arşivlenen sürüm: {archivedPrograms}</p>
          </article>
        </div>
      </SectionCard>

      <section className="mt-6 grid gap-4 xl:grid-cols-2">
        <article
          className={cn(
            "rounded-2xl border p-5",
            L ? "border-orange-200/70 bg-white/90" : "border-white/10 bg-pf-card/40",
          )}
        >
          <h3 className={cn("text-sm font-bold uppercase tracking-[0.16em]", L ? "text-stone-700" : "text-zinc-400")}>Form geçmişi (yeni-eski)</h3>
          {latestForm ? (
            <div className="mt-3 space-y-2">
              <div
                className={cn(
                  "rounded-lg border p-3",
                  L ? "border-emerald-600/25 bg-emerald-50" : "border-emerald-500/30 bg-emerald-500/10",
                )}
              >
                <p className={cn("text-xs", L ? "text-emerald-900" : "text-emerald-200")}>En yeni form</p>
                <p className={cn("text-sm font-semibold", L ? "text-stone-900" : "text-white")}>
                  {latestForm.year}/{latestForm.month} · Durum {latestForm.formStatus}
                </p>
                <p className={cn("text-xs", L ? "text-stone-600" : "text-zinc-300")}>
                  {latestForm.submittedAtUtc ? formatDate(latestForm.submittedAtUtc) : "Tarih yok"}
                </p>
              </div>
              {prevForm ? (
                <div
                  className={cn(
                    "rounded-lg border p-3",
                    L ? "border-orange-200/80 bg-orange-50/80" : "border-white/10 bg-black/25",
                  )}
                >
                  <p className={cn("text-xs", L ? "text-stone-600" : "text-zinc-400")}>Önceki form</p>
                  <p className={cn("text-sm font-semibold", L ? "text-stone-900" : "text-white")}>
                    {prevForm.year}/{prevForm.month} · Durum {prevForm.formStatus}
                  </p>
                  <p className={cn("text-xs", L ? "text-stone-600" : "text-zinc-400")}>
                    {prevForm.submittedAtUtc ? formatDate(prevForm.submittedAtUtc) : "Tarih yok"}
                  </p>
                </div>
              ) : null}
              <Link href={routes.studentAssessments} className="inline-block text-xs font-semibold text-pf-orange-bright hover:underline">
                Tüm form geçmişini aç →
              </Link>
            </div>
          ) : (
            <p className={cn("mt-3 text-sm", L ? "text-stone-600" : "text-zinc-400")}>Henüz form geçmişi yok.</p>
          )}
        </article>

        <article
          className={cn(
            "rounded-2xl border p-5",
            L ? "border-orange-200/70 bg-white/90" : "border-white/10 bg-pf-card/40",
          )}
        >
          <h3 className={cn("text-sm font-bold uppercase tracking-[0.16em]", L ? "text-stone-700" : "text-zinc-400")}>Programa sadakat analizi</h3>
          <div
            className={cn(
              "mt-3 rounded-lg border p-4",
              L ? "border-orange-200/75 bg-orange-50/75" : "border-white/10 bg-black/25",
            )}
          >
            <p className={cn("text-sm", L ? "text-stone-800" : "text-zinc-200")}>
              Düzenli tamamlama oranını yükseltmek için hedefin en az <strong className={L ? "text-stone-900" : "text-white"}>%80</strong>. Şu anki
              sadakat: <strong className="text-pf-orange-bright">%{adherencePct}</strong>.
            </p>
            <div className={cn("mt-3 h-2 overflow-hidden rounded-full", L ? "bg-orange-100" : "bg-pf-void")}>
              <div className="h-full rounded-full bg-gradient-to-r from-pf-green to-pf-green-bright" style={{ width: `${adherencePct}%` }} />
            </div>
            <p className={cn("mt-2 text-xs", L ? "text-stone-600" : "text-zinc-400")}>
              İpucu: “Antrenmanı bitir” ile günü kapattığında ilerleme daha doğru ölçülür ve koç paneline temiz yansır.
            </p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={routes.studentProgram} className="rounded-full bg-pf-orange-bright px-3 py-1.5 text-xs font-semibold text-black">
              Bugünkü antrenmana dön
            </Link>
            <Link
              href={routes.studentAssessments}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                L ? "border-orange-800/28 text-stone-900 hover:bg-orange-950/[0.04]" : "border-white/20 text-zinc-200 hover:bg-white/5",
              )}
            >
              Form planını kontrol et
            </Link>
          </div>
        </article>
      </section>

      <section>
        <p className={cn("mb-3 text-xs font-bold uppercase tracking-[0.18em]", L ? "text-stone-600" : "text-zinc-400")}>Hızlı erişim</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ActionCard href={routes.studentProgram} title="Programım" description="Antrenman günleri ve hareket akışı." />
          <ActionCard href={routes.studentAssessments} title="Değerlendirme gönder" description="Aylık form ve koç geri bildirimleri." />
          <ActionCard href={routes.studentLiveChat} title="Koça soru sor" description="Canlı sohbet üzerinden hızlı iletişim." />
          <ActionCard href={routes.packages} title="Paket yenile" description="Paket mağazasından yeni paket seç." />
        </div>
      </section>
      {!pkg ? (
        <EmptyState
          title="Aktif paketin görünmüyor"
          message="Paket satın alındığında hakların, programın ve sohbet detayları burada otomatik gösterilir."
          action={
            <Link href={routes.packages} className="rounded-full bg-pf-orange-bright px-3 py-1.5 text-xs font-semibold text-black">
              Paket mağazasına git
            </Link>
          }
        />
      ) : null}
    </DashboardShell>
  );
}
