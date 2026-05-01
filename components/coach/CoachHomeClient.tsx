"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api/client";
import type { CoachHomeOverviewJson, CoachStudentListItemJson } from "@/lib/api/types-dashboard";
import { canAccessCoachArea, primaryDashboardPath } from "@/lib/auth/paths";
import { routes } from "@/lib/site";
import { usePanelTheme } from "@/contexts/PanelThemeContext";
import { CoachDashboardCharts } from "./CoachDashboardCharts";
import {
  ActionCard,
  Badge,
  cn,
  DashboardShell,
  ErrorState,
  LoadingState,
  PageHeader,
  SectionCard,
  StatCard,
} from "@/components/dashboard/DashboardUI";

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("tr-TR", { dateStyle: "short" });
  } catch {
    return iso;
  }
}

const formStatusLabels: Record<number, string> = {
  0: "Taslak",
  1: "Gönderildi",
  2: "İncelendi",
  3: "Onaylandı",
  4: "Revizyon",
  5: "Arşiv",
};

function formatFormStatus(n: number | null | undefined) {
  if (n == null) return "—";
  return formStatusLabels[n] ?? `Durum ${n}`;
}

export function CoachHomeClient() {
  const router = useRouter();
  const { theme, enabled } = usePanelTheme();
  const L = enabled && theme === "light";
  const { token, ready, user } = useAuth();
  const [overview, setOverview] = useState<CoachHomeOverviewJson | null>(null);
  const [preview, setPreview] = useState<CoachStudentListItemJson[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace(`${routes.login}?returnUrl=${encodeURIComponent(routes.coach)}`);
      return;
    }
    if (!canAccessCoachArea(user?.roles)) {
      router.replace(primaryDashboardPath(user?.roles ?? []) ?? routes.home);
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setErr(null);
      const [o, s] = await Promise.all([
        apiFetch<CoachHomeOverviewJson>("/api/v1/coach/home/overview", { accessToken: token }),
        apiFetch<{ page?: { items?: CoachStudentListItemJson[] } }>("/api/v1/coach/students?page=1&pageSize=8", {
          accessToken: token,
        }),
      ]);
      if (cancelled) return;
      if (!o.ok) {
        if (o.status === 401 || o.status === 403) {
          router.replace(routes.login);
          return;
        }
        setErr(o.message);
        setOverview(null);
      } else {
        setOverview(o.data);
      }
      if (s.ok && s.data?.page?.items) setPreview(s.data.page.items);
      else setPreview([]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, token, user, router]);

  if (!ready || loading) {
    return <LoadingState label="Koç paneli yükleniyor..." />;
  }

  if (err) {
    return <ErrorState message={err} />;
  }

  const m = overview?.metrics;
  const tr = new Intl.DateTimeFormat("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(
    new Date(),
  );

  return (
    <DashboardShell className="py-1">
      <PageHeader
        eyebrow="Koç paneli"
        title="Bugün seni bekleyen işler"
        lead={`${tr} · Öğrenciler, değerlendirmeler ve program aksiyonları tek bakışta.`}
        actions={
          <>
            <Link href={routes.coachPrograms} className="rounded-full bg-pf-orange-bright px-4 py-2 text-sm font-semibold text-black">
              Program oluştur
            </Link>
            <Link
              href={routes.coachStudentsReviewQueue}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition",
                L ? "border-orange-800/28 text-stone-900 hover:bg-orange-950/[0.04]" : "border-white/20 text-zinc-100 hover:bg-white/5",
              )}
            >
              Form incele
            </Link>
          </>
        }
      />
      <SectionCard className="border-pf-orange/25 bg-gradient-to-br from-pf-raised/80 to-pf-void/90">
        {m ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <StatCard label="Aktif öğrenci" value={m.activeStudentCount} />
            <StatCard label="Bekleyen değerlendirme" value={m.pendingAssessmentReviewCount} tone="orange" />
            <StatCard label="Yayındaki program" value={m.activeProgramsCount} tone="success" />
          </div>
        ) : null}
      </SectionCard>

      {m ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className={cn("rounded-2xl border p-4", L ? "border-red-400/52 bg-red-50" : "border-red-500/20 bg-pf-card/40")}>
            <p className={cn("text-xs font-bold", L ? "text-red-900" : "text-red-300/90")}>Paket var, yayımlı program yok</p>
            <p className={cn("font-display mt-1 text-2xl font-bold", L ? "text-stone-900" : "text-white")}>{m.activePackageWithoutPublishedProgramCount}</p>
            {m.activePackageWithoutPublishedProgramCount > 0 ? (
              <Link href={routes.coachStudentsNoPublished} className="mt-2 inline-block text-xs font-semibold text-pf-orange-bright">
                Listele →
              </Link>
            ) : null}
          </div>
          <div className={cn("rounded-2xl border p-4", L ? "border-sky-400/50 bg-sky-50" : "border-sky-500/20 bg-pf-card/40")}>
            <p className={cn("text-xs font-bold", L ? "text-sky-950" : "text-sky-200/90")}>Forma program bağlı değil</p>
            <p className={cn("font-display mt-1 text-2xl font-bold", L ? "text-stone-900" : "text-white")}>{m.submittedAssessmentWithoutLinkedProgramCount}</p>
            {m.submittedAssessmentWithoutLinkedProgramCount > 0 ? (
              <Link href={routes.coachStudentsNoProgramLink} className="mt-2 inline-block text-xs font-semibold text-pf-orange-bright">
                Listele →
              </Link>
            ) : null}
          </div>
          <div className={cn("rounded-2xl border p-4", L ? "border-orange-300/60 bg-orange-50/92" : "border-zinc-500/25 bg-pf-card/40")}>
            <p className={cn("text-xs font-bold", L ? "text-stone-700" : "text-zinc-400")}>Taslak program</p>
            <p className={cn("font-display mt-1 text-2xl font-bold", L ? "text-stone-900" : "text-white")}>{m.draftProgramsCount}</p>
            <Link href={routes.coachPrograms} className="mt-2 inline-block text-xs font-semibold text-pf-orange-bright">
              Programlar →
            </Link>
          </div>
          <div className={cn("rounded-2xl border p-4", L ? "border-amber-400/53 bg-amber-50" : "border-amber-500/25 bg-pf-card/40")}>
            <p className={cn("text-xs font-bold", L ? "text-amber-950" : "text-amber-200/90")}>Form incelemesi</p>
            <p className={cn("font-display mt-1 text-2xl font-bold", L ? "text-stone-900" : "text-white")}>{m.pendingAssessmentReviewCount}</p>
            <Link href={routes.coachStudentsReviewQueue} className="mt-2 inline-block text-xs font-semibold text-pf-orange-bright">
              Kuyruk →
            </Link>
          </div>
        </div>
      ) : null}

      {overview?.dashboardChartsJson ? <CoachDashboardCharts chartsJson={overview.dashboardChartsJson} /> : null}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <ActionCard href={routes.coachStudents} title="Öğrenciler" description="Arama, filtre ve durum yönetimi." />
        <ActionCard href={routes.coachStudentsReviewQueue} title="Form inceleme kuyruğu" description="Bekleyen değerlendirmeleri hızlı tamamla." />
        <ActionCard href={routes.coachPrograms} title="Programlar" description="Taslak, yayın ve sürüm takibi." />
        <ActionCard href={routes.coachExercises} title="Egzersiz kütüphanesi" description="Hareketleri düzenle ve kullan." />
      </div>

      <div className="mt-10 flex items-center justify-between gap-3">
        <h2 className={cn("font-display text-lg font-bold", L ? "text-stone-900" : "text-white")}>Öğrenci önizleme</h2>
        <Badge tone="orange">Son aktiviteler</Badge>
      </div>
      <div className={cn("mt-3 overflow-x-auto rounded-2xl border", L ? "border-orange-200/70 bg-white/90" : "border-white/10")}>
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr
              className={cn(
                "border-b text-xs font-bold uppercase",
                L ? "border-orange-200/70 bg-orange-50/88 text-stone-600" : "border-white/10 bg-pf-void/80 text-pf-mist",
              )}
            >
              <th className="p-3">Öğrenci</th>
              <th className="p-3">Paket</th>
              <th className="p-3">Form</th>
              <th className="p-3">Son gönderim</th>
            </tr>
          </thead>
          <tbody>
            {preview.length === 0 ? (
              <tr>
                <td colSpan={4} className={cn("p-6 text-center", L ? "text-stone-600" : "text-zinc-500")}>
                  Liste boş veya yüklenemedi.
                </td>
              </tr>
            ) : (
              preview.map((r) => (
                <tr key={r.studentUserId} className={cn("border-b", L ? "border-orange-100" : "border-white/5")}>
                  <td className="p-3">
                    <Link
                      href={`${routes.coachStudents}/${r.studentUserId}`}
                      className={cn("font-semibold hover:text-pf-orange-bright", L ? "text-stone-900" : "text-white")}
                    >
                      {r.displayName || r.email}
                    </Link>
                  </td>
                  <td className={cn("p-3", L ? "text-stone-700" : "text-zinc-400")}>
                    {r.packageName ?? "—"}
                    {r.packageEndsAtUtc ? (
                      <span className={cn("mt-0.5 block text-xs", L ? "text-stone-600" : "text-zinc-500")}>Bitiş: {formatDate(r.packageEndsAtUtc)}</span>
                    ) : null}
                  </td>
                  <td className={cn("p-3", L ? "text-emerald-900" : "text-pf-green-bright")}>{formatFormStatus(r.latestAssessmentStatus)}</td>
                  <td className={cn("p-3", L ? "text-stone-600" : "text-zinc-500")}>{formatDate(r.latestAssessmentSubmittedAtUtc)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
