"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api/client";
import { canAccessCoachArea, primaryDashboardPath } from "@/lib/auth/paths";
import { PageHeader } from "@/components/PageHeader";
import { routes } from "@/lib/site";

type PackageDto = {
  /** API: `studentPackageId` (öğrenci paket satırı). */
  studentPackageId: number;
  packageName: string;
  startsAtUtc: string;
  endsAtUtc: string;
};

type AssessmentList = {
  id: number;
  year: number;
  month: number;
  formStatus: number;
  submittedAtUtc?: string | null;
};

type ProgramSummary = {
  programId: number;
  title: string;
  versionNo: number;
  startDate: string;
  endDate: string;
};

type DetailJson = {
  studentUserId: string;
  email: string;
  displayName?: string | null;
  activePackage?: PackageDto | null;
  lastSubmittedAssessment?: AssessmentList | null;
  measurementHistory: { year: number; month: number; weightKg?: number | null; waistCm?: number | null }[];
  activeProgram?: ProgramSummary | null;
  draftProgram?: ProgramSummary | null;
  latestCoachReviewNote?: string | null;
  recentStatusReports?: {
    reportId: number;
    trainingProgramId: number;
    submittedAtUtc: string;
    nutritionComplianceScore: number;
    trainingComplianceScore: number;
    notes?: string | null;
  }[];
  recentBeforeAfterPosts?: {
    postPublicId: string;
    heading?: string | null;
    preview: string;
    periodLabel?: string | null;
    createdAtUtc: string;
    moderationStatus: number;
  }[];
  recentFeedPosts?: {
    postPublicId: string;
    heading?: string | null;
    preview: string;
    createdAtUtc: string;
    moderationStatus: number;
  }[];
};

export function CoachStudentDetailClient({ studentId }: { studentId: string }) {
  const router = useRouter();
  const { token, ready, user } = useAuth();
  const [d, setD] = useState<DetailJson | null>(null);
  const [forms, setForms] = useState<AssessmentList[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace(`${routes.login}?returnUrl=${encodeURIComponent(`${routes.coachStudents}/${studentId}`)}`);
      return;
    }
    if (!canAccessCoachArea(user?.roles)) {
      router.replace(primaryDashboardPath(user?.roles ?? []) ?? routes.home);
      return;
    }
    let c = false;
    void (async () => {
      setLoading(true);
      const [det, fm] = await Promise.all([
        apiFetch<DetailJson>(`/api/v1/coach/students/${studentId}`, { accessToken: token }),
        apiFetch<AssessmentList[]>(`/api/v1/coach/monthly-assessments/student/${studentId}/forms`, { accessToken: token }),
      ]);
      if (c) return;
      if (!det.ok) {
        setErr(det.message);
        setD(null);
      } else {
        setErr(null);
        setD(det.data);
      }
      if (fm.ok && Array.isArray(fm.data)) setForms(fm.data);
      else setForms([]);
      setLoading(false);
    })();
    return () => {
      c = true;
    };
  }, [ready, token, user, router, studentId]);

  if (!ready || loading) {
    return <div className="py-16 text-center text-sm text-zinc-500">Yükleniyor…</div>;
  }

  if (err || !d) {
    return (
      <div className="py-10">
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{err ?? "Bulunamadı."}</p>
        <Link href={routes.coachStudents} className="mt-4 inline-block text-sm text-pf-orange-bright">
          ← Öğrenci listesi
        </Link>
      </div>
    );
  }

  const title = d.displayName?.trim() || d.email;

  return (
    <div className="py-2 lg:py-4">
      <PageHeader eyebrow="Öğrenci" title={title} lead={d.email} />
      <div className="mb-6 flex flex-wrap gap-3">
        <Link href={routes.coachStudents} className="text-sm text-zinc-400 hover:text-white">
          ← Liste
        </Link>
        {d.activePackage ? (
          <Link
            href={`${routes.coachLiveChat}/${d.activePackage.studentPackageId}`}
            className="text-sm text-pf-orange-bright hover:underline"
          >
            Canlı sohbet — {d.activePackage.packageName}
          </Link>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-pf-card/40 p-5">
          <h2 className="text-sm font-bold text-white">Aktif paket</h2>
          {d.activePackage ? (
            <dl className="mt-3 space-y-2 text-sm text-zinc-400">
              <div>
                <dt className="text-xs uppercase text-zinc-500">Paket</dt>
                <dd className="text-white">{d.activePackage.packageName}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-zinc-500">Bitiş</dt>
                <dd>{new Date(d.activePackage.endsAtUtc).toLocaleString("tr-TR")}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">Aktif paket yok.</p>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-pf-card/40 p-5">
          <h2 className="text-sm font-bold text-white">Program</h2>
          {d.activeProgram ? (
            <div className="mt-3">
              <p className="font-semibold text-white">{d.activeProgram.title}</p>
              <p className="text-xs text-zinc-500">
                v{d.activeProgram.versionNo} · {d.activeProgram.startDate} → {d.activeProgram.endDate}
              </p>
              <Link className="mt-2 inline-block text-sm text-pf-orange-bright" href={`${routes.coachPrograms}/${d.activeProgram.programId}`}>
                Program detayı →
              </Link>
            </div>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">Yayımlanmış güncel program yok.</p>
          )}
          {d.draftProgram ? (
            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="text-xs font-bold uppercase text-amber-400">Taslak</p>
              <p className="text-sm text-white">{d.draftProgram.title}</p>
              <Link className="mt-1 inline-block text-sm text-pf-orange-bright" href={`${routes.coachPrograms}/${d.draftProgram.programId}`}>
                Taslağı aç →
              </Link>
            </div>
          ) : null}
        </section>
      </div>

      {d.lastSubmittedAssessment ? (
        <section className="mt-6 rounded-2xl border border-white/10 bg-pf-card/40 p-5">
          <h2 className="text-sm font-bold text-white">Son gönderilen form</h2>
          <p className="mt-2 text-sm text-zinc-400">
            {d.lastSubmittedAssessment.year}/{d.lastSubmittedAssessment.month} · Durum: {d.lastSubmittedAssessment.formStatus}
          </p>
          <Link href={`/koc/formlar/${d.lastSubmittedAssessment.id}`} className="mt-2 inline-block text-sm font-semibold text-pf-orange-bright">
            Formu görüntüle / incele →
          </Link>
        </section>
      ) : null}

      {d.latestCoachReviewNote ? (
        <p className="mt-6 rounded-xl border border-white/10 bg-pf-void/50 p-4 text-sm text-zinc-300">
          <span className="font-bold text-pf-mist">Son koç notu: </span>
          {d.latestCoachReviewNote}
        </p>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-pf-card/40 p-5">
          <h2 className="text-sm font-bold text-white">Son durum bildirimleri</h2>
          <ul className="mt-3 space-y-2">
            {(d.recentStatusReports ?? []).length === 0 ? (
              <li className="text-sm text-zinc-500">Durum bildirimi yok.</li>
            ) : (
              (d.recentStatusReports ?? []).map((r) => (
                <li key={r.reportId} className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-zinc-300">
                  <p>
                    {new Date(r.submittedAtUtc).toLocaleString("tr-TR")} · Beslenme {r.nutritionComplianceScore}/5 · Antrenman {r.trainingComplianceScore}/5
                  </p>
                  {r.notes ? <p className="mt-1 text-xs text-zinc-400">{r.notes}</p> : null}
                  <Link href={`${routes.coachPrograms}/${r.trainingProgramId}`} className="mt-1 inline-block text-xs text-pf-orange-bright">
                    Programa git →
                  </Link>
                </li>
              ))
            )}
          </ul>
          <Link href={routes.coachProgramFeedback} className="mt-3 inline-block text-xs font-semibold text-zinc-300 hover:text-white">
            Tüm durum bildirimleri →
          </Link>
        </section>

        <section className="rounded-2xl border border-white/10 bg-pf-card/40 p-5">
          <h2 className="text-sm font-bold text-white">Son değişimler (öncesi/sonrası)</h2>
          <ul className="mt-3 space-y-2">
            {(d.recentBeforeAfterPosts ?? []).length === 0 ? (
              <li className="text-sm text-zinc-500">Değişim paylaşımı yok.</li>
            ) : (
              (d.recentBeforeAfterPosts ?? []).map((p) => (
                <li key={p.postPublicId} className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-zinc-300">
                  <p className="font-semibold text-white">{p.heading?.trim() || "Değişim paylaşımı"}</p>
                  {p.periodLabel ? <p className="text-xs text-zinc-500">{p.periodLabel}</p> : null}
                  <p className="mt-1 text-xs text-zinc-400">{p.preview}</p>
                  <p className="mt-1 text-[11px] text-zinc-500">{new Date(p.createdAtUtc).toLocaleString("tr-TR")}</p>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-white/10 bg-pf-card/40 p-5">
        <h2 className="text-sm font-bold text-white">Son topluluk paylaşımları</h2>
        <ul className="mt-3 space-y-2">
          {(d.recentFeedPosts ?? []).length === 0 ? (
            <li className="text-sm text-zinc-500">Topluluk paylaşımı yok.</li>
          ) : (
            (d.recentFeedPosts ?? []).map((p) => (
              <li key={p.postPublicId} className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-zinc-300">
                <p className="font-semibold text-white">{p.heading?.trim() || "Paylaşım"}</p>
                <p className="mt-1 text-xs text-zinc-400">{p.preview}</p>
                <p className="mt-1 text-[11px] text-zinc-500">{new Date(p.createdAtUtc).toLocaleString("tr-TR")}</p>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-bold text-white">Aylık formlar</h2>
        <ul className="mt-3 space-y-2">
          {forms.length === 0 ? (
            <li className="text-sm text-zinc-500">Kayıt yok.</li>
          ) : (
            forms.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-pf-void/40 px-3 py-2 text-sm">
                <span className="text-zinc-300">
                  {f.year}/{f.month} · durum {f.formStatus}
                </span>
                <Link href={`/koc/formlar/${f.id}`} className="font-semibold text-pf-orange-bright hover:underline">
                  Aç
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
