"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api/client";
import type { CoachHomeOverviewJson, CoachStudentListItemJson } from "@/lib/api/types-dashboard";
import { canAccessCoachArea, primaryDashboardPath } from "@/lib/auth/paths";
import { PageHeader } from "@/components/PageHeader";
import { routes } from "@/lib/site";
import { DashboardShell, EmptyState, ErrorState, LoadingState, SectionCard, StatCard } from "@/components/dashboard/DashboardUI";

type ProgramRow = {
  id: number;
  studentUserId: string;
  studentEmail: string;
  studentDisplayName: string;
  title: string;
  versionNo: number;
  isCurrent: boolean;
  programStatus: number;
  startDate: string;
  endDate: string;
  weekCount: number;
  dayCount: number;
  lastUpdatedUtc?: string | null;
  lastStudentActivityUtc?: string | null;
};

type ListJson = {
  programs: ProgramRow[];
  publishedProgramCount: number;
  draftProgramCount: number;
  scopeTotal: number;
  filters: { studentId?: string | null; q?: string; status?: string; current?: string };
  studentOptions: { studentUserId: string; label: string }[];
};

const statusLabels: Record<string, string> = {
  all: "Durum: tümü",
  draft: "Taslak",
  published: "Yayında",
  archived: "Arşiv",
};

const currentLabels: Record<string, string> = {
  all: "Güncellik: tümü",
  current: "Yalnız güncel sürüm",
};

const programStatusLabels: Record<number, string> = {
  0: "Taslak",
  1: "Yayında",
  2: "Arşiv",
  3: "İptal",
  4: "Tamamlandı",
};

function initials(name: string, email: string) {
  const src = (name?.trim() || email).trim();
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase();
  return src.slice(0, 2).toUpperCase() || "?";
}

function programStatusBadgeClass(status: number) {
  if (status === 0) return "border border-amber-500/40 bg-amber-500/10 text-amber-200";
  if (status === 1) return "border border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
  if (status === 2) return "border border-white/15 bg-zinc-700/40 text-zinc-200";
  if (status === 3) return "border border-red-500/40 bg-red-500/10 text-red-200";
  if (status === 4) return "border border-sky-500/40 bg-sky-500/10 text-sky-200";
  return "border border-white/15 bg-white/5 text-zinc-300";
}

function fmtDate(v: string | null | undefined) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleDateString("tr-TR");
  } catch {
    return v;
  }
}

export function CoachProgramsClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const { token, ready, user } = useAuth();
  const [data, setData] = useState<ListJson | null>(null);
  const [overview, setOverview] = useState<CoachHomeOverviewJson | null>(null);
  const [noProgramStudents, setNoProgramStudents] = useState<CoachStudentListItemJson[]>([]);
  const [creatingForStudentId, setCreatingForStudentId] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const qStr = useMemo(() => {
    const studentId = sp.get("studentId")?.trim() || "";
    const q = sp.get("q")?.trim() || "";
    const status = sp.get("status")?.trim() || "all";
    const current = sp.get("current")?.trim() || "all";
    const p = new URLSearchParams();
    if (studentId) p.set("studentId", studentId);
    if (q) p.set("q", q);
    if (status && status !== "all") p.set("status", status);
    if (current && current !== "all") p.set("current", current);
    return p.toString();
  }, [sp]);
  const selectedStudentId = sp.get("studentId")?.trim() || "";

  const load = useCallback(async () => {
    if (!token) return;
    const path = qStr ? `/api/v1/coach/programs?${qStr}` : "/api/v1/coach/programs";
    const [programsRes, overviewRes, noProgramRes] = await Promise.all([
      apiFetch<ListJson>(path, { accessToken: token }),
      apiFetch<CoachHomeOverviewJson>("/api/v1/coach/home/overview", { accessToken: token }),
      apiFetch<{ page?: { items?: CoachStudentListItemJson[] } }>(
        "/api/v1/coach/students?programGap=nopublished&page=1&pageSize=8&sort=name",
        { accessToken: token },
      ),
    ]);

    if (!programsRes.ok) {
      setErr(programsRes.message);
      setData(null);
      return;
    }
    setErr(null);
    setData(programsRes.data);
    setOverview(overviewRes.ok ? overviewRes.data : null);
    setNoProgramStudents(noProgramRes.ok ? noProgramRes.data.page?.items ?? [] : []);
  }, [token, qStr]);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace(`${routes.login}?returnUrl=${encodeURIComponent(routes.coachPrograms)}`);
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

  const apply = (patch: Record<string, string | null>) => {
    const n = new URLSearchParams(sp.toString());
    Object.entries(patch).forEach(([k, v]) => {
      if (v == null || v === "" || v === "all") n.delete(k);
      else n.set(k, v);
    });
    router.push(n.toString() ? `${routes.coachPrograms}?${n}` : routes.coachPrograms);
  };

  const toDateOnly = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };

  const createProgramForStudent = async (s: CoachStudentListItemJson) => {
    if (!token) return;
    setActionMsg(null);
    setActionErr(null);
    setCreatingForStudentId(s.studentUserId);
    const start = new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + 27);
    const res = await apiFetch<{ programId: number; message?: string }>("/api/v1/coach/programs", {
      method: "POST",
      accessToken: token,
      body: JSON.stringify({
        studentUserId: s.studentUserId,
        monthlyAssessmentFormId: s.latestAssessmentFormId ?? null,
        body: {
          title: `${new Date().toLocaleDateString("tr-TR", { month: "long", year: "numeric" })} programı`,
          goalSummary: s.lastAssessmentSummary ?? null,
          startDate: toDateOnly(start),
          endDate: toDateOnly(end),
          durationType: 1,
          coachNotes: null,
          coachSupplementRecommendation: null,
          weeks: [],
        },
      }),
    });
    setCreatingForStudentId(null);
    if (!res.ok) {
      setActionErr(res.message);
      return;
    }
    setActionMsg(res.data.message ?? "Taslak program oluşturuldu.");
    router.push(`${routes.coachPrograms}/${res.data.programId}`);
  };

  if (!ready || loading) {
    return <LoadingState label="Program listesi yükleniyor..." />;
  }

  if (err || !data) {
    return <ErrorState message={err ?? "Veri yok."} />;
  }

  const rows = data.programs ?? [];
  const selectedStudentLabel =
    data.studentOptions.find((x) => x.studentUserId === selectedStudentId)?.label ||
    noProgramStudents.find((x) => x.studentUserId === selectedStudentId)?.displayName ||
    selectedStudentId ||
    "";
  const currentPublished = rows.filter((x) => x.programStatus === 1 && x.isCurrent);
  const drafts = rows.filter((x) => x.programStatus === 0);
  const otherRows = rows.filter((x) => !(x.programStatus === 1 && x.isCurrent) && x.programStatus !== 0);

  return (
    <DashboardShell className="py-2">
      <PageHeader
        eyebrow="Operasyon"
        title="Programlar"
        lead="Öğrenci programlarını tek ekranda takip et: kimin programı yayında, kimde taslak var, kim program bekliyor."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Kapsamdaki program" value={data.scopeTotal} />
        <StatCard label="Yayında (filtre)" value={data.publishedProgramCount} tone="success" />
        <StatCard label="Taslak (filtre)" value={data.draftProgramCount} tone="orange" />
        <StatCard label="Program bekleyen öğrenci" value={overview?.metrics.activePackageWithoutPublishedProgramCount ?? "—"} tone="pink" />
        <StatCard label="Forma bağlı program eksik" value={overview?.metrics.submittedAssessmentWithoutLinkedProgramCount ?? "—"} tone="purple" />
      </div>

      {noProgramStudents.length > 0 ? (
        <section className="mt-5 rounded-2xl border border-red-500/35 bg-red-500/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-base font-bold text-white">Öncelikli: Programı olmayan öğrenciler</h2>
            <Link href={`${routes.coachStudents}?programGap=nopublished`} className="text-xs font-semibold text-pf-orange-bright hover:underline">
              Tümünü öğrenci listesinde aç
            </Link>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {noProgramStudents.map((s) => (
              <div key={s.studentUserId} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{s.displayName?.trim() || s.email}</p>
                  <p className="truncate text-xs text-zinc-500">{s.packageName ? `${s.packageName} · ` : ""}{s.email}</p>
                  <p className="mt-0.5 text-[11px] text-zinc-400">
                    {s.latestAssessmentFormId
                      ? `Son form #${s.latestAssessmentFormId} (${s.latestAssessmentStatus == null ? "durum yok" : `durum ${s.latestAssessmentStatus}`})`
                      : "Koça iletilmiş form görünmüyor"}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={creatingForStudentId === s.studentUserId || !s.latestAssessmentFormId || s.latestAssessmentStatus === 0}
                  onClick={() => void createProgramForStudent(s)}
                  className="shrink-0 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creatingForStudentId === s.studentUserId ? "Oluşturuluyor…" : "Program oluştur"}
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {actionMsg ? (
        <div className="mt-4 rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{actionMsg}</div>
      ) : null}
      {actionErr ? <div className="mt-4 rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-200">{actionErr}</div> : null}

      {selectedStudentId ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          <p>
            Öğrenci filtresi aktif: <strong className="text-white">{selectedStudentLabel}</strong>
          </p>
          <button
            type="button"
            onClick={() => apply({ studentId: null })}
            className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
          >
            Filtreyi temizle
          </button>
        </div>
      ) : null}

      <div className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-pf-void/40 p-4 md:grid-cols-2 lg:grid-cols-4">
        <label className="block text-xs text-zinc-400">
          Öğrenci
          <select
            className="mt-1 w-full rounded-lg border border-white/15 bg-pf-void px-2 py-2 text-sm text-white"
            value={sp.get("studentId") ?? ""}
            onChange={(e) => apply({ studentId: e.target.value || null })}
          >
            <option value="">Tümü</option>
            {(data.studentOptions ?? []).map((o) => (
              <option key={o.studentUserId} value={o.studentUserId}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-zinc-400">
          Arama
          <input
            className="mt-1 w-full rounded-lg border border-white/15 bg-pf-void px-2 py-2 text-sm text-white"
            defaultValue={sp.get("q") ?? ""}
            onBlur={(e) => apply({ q: e.target.value.trim() || null })}
            placeholder="Başlık / öğrenci…"
          />
        </label>
        <label className="block text-xs text-zinc-400">
          Durum
          <select
            className="mt-1 w-full rounded-lg border border-white/15 bg-pf-void px-2 py-2 text-sm text-white"
            value={sp.get("status") ?? "all"}
            onChange={(e) => apply({ status: e.target.value })}
          >
            {Object.entries(statusLabels).map(([k, lab]) => (
              <option key={k} value={k}>
                {lab}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-zinc-400">
          Güncellik
          <select
            className="mt-1 w-full rounded-lg border border-white/15 bg-pf-void px-2 py-2 text-sm text-white"
            value={sp.get("current") ?? "all"}
            onChange={(e) => apply({ current: e.target.value })}
          >
            {Object.entries(currentLabels).map(([k, lab]) => (
              <option key={k} value={k}>
                {lab}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5 rounded-xl border border-white/10 bg-pf-void/35 px-4 py-3 text-xs text-zinc-400">
        Programlar durum bazında gruplanır: önce aktif/güncel, sonra taslaklar, en altta arşiv/geçmiş kayıtlar.
      </div>

      {rows.length === 0 ? (
        <SectionCard>
          <EmptyState title="Sonuç yok" message="Bu filtre kombinasyonunda program bulunamadı." />
        </SectionCard>
      ) : (
        <div className="mt-6 space-y-6">
          {[
            { key: "current", title: "Aktif / Güncel Programlar", rows: currentPublished, tone: "border-emerald-500/35 bg-emerald-500/10" },
            { key: "draft", title: "Taslak Programlar", rows: drafts, tone: "border-amber-500/35 bg-amber-500/10" },
            { key: "other", title: "Arşiv / Diğer Programlar", rows: otherRows, tone: "border-white/10 bg-white/[0.03]" },
          ].map((grp) =>
            grp.rows.length > 0 ? (
              <section key={grp.key} className={`rounded-2xl border ${grp.tone} p-4`}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="font-display text-base font-bold text-white">{grp.title}</h2>
                  <span className="rounded-full border border-white/15 px-2.5 py-1 text-xs text-zinc-300">{grp.rows.length}</span>
                </div>
                <div className="space-y-3">
                  {grp.rows.map((p) => (
                    <article key={p.id} className="rounded-xl border border-white/10 bg-pf-card/40 p-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pf-orange/20 text-xs font-bold text-pf-orange-bright">
                              {initials(p.studentDisplayName, p.studentEmail)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-white">{p.studentDisplayName || p.studentEmail}</p>
                              <p className="truncate text-xs text-zinc-500">{p.studentEmail}</p>
                            </div>
                          </div>
                          <p className="mt-2 text-sm font-semibold text-zinc-100">
                            {p.title} <span className="text-xs text-zinc-500">v{p.versionNo}</span>
                            {p.isCurrent ? <span className="ml-2 rounded bg-pf-green/20 px-1.5 py-0.5 text-[10px] font-bold text-pf-green-bright">Güncel</span> : null}
                          </p>
                          <p className="mt-1 text-xs text-zinc-400">{p.weekCount} hafta · {p.dayCount} gün · {fmtDate(p.startDate)} → {fmtDate(p.endDate)}</p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${programStatusBadgeClass(p.programStatus)}`}>
                            {programStatusLabels[p.programStatus] ?? p.programStatus}
                          </span>
                          <Link href={`${routes.coachPrograms}/${p.id}`} className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-pf-orange-bright hover:bg-white/5">
                            Detay
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null,
          )}
        </div>
      )}
    </DashboardShell>
  );
}
