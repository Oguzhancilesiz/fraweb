"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { primaryDashboardPath } from "@/lib/auth/paths";
import { getPublicApiBaseUrl } from "@/lib/api/config";
import { routes } from "@/lib/site";
import { PageHeader } from "@/components/PageHeader";
import { assessmentPhotoInstruction } from "@/lib/assessment-progress-photo-instructions";

type DetailJson = {
  id: number;
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
  chestCm?: number | null;
  waistCm?: number | null;
  bicepsCm?: number | null;
  hipCm?: number | null;
  upperLegCm?: number | null;
  calfCm?: number | null;
  studentNote?: string | null;
  coachReviewNote?: string | null;
  photosOrderedForDisplay?: { publicId: string; fileName: string; photoType: number }[];
  linkedTrainingProgramId?: number | null;
  linkedTrainingProgramStatus?: number | null;
};

function statusLabelTr(s: number) {
  if (s === 0) return "Taslak";
  if (s === 1) return "Gönderildi";
  if (s === 2) return "İncelendi";
  if (s === 3) return "Onaylandı";
  if (s === 4) return "Revizyon";
  if (s === 5) return "Arşiv";
  return `Durum ${s}`;
}

function goalLabelTr(g: number) {
  if (g === 0) return "Kilo verme";
  if (g === 1) return "Kilo alma";
  if (g === 2) return "Rekompozisyon";
  if (g === 3) return "Form / koruma";
  if (g === 4) return "Diğer hedef";
  return `Hedef ${g}`;
}

function fmtIsoTr(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function fmtNumTr(n: number | null | undefined, suffix = "") {
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

const WEEK_BITS: { bit: number; label: string }[] = [
  { bit: 1, label: "Pzt" },
  { bit: 2, label: "Sal" },
  { bit: 4, label: "Çar" },
  { bit: 8, label: "Per" },
  { bit: 16, label: "Cum" },
  { bit: 32, label: "Cmt" },
  { bit: 64, label: "Paz" },
];

function weekdaysFromMask(mask: number) {
  const parts = WEEK_BITS.filter((x) => (mask & x.bit) !== 0).map((x) => x.label);
  return parts.length ? parts.join(", ") : "—";
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

type Props = { formIdParam: string };

export function StudentMonthlyAssessmentDetailClient({ formIdParam }: Props) {
  const router = useRouter();
  const { token, ready, user } = useAuth();
  const formId = Number.parseInt(formIdParam, 10);
  const [detail, setDetail] = useState<DetailJson | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    if (!Number.isFinite(formId) || formId < 1) {
      setErr("Geçersiz form numarası.");
      setDetail(null);
      setLoading(false);
      return;
    }
    const r = await apiFetch<DetailJson>(`/api/v1/student/monthly-assessments/${formId}`, { accessToken: token });
    if (!r.ok) {
      setErr(r.message);
      setDetail(null);
    } else {
      setErr(null);
      setDetail(r.data);
    }
    setLoading(false);
  }, [token, formId]);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      const returnUrl =
        Number.isFinite(formId) && formId > 0 ? routes.studentAssessmentView(formId) : routes.studentAssessments;
      router.replace(`${routes.login}?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }
    if (!user?.roles?.includes("Student")) {
      router.replace(primaryDashboardPath(user?.roles ?? []) ?? routes.home);
      return;
    }
    void load();
  }, [ready, token, user, router, load, formId]);

  useEffect(() => {
    if (!detail) return;
    if (detail.formStatus === 0) {
      router.replace(routes.studentAssessmentEdit(detail.id));
    }
  }, [detail, router]);

  const periodLabel = useMemo(() => {
    if (!detail) return "";
    try {
      return new Date(detail.year, detail.month - 1, 1).toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
    } catch {
      return `${detail.month}/${detail.year}`;
    }
  }, [detail]);

  if (!ready || loading) return <div className="py-16 text-center text-sm text-zinc-500">Yükleniyor…</div>;
  if (err || !detail) {
    return (
      <div className="py-10">
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{err ?? "Kayıt bulunamadı."}</p>
        <Link href={routes.studentAssessments} className="mt-4 inline-block text-sm text-pf-orange-bright hover:underline">
          Değerlendirmelere dön
        </Link>
      </div>
    );
  }

  if (detail.formStatus === 0) {
    return <div className="py-16 text-center text-sm text-zinc-500">Taslak forma yönlendiriliyor…</div>;
  }

  const photos = detail.photosOrderedForDisplay ?? [];

  return (
    <div className="py-2 lg:py-4">
      <PageHeader
        eyebrow="Öğrenci paneli"
        title={`Değerlendirme — ${detail.month}/${detail.year}`}
        lead="Bu ekran salt okunurdur; koçuna ilettiğin kaydı tekrar gösterir. Düzenleme yalnızca taslakken yapılabilir."
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          href={routes.studentAssessments}
          className="text-sm font-medium text-pf-orange-bright hover:underline"
        >
          ← Değerlendirmelere dön
        </Link>
        <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-100">
          {statusLabelTr(detail.formStatus)}
        </span>
        <span className="text-sm text-zinc-400">{periodLabel}</span>
      </div>

      {detail.coachReviewNote?.trim() ? (
        <div className="mb-6 rounded-2xl border border-pf-orange/35 bg-pf-orange/10 px-4 py-3 text-sm text-zinc-100">
          <p className="text-xs font-bold uppercase tracking-wide text-pf-orange-bright">Koç notu</p>
          <p className="mt-1 whitespace-pre-wrap">{detail.coachReviewNote}</p>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <ReadBlock title="Kimlik ve hedef">
          <ReadRow label="Ad soyad">{detail.fullName}</ReadRow>
          <ReadRow label="Hedef">{goalLabelTr(detail.goalType)}</ReadRow>
          <ReadRow label="Yaş">{detail.age}</ReadRow>
          <ReadRow label="Boy">{fmtNumTr(detail.heightCm, "cm")}</ReadRow>
          <ReadRow label="Kilo">{fmtNumTr(detail.weightKg, "kg")}</ReadRow>
          <ReadRow label="Gönderim">{fmtIsoTr(detail.submittedAtUtc)}</ReadRow>
          {detail.reviewedAtUtc ? <ReadRow label="İnceleme">{fmtIsoTr(detail.reviewedAtUtc)}</ReadRow> : null}
        </ReadBlock>

        <ReadBlock title="Program">
          <ReadRow label="Bağlantı">
            {detail.linkedTrainingProgramId ? (
              <Link href={routes.studentProgram} className="text-pf-orange-bright hover:underline">
                Program #{detail.linkedTrainingProgramId}
              </Link>
            ) : (
              <span className="text-zinc-500">Henüz bağlı yayınlanmış program yok; koç hazırlayınca listede görünür.</span>
            )}
          </ReadRow>
        </ReadBlock>

        <ReadBlock title="Sağlık ve geçmiş">
          <ReadRow label="Sağlık / kronik">{detail.healthIssues?.trim() || "—"}</ReadRow>
          <ReadRow label="Sakatlık / ağrı">{detail.injuryText?.trim() || "—"}</ReadRow>
          <ReadRow label="Steroid geçmişi">
            {detail.hasUsedSteroids ? detail.steroidUsageText?.trim() || "Evet (detay yok)" : "Hayır"}
          </ReadRow>
          <ReadRow label="Supplement isteği">
            {detail.willUseSupplements ? "Evet" : "Hayır"}
            {detail.supplementText?.trim() ? ` — ${detail.supplementText}` : null}
          </ReadRow>
          <ReadRow label="Antrenman geçmişi">{detail.trainingHistoryText?.trim() || "—"}</ReadRow>
        </ReadBlock>

        <ReadBlock title="Antrenman tercihleri">
          <ReadRow label="Haftalık gün">{detail.weeklyTrainingDays}</ReadRow>
          <ReadRow label="Uygun günler">{weekdaysFromMask(detail.preferredTrainingDaysMask)}</ReadRow>
          <ReadRow label="Tercih saati">{minutesToClock(detail.preferredTrainingTimeMinutes ?? null)}</ReadRow>
          <ReadRow label="Günlük süre (saat)">{fmtNumTr(detail.dailyTrainingHours, "saat")}</ReadRow>
          <ReadRow label="Kan grubu">{detail.bloodType?.trim() || "—"}</ReadRow>
          <ReadRow label="Evde kardiyo">{detail.hasHomeCardioEquipment ? detail.homeCardioEquipmentText?.trim() || "Evet" : "Hayır"}</ReadRow>
        </ReadBlock>

        <ReadBlock title="Beslenme">
          <ReadRow label="Alerjiler">{detail.foodAllergiesText?.trim() || "—"}</ReadRow>
          <ReadRow label="Son dönem diyet">{detail.recentDietOrSpecialPracticeText?.trim() || "—"}</ReadRow>
          <ReadRow label="Günlük beslenme">{detail.dailyNutritionText?.trim() || "—"}</ReadRow>
          <ReadRow label="Su tüketimi">{detail.dailyWaterConsumptionText?.trim() || "—"}</ReadRow>
          <ReadRow label="Motivasyon">{detail.motivationText?.trim() || "—"}</ReadRow>
        </ReadBlock>

        <ReadBlock title="Ölçüler (cm)">
          <ReadRow label="Boyun">{fmtNumTr(detail.neckCm, "cm")}</ReadRow>
          <ReadRow label="Omuz">{fmtNumTr(detail.shoulderCm, "cm")}</ReadRow>
          <ReadRow label="Göğüs">{fmtNumTr(detail.chestCm, "cm")}</ReadRow>
          <ReadRow label="Bel">{fmtNumTr(detail.waistCm, "cm")}</ReadRow>
          <ReadRow label="Biceps">{fmtNumTr(detail.bicepsCm, "cm")}</ReadRow>
          <ReadRow label="Kalça">{fmtNumTr(detail.hipCm, "cm")}</ReadRow>
          <ReadRow label="Üst bacak">{fmtNumTr(detail.upperLegCm, "cm")}</ReadRow>
          <ReadRow label="Baldır">{fmtNumTr(detail.calfCm, "cm")}</ReadRow>
        </ReadBlock>

        {detail.studentNote?.trim() ? (
          <ReadBlock title="Koça not">
            <ReadRow label="Not">{detail.studentNote}</ReadRow>
          </ReadBlock>
        ) : null}
      </div>

      {photos.length > 0 ? (
        <section className="mt-6 rounded-2xl border border-white/10 bg-pf-card/30 p-4 sm:p-5">
          <h2 className="font-display text-sm font-semibold text-white">Fotoğraflar</h2>
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
        </section>
      ) : null}
    </div>
  );
}
