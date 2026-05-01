"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api/client";
import { canAccessCoachArea, primaryDashboardPath } from "@/lib/auth/paths";
import { PageHeader } from "@/components/PageHeader";
import { routes } from "@/lib/site";

type Row = {
  reportId: number;
  reportPublicId: string;
  trainingProgramId: number;
  studentUserId: string;
  programTitle: string;
  programEndDate: string;
  submittedAtUtc: string;
  nutritionComplianceScore: number;
  trainingComplianceScore: number;
  notes?: string | null;
  studentDisplayName?: string | null;
  studentEmail?: string | null;
};

export function CoachProgramFeedbackClient() {
  const router = useRouter();
  const { token, ready, user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace(`${routes.login}?returnUrl=${encodeURIComponent(routes.coachProgramFeedback)}`);
      return;
    }
    if (!canAccessCoachArea(user?.roles)) {
      router.replace(primaryDashboardPath(user?.roles ?? []) ?? routes.home);
      return;
    }
    let c = false;
    void (async () => {
      setLoading(true);
      const r = await apiFetch<Row[]>("/api/v1/coach/program-feedback", { accessToken: token });
      if (c) return;
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
      c = true;
    };
  }, [ready, token, user, router]);

  if (!ready || loading) {
    return <div className="py-16 text-center text-sm text-zinc-500">Yükleniyor…</div>;
  }

  return (
    <div className="py-2 lg:py-4">
      <PageHeader
        eyebrow="Operasyon"
        title="Durum bildirimleri"
        lead="Öğrencilerin gönderdiği program tamamlama raporları (GET /api/v1/coach/program-feedback). Yalnız koç rolü."
      />
      {err ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">{err}</p>
      ) : null}
      <div className="mt-6 space-y-3">
        {rows.length === 0 && !err ? (
          <p className="text-sm text-zinc-500">Henüz kayıt yok veya erişim yok.</p>
        ) : null}
        {rows.map((x) => (
          <article key={x.reportId} className="rounded-2xl border border-white/10 bg-pf-card/40 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase text-pf-mist">{new Date(x.submittedAtUtc).toLocaleString("tr-TR")}</p>
                <h2 className="font-display text-lg font-bold text-white">{x.programTitle}</h2>
                <p className="text-sm text-zinc-400">
                  {x.studentDisplayName || x.studentEmail || "Öğrenci"} · Bitiş: {x.programEndDate}
                </p>
              </div>
              <Link href={`${routes.coachPrograms}/${x.trainingProgramId}`} className="text-sm font-semibold text-pf-orange-bright hover:underline">
                Program →
              </Link>
            </div>
            <p className="mt-3 text-sm text-zinc-300">
              Beslenme uyumu: <span className="font-bold text-white">{x.nutritionComplianceScore}</span> · Antrenman uyumu:{" "}
              <span className="font-bold text-white">{x.trainingComplianceScore}</span>
            </p>
            {x.notes ? <p className="mt-2 text-sm text-zinc-400">Öğrenci notu: {x.notes}</p> : null}
            <Link href={`${routes.coachStudents}/${x.studentUserId}`} className="mt-2 inline-block text-xs font-semibold text-zinc-300 hover:text-white">
              Öğrenci profiline git →
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
