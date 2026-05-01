"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api/client";
import type { CoachStudentsListResponse, CoachStudentListItemJson } from "@/lib/api/types-dashboard";
import { canAccessCoachArea, primaryDashboardPath } from "@/lib/auth/paths";
import { PageHeader } from "@/components/PageHeader";
import { routes } from "@/lib/site";
import { DashboardShell, EmptyState, ErrorState, LoadingState, SectionCard, StatCard } from "@/components/dashboard/DashboardUI";

const MAX_PAGE_SIZE = 50;

/** WebUI `Students/Index` ile aynı filtre değerleri (API `CoachStudentsV1Controller`). */
const ASSESSMENT_OPTIONS = [
  ["all", "Tümü"],
  ["needsreview", "İnceleme bekleyen"],
  ["draft", "Taslak (öğrencide)"],
  ["submitted", "Koça iletilmiş ve sonrası"],
  ["none", "Henüz form yok"],
] as const;

const PROGRAM_GAP_OPTIONS = [
  ["all", "Tümü"],
  ["nopublished", "Paket var, yayımlı program yok"],
  ["nolink", "Forma program bağlı değil"],
] as const;

const SORT_OPTIONS = [
  ["name", "Kullanıcı adı"],
  ["email", "E-posta"],
] as const;

function coachFormPath(formId: number) {
  return `/koc/formlar/${formId}`;
}

function programsForStudentPath(studentUserId: string) {
  const q = new URLSearchParams();
  q.set("studentId", studentUserId);
  return `${routes.coachPrograms}?${q.toString()}`;
}

function initials(displayName: string | null | undefined, email: string) {
  const src = (displayName?.trim() || email).trim();
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2 && parts[0][0] && parts[parts.length - 1][0]) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  if (src.length >= 2) return src.slice(0, 2).toUpperCase();
  if (src.length === 1) return src.toUpperCase();
  return "?";
}

/** `MonthlyFormStatus` (API sayı). */
function statusLabel(s: number | null | undefined): string {
  if (s == null) return "Form yok";
  switch (s) {
    case 0:
      return "Taslak (öğrencide)";
    case 1:
      return "İnceleme bekliyor";
    case 2:
      return "İncelendi";
    case 3:
      return "Onaylandı";
    case 4:
      return "Revizyon";
    case 5:
      return "Arşiv";
    default:
      return "—";
  }
}

function statusBadgeClass(s: number | null | undefined): string {
  if (s == null) return "border border-white/20 bg-zinc-800/80 text-zinc-200";
  switch (s) {
    case 0:
      return "bg-zinc-600 text-white";
    case 1:
      return "bg-amber-500/90 text-black";
    case 2:
      return "bg-sky-600 text-white";
    case 3:
      return "bg-emerald-600 text-white";
    case 4:
      return "bg-amber-400 text-black";
    case 5:
      return "border border-white/20 bg-zinc-800/80 text-zinc-200";
    default:
      return "bg-zinc-600 text-white";
  }
}

function formFlowHint(
  s: number | null | undefined,
  hasLinked: boolean | undefined,
): { text: string; muted: boolean } {
  if (s == null) {
    return {
      text: "Bu ay için listede form yok — öğrenci henüz oluşturmadı veya size iletmedi.",
      muted: true,
    };
  }
  switch (s) {
    case 0:
      return { text: "Form öğrencide taslak; koça henüz iletilmedi.", muted: false };
    case 1:
      return hasLinked
        ? { text: "Form koça iletildi ve bu gönderime antrenman programı bağlı.", muted: false }
        : { text: "Form koça iletildi — önce inceleyin, ardından programa bağlayın.", muted: false };
    case 2:
      return hasLinked
        ? { text: "Form incelendi; programa bağlantı tamam.", muted: false }
        : { text: "Form incelendi; bu gönderime henüz program bağlanmadı.", muted: false };
    case 3:
      return hasLinked
        ? { text: "Form onaylandı; program bağlı.", muted: false }
        : { text: "Form onaylandı; programa bağlamayı unutmayın.", muted: false };
    case 4:
      return { text: "Revizyon istendi; öğrenci güncellediğinde yeniden bakın.", muted: false };
    case 5:
      return { text: "Bu form arşivlendi.", muted: true };
    default:
      return { text: "Durum bilinmiyor.", muted: true };
  }
}

function normalizeAssessment(raw: string): string {
  if (raw === "noform" || raw === "none") return "none";
  if (raw === "pending" || raw === "needsreview") return "needsreview";
  if (raw === "sent" || raw === "submitted") return "submitted";
  return raw;
}

function normalizeProgramGap(raw: string): string {
  if (raw === "noprogram" || raw === "nopublished") return "nopublished";
  if (raw === "noassessmentprogram" || raw === "nolink") return "nolink";
  return raw;
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" }) + " UTC";
  } catch {
    return iso;
  }
}

function formatDateUtc(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toISOString().replace("T", " ").slice(0, 19) + "Z";
  } catch {
    return iso;
  }
}

export function CoachStudentsClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const { token, ready, user } = useAuth();
  const [data, setData] = useState<CoachStudentsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const page = Math.max(1, Number(sp.get("page") || "1") || 1);
  const assessmentRaw = sp.get("assessment") || "all";
  const programGapRaw = sp.get("programGap") || "all";
  const assessment = normalizeAssessment(assessmentRaw);
  const programGap = normalizeProgramGap(programGapRaw);
  const sortRaw = (sp.get("sort") || "name").trim().toLowerCase();
  /** Sunucu yalnızca `name` ve `email` sıralar (`CoachStudentService`). */
  const sort = sortRaw === "email" ? "email" : "name";
  const desc = sp.get("desc") === "true" || sp.get("desc") === "1";
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(sp.get("pageSize") || "20") || 20));

  const load = useCallback(async () => {
    if (!token) return;
    const q = new URLSearchParams();
    q.set("page", String(page));
    q.set("pageSize", String(pageSize));
    q.set("sort", sort);
    if (desc) q.set("desc", "true");
    if (assessment && assessment !== "all") q.set("assessment", assessment);
    if (programGap && programGap !== "all") q.set("programGap", programGap);
    const r = await apiFetch<CoachStudentsListResponse>(`/api/v1/coach/students?${q.toString()}`, { accessToken: token });
    if (!r.ok) {
      setErr(r.message);
      setData(null);
      return;
    }
    setErr(null);
    setData(r.data);
  }, [token, page, pageSize, assessment, programGap, sort, desc]);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace(`${routes.login}?returnUrl=${encodeURIComponent(routes.coachStudents)}`);
      return;
    }
    if (!canAccessCoachArea(user?.roles)) {
      router.replace(primaryDashboardPath(user?.roles ?? []) ?? routes.home);
      return;
    }
    let c = false;
    void (async () => {
      setLoading(true);
      await load();
      if (!c) setLoading(false);
    })();
    return () => {
      c = true;
    };
  }, [ready, token, user, router, load]);

  const setFilter = useCallback(
    (next: Record<string, string | null | undefined>) => {
      const n = new URLSearchParams(sp.toString());
      Object.entries(next).forEach(([k, v]) => {
        if (v == null || v === "" || v === "all") n.delete(k);
        else n.set(k, v);
      });
      n.delete("page");
      router.push(`${routes.coachStudents}?${n.toString()}`);
    },
    [router, sp],
  );

  const pendingReview = data?.dashboard.pendingAssessmentReviewCount ?? 0;

  const reviewQueueHref = useMemo(() => {
    const n = new URLSearchParams(sp.toString());
    n.set("assessment", "needsreview");
    n.delete("page");
    return `${routes.coachStudents}?${n.toString()}`;
  }, [sp]);

  if (!ready || loading) {
    return <LoadingState label="Öğrenci listesi yükleniyor..." />;
  }

  if (err || !data) {
    return <ErrorState message={err ?? "Veri yok."} />;
  }

  const dash = data.dashboard;
  const pg = data.page;
  const items: CoachStudentListItemJson[] = pg.items ?? [];
  const pageInsight = useMemo(() => {
    let needReview = 0;
    let needProgramLink = 0;
    let draftAtStudent = 0;
    let noForm = 0;
    for (const r of items) {
      const st = r.latestAssessmentStatus ?? null;
      const hasLinked = !!r.hasLinkedProgramForLatestAssessment;
      if (st == null) noForm++;
      else if (st === 0) draftAtStudent++;
      else if (st === 1 && !hasLinked) needReview++;
      else if ((st === 2 || st === 3 || st === 4) && !hasLinked && r.latestAssessmentFormId != null) needProgramLink++;
    }
    return { needReview, needProgramLink, draftAtStudent, noForm };
  }, [items]);

  return (
    <DashboardShell className="py-2">
      <div className="mb-6 space-y-4">
        <PageHeader
          eyebrow="Operasyon"
          title="Öğrenciler"
          lead="Size atanmış öğrenciler; aylık form ve program durumu WebUI öğrenci listesi ile aynı mantıkta özetlenir."
        />
        {pendingReview > 0 ? (
          <div
            role="status"
            className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-100"
          >
            <span>
              <strong className="text-white">{pendingReview}</strong> inceleme bekliyor
            </span>
            <Link className="font-semibold text-pf-orange-bright hover:underline" href={reviewQueueHref}>
              Listele
            </Link>
          </div>
        ) : null}
      </div>

      <details className="mb-6 rounded-2xl border border-white/10 bg-pf-void/40 px-4 py-3 text-sm text-zinc-400">
        <summary className="cursor-pointer font-semibold text-zinc-200">Rozetler, liste kapsamı ve sıralama</summary>
        <div className="mt-3 space-y-3 border-t border-white/10 pt-3 text-xs leading-relaxed">
          <p>
            Kartta <strong className="text-zinc-200">sol çizgi</strong> sizden aksiyon bekleyen satırları gösterir; üstteki uyarı kutusu bekleyen inceleme
            sayısını verir.
          </p>
          <p>
            <strong className="text-zinc-200">Varsayılan sıralama</strong> (form ve program «Tümü», sıralama kullanıcı adı, azalan kapalı): önce son aylık
            formu koça iletilmiş olup programa bağlanmamış öğrenciler; bu grupta gönderim tarihi eskiden yeniye. Sonrası kullanıcı adına göre.
          </p>
          <p className="font-semibold text-zinc-300">Liste kapsamı</p>
          <ul className="list-disc space-y-1 pl-4">
            <li>Yalnızca size atanmış öğrenciler listelenir.</li>
            <li>E-posta giriş hesabıdır; aylık form o hesaba kaydolur.</li>
          </ul>
        </div>
      </details>

      <div className="mb-6 grid gap-3 rounded-2xl border border-white/10 bg-pf-void/40 p-4 md:grid-cols-12 md:items-end">
        <label className="md:col-span-3 block text-xs text-zinc-400">
          Form durumu
          <select
            className="mt-1 w-full rounded-lg border border-white/15 bg-pf-void px-3 py-2 text-sm text-white"
            value={assessment}
            onChange={(e) => setFilter({ assessment: e.target.value })}
          >
            {ASSESSMENT_OPTIONS.map(([v, lab]) => (
              <option key={v} value={v}>
                {lab}
              </option>
            ))}
          </select>
        </label>
        <label className="md:col-span-3 block text-xs text-zinc-400">
          Program / paket
          <select
            className="mt-1 w-full rounded-lg border border-white/15 bg-pf-void px-3 py-2 text-sm text-white"
            value={programGap}
            onChange={(e) => setFilter({ programGap: e.target.value })}
          >
            {PROGRAM_GAP_OPTIONS.map(([v, lab]) => (
              <option key={v} value={v}>
                {lab}
              </option>
            ))}
          </select>
        </label>
        <label className="md:col-span-2 block text-xs text-zinc-400">
          Sırala
          <select
            className="mt-1 w-full rounded-lg border border-white/15 bg-pf-void px-3 py-2 text-sm text-white"
            value={sort}
            onChange={(e) => setFilter({ sort: e.target.value })}
            title="Form ve program «Tümü», kullanıcı adı A→Z: önce programa bağlanmamış gönderimler, sonra diğerleri."
          >
            {SORT_OPTIONS.map(([v, lab]) => (
              <option key={v} value={v}>
                {lab}
              </option>
            ))}
          </select>
        </label>
        <label className="md:col-span-2 block text-xs text-zinc-400">
          Sayfa boyutu (1–{MAX_PAGE_SIZE})
          <input
            type="number"
            min={1}
            max={MAX_PAGE_SIZE}
            className="mt-1 w-full rounded-lg border border-white/15 bg-pf-void px-3 py-2 text-sm text-white"
            defaultValue={pageSize}
            key={pageSize}
            onBlur={(e) => {
              const n = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(e.target.value) || 20));
              if (n !== pageSize) setFilter({ pageSize: String(n) });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const t = e.currentTarget;
                const n = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(t.value) || 20));
                setFilter({ pageSize: String(n) });
              }
            }}
          />
        </label>
        <label className="md:col-span-2 flex items-center gap-2 pb-2 text-sm text-zinc-300">
          <input type="checkbox" checked={desc} onChange={(e) => setFilter({ desc: e.target.checked ? "true" : null })} />
          Azalan
        </label>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Aktif öğrenci" value={dash.activeStudentCount} />
        <StatCard label="İnceleme bekleyen" value={dash.pendingAssessmentReviewCount} tone="orange" />
        <StatCard label="Yayında program" value={dash.activeProgramsCount} tone="success" />
        <StatCard label="Programı olmayan (paketli)" value={dash.activePackageWithoutPublishedProgramCount} />
      </div>

      <p className="mb-4 text-sm text-zinc-400">
        Toplam <strong className="text-white">{pg.totalCount}</strong> öğrenci
        {pg.totalPages > 1 ? (
          <>
            {" "}
            · Sayfa <strong className="text-white">{pg.page}</strong> / {pg.totalPages}
          </>
        ) : null}
        .
      </p>
      <div className="mb-5 rounded-2xl border border-white/10 bg-pf-void/30 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Bu sayfadaki durum özeti</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2">
            <p className="text-[11px] text-red-100">Öncelik: inceleme + program</p>
            <p className="text-lg font-bold text-white">{pageInsight.needReview}</p>
          </div>
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2">
            <p className="text-[11px] text-amber-100">Program bağlanacak</p>
            <p className="text-lg font-bold text-white">{pageInsight.needProgramLink}</p>
          </div>
          <div className="rounded-xl border border-zinc-500/40 bg-zinc-500/10 px-3 py-2">
            <p className="text-[11px] text-zinc-200">Öğrencide taslak</p>
            <p className="text-lg font-bold text-white">{pageInsight.draftAtStudent}</p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/5 px-3 py-2">
            <p className="text-[11px] text-zinc-300">Form yok</p>
            <p className="text-lg font-bold text-white">{pageInsight.noForm}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          Kırmızı kartlar <strong className="text-zinc-300">hemen aksiyon</strong> ister, sarı kartlar form işlenmiş ama program bağlantısı eksik olan
          öğrencileri gösterir.
        </p>
      </div>

      {items.length === 0 ? (
        <SectionCard>
          <EmptyState title="Öğrenci bulunamadı" message="Bu filtreye uyan öğrenci yok veya henüz atanmış öğrenci bulunmuyor." />
        </SectionCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((r) => {
            const label = (r.displayName?.trim() || r.email).trim();
            const sameAsEmail = label.toLowerCase() === r.email.trim().toLowerCase();
            const ini = initials(r.displayName, r.email);
            const st = r.latestAssessmentStatus ?? null;
            const hasLinked = !!r.hasLinkedProgramForLatestAssessment;
            const fid = r.latestAssessmentFormId ?? null;
            const showUrgent = st === 1 && !hasLinked;
            const showProgramMissing = (st === 2 || st === 3 || st === 4) && !hasLinked && fid != null;
            const flow = formFlowHint(st, hasLinked);
            const borderAttention =
              showUrgent ? "border-l-red-500" : showProgramMissing ? "border-l-amber-400" : "border-l-transparent";

            const lpId = r.linkedProgramIdForLatestAssessment ?? null;
            const linkedDraft = r.linkedProgramStatus === 0;

            return (
              <article
                key={r.studentUserId}
                className={`flex flex-col overflow-hidden rounded-2xl border border-white/10 border-l-4 bg-pf-card/40 ${borderAttention} shadow-sm`}
              >
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-3 flex gap-3">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pf-orange/20 text-sm font-bold text-pf-orange-bright"
                      aria-hidden
                    >
                      {ini}
                    </div>
                    <div className="min-w-0 flex-1">
                      {sameAsEmail ? (
                        <h2 className="truncate text-base font-bold text-white" title={r.email}>
                          {r.email}
                        </h2>
                      ) : (
                        <>
                          <h2 className="truncate text-base font-bold text-white" title={label}>
                            {label}
                          </h2>
                          <p className="truncate text-xs text-zinc-500" title={r.email}>
                            {r.email}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <p className={`mb-3 text-xs leading-relaxed ${flow.muted ? "text-zinc-500" : "text-zinc-400"}`}>{flow.text}</p>

                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(st)}`}>{statusLabel(st)}</span>
                    {hasLinked ? (
                      <span className="rounded-full bg-emerald-600/90 px-3 py-1 text-xs font-semibold text-white">Program bağlı</span>
                    ) : st === 1 || st === 2 || st === 3 || st === 4 ? (
                      <span className="rounded-full bg-amber-400/90 px-3 py-1 text-xs font-semibold text-black">Program yok</span>
                    ) : null}
                  </div>

                  {r.lastAssessmentSummary ? (
                    <p className="mb-2 text-xs text-zinc-500">{r.lastAssessmentSummary}</p>
                  ) : null}
                  {r.latestAssessmentSubmittedAtUtc ? (
                    <p className="mb-3 text-xs text-zinc-500">
                      <span className="font-semibold text-zinc-400">Koça iletilme: </span>
                      <time dateTime={r.latestAssessmentSubmittedAtUtc}>{formatDateTime(r.latestAssessmentSubmittedAtUtc)}</time>
                    </p>
                  ) : null}

                  {showUrgent ? (
                    <div className="mb-3 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-100" role="status">
                      <p className="font-semibold text-red-50">Sizden beklenen</p>
                      <p className="mt-1 leading-snug">
                        Form iletildi; <strong>inceleme</strong> ve <strong>program bağlantısı</strong> yapılmadı. Önce İncele veya Formu aç ile ilerleyin.
                      </p>
                    </div>
                  ) : showProgramMissing ? (
                    <div className="mb-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-50" role="status">
                      <p className="font-semibold text-amber-100">Program bekleniyor</p>
                      <p className="mt-1 leading-snug">
                        Form işlendi; bu gönderime <strong>antrenman programı bağlayın</strong>. Aşağıdaki yeşil düğmeyi kullanın.
                      </p>
                    </div>
                  ) : null}

                  <dl className="mb-4 space-y-2 border-b border-white/10 pb-4 text-xs text-zinc-400">
                    <div className="flex justify-between gap-2">
                      <dt>Paket</dt>
                      <dd className="text-right text-zinc-300">{r.packageName ?? "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>Paket bitişi (UTC)</dt>
                      <dd className="text-right font-mono text-[11px] text-zinc-300">{formatDateUtc(r.packageEndsAtUtc ?? null)}</dd>
                    </div>
                  </dl>

                  <div className="mt-auto flex flex-col gap-2">
                    {fid != null ? (
                      <div className="flex flex-wrap gap-2">
                        {showUrgent ? (
                          <>
                            <Link
                              href={coachFormPath(fid)}
                              className="inline-flex items-center justify-center rounded-full bg-pf-orange-bright px-3 py-1.5 text-xs font-semibold text-black hover:opacity-90"
                            >
                              İncele
                            </Link>
                            <Link
                              href={coachFormPath(fid)}
                              className="inline-flex items-center justify-center rounded-full border border-pf-orange-bright/50 px-3 py-1.5 text-xs font-semibold text-pf-orange-bright hover:bg-white/5"
                            >
                              Formu aç
                            </Link>
                          </>
                        ) : showProgramMissing ? (
                          <>
                            <Link
                              href={programsForStudentPath(r.studentUserId)}
                              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                            >
                              Program hazırla
                            </Link>
                            <Link
                              href={coachFormPath(fid)}
                              className="inline-flex items-center justify-center rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/5"
                            >
                              Formu aç
                            </Link>
                          </>
                        ) : st === 0 ? (
                          <span className="inline-flex cursor-not-allowed rounded-full border border-white/10 bg-zinc-800/80 px-3 py-1.5 text-xs text-zinc-500">
                            Taslak öğrencide — bekleyin
                          </span>
                        ) : st === 1 || st === 2 || st === 4 ? (
                          <>
                            <Link
                              href={coachFormPath(fid)}
                              className="inline-flex items-center justify-center rounded-full bg-pf-orange-bright px-3 py-1.5 text-xs font-semibold text-black hover:opacity-90"
                            >
                              İncele
                            </Link>
                            <Link
                              href={coachFormPath(fid)}
                              className="inline-flex items-center justify-center rounded-full border border-pf-orange-bright/50 px-3 py-1.5 text-xs font-semibold text-pf-orange-bright hover:bg-white/5"
                            >
                              Formu aç
                            </Link>
                          </>
                        ) : st === 3 || st === 5 ? (
                          <Link
                            href={coachFormPath(fid)}
                            className="inline-flex items-center justify-center rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/5"
                          >
                            Formu görüntüle
                          </Link>
                        ) : (
                          <Link
                            href={coachFormPath(fid)}
                            className="inline-flex items-center justify-center rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/5"
                          >
                            Formu aç
                          </Link>
                        )}

                        {hasLinked && lpId != null && !showUrgent && !showProgramMissing ? (
                          <Link
                            href={`${routes.coachPrograms}/${lpId}`}
                            className="inline-flex items-center justify-center rounded-full border border-emerald-500/50 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/10"
                          >
                            {linkedDraft ? "Programı düzenle" : "Programı görüntüle"}
                          </Link>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`${routes.coachStudents}/${r.studentUserId}`}
                        className="inline-flex items-center justify-center rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-white/5 hover:text-white"
                      >
                        Profil
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {pg.totalPages > 1 ? (
        <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Öğrenci sayfaları">
          {Array.from({ length: pg.totalPages }, (_, i) => i + 1).map((pnum) => {
            const n = new URLSearchParams(sp.toString());
            n.set("page", String(pnum));
            n.set("pageSize", String(pageSize));
            return (
              <Link
                key={pnum}
                href={`${routes.coachStudents}?${n.toString()}`}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                  pnum === pg.page ? "bg-pf-orange-bright text-black" : "border border-white/15 text-zinc-300 hover:bg-white/5"
                }`}
              >
                {pnum}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </DashboardShell>
  );
}
