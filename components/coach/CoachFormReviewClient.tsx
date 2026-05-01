"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api/client";
import { getPublicApiBaseUrl } from "@/lib/api/config";
import { canAccessCoachArea, primaryDashboardPath } from "@/lib/auth/paths";
import { routes } from "@/lib/site";
import { assessmentPhotoInstruction } from "@/lib/assessment-progress-photo-instructions";
import { Badge, DashboardShell, ErrorState, LoadingState, SectionCard } from "@/components/dashboard/DashboardUI";

type Detail = {
  id: number;
  studentUserId: string;
  year: number;
  month: number;
  formStatus: number;
  submittedAtUtc?: string | null;
  reviewedAtUtc?: string | null;
  fullName: string;
  goalType: number;
  age: number;
  heightCm: number;
  weightKg: number;
  healthIssues?: string | null;
  injuryText?: string | null;
  hasUsedSteroids: boolean;
  steroidUsageText?: string | null;
  willUseSupplements: boolean;
  supplementText?: string | null;
  trainingHistoryText?: string | null;
  weeklyTrainingDays: number;
  preferredTrainingDaysMask: number;
  preferredTrainingTimeMinutes?: number | null;
  dailyTrainingHours: number;
  bloodType?: string | null;
  foodAllergiesText?: string | null;
  recentDietOrSpecialPracticeText?: string | null;
  hasHomeCardioEquipment: boolean;
  homeCardioEquipmentText?: string | null;
  dailyNutritionText?: string | null;
  dailyWaterConsumptionText?: string | null;
  motivationText?: string | null;
  neckCm?: number | null;
  shoulderCm?: number | null;
  studentNote?: string | null;
  coachReviewNote?: string | null;
  chestCm?: number | null;
  waistCm?: number | null;
  bicepsCm?: number | null;
  hipCm?: number | null;
  upperLegCm?: number | null;
  calfCm?: number | null;
  photosOrderedForDisplay?: { publicId: string; fileName: string; photoType: number }[];
};

type GetJson = {
  detail: Detail;
  linkedProgram?: { programId?: number; programStatus?: number } | null;
};

const statusLabels: Record<number, string> = {
  0: "Taslak",
  1: "Gönderildi",
  2: "İncelendi",
  3: "Onaylandı",
  4: "Revizyon",
  5: "Arşiv",
};

const goalLabels: Record<number, string> = {
  0: "Kilo verme",
  1: "Kilo alma",
  2: "Rekompozisyon",
  3: "Form / koruma",
  4: "Diğer hedef",
};

const WEEK_BITS: { bit: number; label: string }[] = [
  { bit: 1, label: "Pzt" },
  { bit: 2, label: "Sal" },
  { bit: 4, label: "Çar" },
  { bit: 8, label: "Per" },
  { bit: 16, label: "Cum" },
  { bit: 32, label: "Cmt" },
  { bit: 64, label: "Paz" },
];

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function fmtNum(n: number | null | undefined, suffix = "") {
  if (n == null || Number.isNaN(n)) return "—";
  const s = Number(n).toLocaleString("tr-TR", { maximumFractionDigits: 2, minimumFractionDigits: 0 });
  return suffix ? `${s} ${suffix}` : s;
}

function minutesToClock(m: number | null | undefined) {
  if (m == null || m < 0) return "—";
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function weekdaysFromMask(mask: number) {
  const parts = WEEK_BITS.filter((x) => (mask & x.bit) !== 0).map((x) => x.label);
  return parts.length ? parts.join(", ") : "—";
}

function statusBadgeClass(s: number): string {
  if (s === 1) return "bg-amber-500/90 text-black";
  if (s === 2) return "bg-sky-600 text-white";
  if (s === 3) return "bg-emerald-600 text-white";
  if (s === 4) return "bg-amber-400 text-black";
  if (s === 5) return "border border-white/20 bg-zinc-800/80 text-zinc-200";
  return "bg-zinc-700 text-white";
}

function coachProgramsForStudentPath(studentUserId: string) {
  const q = new URLSearchParams();
  q.set("studentId", studentUserId);
  return `${routes.coachPrograms}?${q.toString()}`;
}

function ReadRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-white/5 py-2 sm:grid sm:grid-cols-[minmax(0,11rem)_1fr] sm:gap-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-zinc-200 sm:mt-0">{children}</dd>
    </div>
  );
}

function ReadBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-pf-card/30 p-4 sm:p-5">
      <h2 className="font-display text-sm font-semibold text-white">{title}</h2>
      <dl className="mt-3">{children}</dl>
    </section>
  );
}

function AuthenticatedPhotoThumb({
  publicId,
  accessToken,
  caption,
}: {
  publicId: string;
  accessToken: string | null;
  caption: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState(false);
  const blobRef = useRef<string | null>(null);

  useEffect(() => {
    if (!accessToken || !publicId) return;
    let cancelled = false;
    const u = `${getPublicApiBaseUrl()}/api/v1/media/assessment-photos/${encodeURIComponent(publicId)}`;
    void (async () => {
      try {
        const r = await fetch(u, { headers: { Authorization: `Bearer ${accessToken}`, Accept: "image/*,*/*" } });
        if (!r.ok || cancelled) throw new Error("fetch");
        const blob = await r.blob();
        if (cancelled) return;
        if (blobRef.current) URL.revokeObjectURL(blobRef.current);
        const obj = URL.createObjectURL(blob);
        blobRef.current = obj;
        setUrl(obj);
        setErr(false);
      } catch {
        if (!cancelled) setErr(true);
      }
    })();
    return () => {
      cancelled = true;
      if (blobRef.current) {
        URL.revokeObjectURL(blobRef.current);
        blobRef.current = null;
      }
    };
  }, [publicId, accessToken]);

  return (
    <figure className="rounded-xl border border-white/10 bg-pf-void/40 p-2">
      <figcaption className="mb-2 text-xs font-medium text-zinc-300">{caption}</figcaption>
      {err ? (
        <p className="text-xs text-red-300">Önizleme yüklenemedi.</p>
      ) : url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="max-h-64 w-full rounded-lg object-contain" />
      ) : (
        <p className="text-xs text-zinc-500">Yükleniyor…</p>
      )}
    </figure>
  );
}

export function CoachFormReviewClient({ formId }: { formId: string }) {
  const router = useRouter();
  const { token, ready, user } = useAuth();
  const [data, setData] = useState<GetJson | null>(null);
  const [note, setNote] = useState("");
  const [target, setTarget] = useState<number>(3);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    const r = await apiFetch<GetJson>(`/api/v1/coach/monthly-assessments/${formId}`, { accessToken: token });
    if (!r.ok) {
      setErr(r.message);
      setData(null);
      return;
    }
    setErr(null);
    setData(r.data);
    setNote(r.data.detail.coachReviewNote ?? "");
  }, [token, formId]);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace(`${routes.login}?returnUrl=${encodeURIComponent(`/koc/formlar/${formId}`)}`);
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
  }, [ready, token, user, router, load, formId]);

  const save = async () => {
    if (!token) return;
    setSaving(true);
    setMsg(null);
    setErr(null);
    const body = JSON.stringify({
      formId: Number(formId),
      targetStatus: target,
      coachReviewNote: note.trim() || null,
    });
    const r = await apiFetch<{ message?: string }>(`/api/v1/coach/monthly-assessments/${formId}/review`, {
      method: "POST",
      accessToken: token,
      body,
    });
    setSaving(false);
    if (!r.ok) {
      setErr(r.message);
      return;
    }
    setMsg(r.data && typeof r.data === "object" && "message" in r.data ? (r.data.message ?? "Kaydedildi.") : "Kaydedildi.");
    await load();
  };

  if (!ready || loading) {
    return <LoadingState label="Form detayı yükleniyor..." />;
  }

  if (err && !data) {
    return (
      <div className="py-4">
        <ErrorState message={err} />
        <Link href={routes.coachStudents} className="mt-4 inline-block text-sm text-pf-orange-bright">
          ← Öğrenciler
        </Link>
      </div>
    );
  }

  if (!data) return null;
  const d = data.detail;
  const lp = data.linkedProgram;
  const photos = d.photosOrderedForDisplay ?? [];

  return (
    <DashboardShell className="py-2">
      <div className="mb-4">
        <Link href={`${routes.coachStudents}/${d.studentUserId}`} className="text-sm text-pf-orange-bright hover:underline">
          ← Öğrenci profili
        </Link>
      </div>
      <header className="rounded-3xl border border-white/10 bg-pf-card/40 p-5 md:p-6">
        <p className="text-xs font-bold uppercase text-pf-orange-bright">
          Form #{d.id} · {d.year}/{d.month}
        </p>
        <h1 className="font-display mt-2 text-2xl font-bold text-white">{d.fullName}</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Durum: {statusLabels[d.formStatus] ?? d.formStatus}
          {d.submittedAtUtc ? ` · Gönderim: ${fmt(d.submittedAtUtc)}` : ""}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2" role="status" aria-live="polite">
          <Badge tone={d.formStatus === 4 ? "warning" : d.formStatus === 3 ? "success" : "orange"}>
            {statusLabels[d.formStatus] ?? `Durum ${d.formStatus}`}
          </Badge>
          {d.submittedAtUtc ? <span className="text-xs text-zinc-500">Koça iletilme: {fmt(d.submittedAtUtc)}</span> : null}
        </div>
        <div className="mt-4 rounded-xl border border-white/10 bg-pf-void/35 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Program bağlantısı</p>
          {lp?.programId ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="text-sm text-zinc-300">
                Bu forma bağlı program var: <strong className="text-white">#{lp.programId}</strong>
              </p>
              <Link
                className="inline-flex items-center justify-center rounded-full border border-emerald-500/50 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/10"
                href={`${routes.coachPrograms}/${lp.programId}`}
              >
                Programı göster
              </Link>
            </div>
          ) : (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="text-sm text-amber-200">Bu forma bağlı program yok.</p>
              <Link
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                href={coachProgramsForStudentPath(d.studentUserId)}
              >
                Program oluştur
              </Link>
            </div>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-pf-orange/30 bg-pf-raised/40 p-4">
          <p className="font-display text-sm font-bold text-white">Hızlı koç notu ve durum</p>
          <p id="review-help" className="mt-1 text-xs text-zinc-500">
            Durumu seçip kısa açıklama ekleyin; öğrenci bu notu görebilir.
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-[14rem_1fr] md:items-start">
            <label className="block text-xs text-zinc-400" htmlFor="coach-target-status">
              Hedef durum
              <select
                id="coach-target-status"
                className="mt-1 w-full rounded-lg border border-white/15 bg-pf-void px-3 py-2 text-sm text-white"
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
                aria-describedby="review-help"
              >
                <option value={2}>İncelendi</option>
                <option value={3}>Onaylandı</option>
                <option value={4}>Revizyon</option>
              </select>
            </label>
            <label className="block text-xs text-zinc-400" htmlFor="coach-review-note">
              Koç notu
              <textarea
                id="coach-review-note"
                className="mt-1 min-h-[96px] w-full rounded-lg border border-white/15 bg-pf-void px-3 py-2 text-sm text-white"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                aria-describedby="review-help"
                placeholder="Örn. Form uygun görünüyor, program planı bugün yayınlanacak."
              />
            </label>
          </div>
          {msg ? (
            <p className="mt-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-pf-green-bright" role="status" aria-live="polite">
              {msg}
            </p>
          ) : null}
          {err ? (
            <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300" role="alert">
              {err}
            </p>
          ) : null}
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="mt-3 rounded-full bg-pf-orange-bright px-5 py-2 text-sm font-bold text-black disabled:opacity-50"
          >
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </header>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ReadBlock title="Kimlik ve hedef">
          <ReadRow label="Ad soyad">{d.fullName}</ReadRow>
          <ReadRow label="Hedef">{goalLabels[d.goalType] ?? `Hedef ${d.goalType}`}</ReadRow>
          <ReadRow label="Yaş">{d.age}</ReadRow>
          <ReadRow label="Boy">{fmtNum(d.heightCm, "cm")}</ReadRow>
          <ReadRow label="Kilo">{fmtNum(d.weightKg, "kg")}</ReadRow>
          <ReadRow label="Gönderim">{fmt(d.submittedAtUtc)}</ReadRow>
          {d.reviewedAtUtc ? <ReadRow label="İnceleme">{fmt(d.reviewedAtUtc)}</ReadRow> : null}
        </ReadBlock>

        <ReadBlock title="Program">
          <ReadRow label="Bağlantı">
            {lp?.programId ? (
              <Link className="text-pf-orange-bright hover:underline" href={`${routes.coachPrograms}/${lp.programId}`}>
                Program #{lp.programId}
              </Link>
            ) : (
              <span className="text-zinc-500">Henüz bağlı yayın programı yok.</span>
            )}
          </ReadRow>
        </ReadBlock>

        <ReadBlock title="Sağlık ve geçmiş">
          <ReadRow label="Sağlık / kronik">{d.healthIssues?.trim() || "—"}</ReadRow>
          <ReadRow label="Sakatlık / ağrı">{d.injuryText?.trim() || "—"}</ReadRow>
          <ReadRow label="Steroid geçmişi">
            {d.hasUsedSteroids ? d.steroidUsageText?.trim() || "Evet (detay yok)" : "Hayır"}
          </ReadRow>
          <ReadRow label="Supplement isteği">
            {d.willUseSupplements ? "Evet" : "Hayır"}
            {d.supplementText?.trim() ? ` — ${d.supplementText}` : null}
          </ReadRow>
          <ReadRow label="Antrenman geçmişi">{d.trainingHistoryText?.trim() || "—"}</ReadRow>
        </ReadBlock>

        <ReadBlock title="Antrenman tercihleri">
          <ReadRow label="Haftalık gün">{d.weeklyTrainingDays}</ReadRow>
          <ReadRow label="Uygun günler">{weekdaysFromMask(d.preferredTrainingDaysMask)}</ReadRow>
          <ReadRow label="Tercih saati">{minutesToClock(d.preferredTrainingTimeMinutes ?? null)}</ReadRow>
          <ReadRow label="Günlük süre (saat)">{fmtNum(d.dailyTrainingHours, "saat")}</ReadRow>
          <ReadRow label="Kan grubu">{d.bloodType?.trim() || "—"}</ReadRow>
          <ReadRow label="Evde kardiyo">{d.hasHomeCardioEquipment ? d.homeCardioEquipmentText?.trim() || "Evet" : "Hayır"}</ReadRow>
        </ReadBlock>

        <ReadBlock title="Beslenme">
          <ReadRow label="Alerjiler">{d.foodAllergiesText?.trim() || "—"}</ReadRow>
          <ReadRow label="Son dönem diyet">{d.recentDietOrSpecialPracticeText?.trim() || "—"}</ReadRow>
          <ReadRow label="Günlük beslenme">{d.dailyNutritionText?.trim() || "—"}</ReadRow>
          <ReadRow label="Su tüketimi">{d.dailyWaterConsumptionText?.trim() || "—"}</ReadRow>
          <ReadRow label="Motivasyon">{d.motivationText?.trim() || "—"}</ReadRow>
        </ReadBlock>

        <ReadBlock title="Ölçüler (cm)">
          <ReadRow label="Boyun">{fmtNum(d.neckCm, "cm")}</ReadRow>
          <ReadRow label="Omuz">{fmtNum(d.shoulderCm, "cm")}</ReadRow>
          <ReadRow label="Göğüs">{fmtNum(d.chestCm, "cm")}</ReadRow>
          <ReadRow label="Bel">{fmtNum(d.waistCm, "cm")}</ReadRow>
          <ReadRow label="Biceps">{fmtNum(d.bicepsCm, "cm")}</ReadRow>
          <ReadRow label="Kalça">{fmtNum(d.hipCm, "cm")}</ReadRow>
          <ReadRow label="Üst bacak">{fmtNum(d.upperLegCm, "cm")}</ReadRow>
          <ReadRow label="Baldır">{fmtNum(d.calfCm, "cm")}</ReadRow>
        </ReadBlock>

        {d.studentNote?.trim() ? (
          <ReadBlock title="Öğrenci notu">
            <ReadRow label="Not">{d.studentNote}</ReadRow>
          </ReadBlock>
        ) : null}
      </div>

      {photos.length > 0 ? (
        <SectionCard title="Fotoğraflar" className="mt-6 bg-pf-card/30">
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {photos.map((p) => {
              const hint = assessmentPhotoInstruction(p.photoType);
              return (
                <AuthenticatedPhotoThumb
                  key={p.publicId}
                  publicId={p.publicId}
                  accessToken={token}
                  caption={`${hint.title} · ${p.fileName}`}
                />
              );
            })}
          </div>
        </SectionCard>
      ) : null}
    </DashboardShell>
  );
}
