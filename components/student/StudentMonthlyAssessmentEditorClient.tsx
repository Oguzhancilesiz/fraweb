"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { primaryDashboardPath } from "@/lib/auth/paths";
import { getPublicApiBaseUrl } from "@/lib/api/config";
import { routes } from "@/lib/site";
import {
  ASSESSMENT_PROGRESS_PHOTO_ORDERED_TYPES,
  assessmentPhotoInstruction,
} from "@/lib/assessment-progress-photo-instructions";
import {
  bloodTypeSelectOptions,
  fieldSelectValue,
  SELECT_OTHER,
} from "@/components/profile/studentProfileFieldOptions";
import type { EditVmJson, MeasurementFieldKey } from "@/components/student/monthly-assessment/assessmentEditorTypes";
import {
  fieldClass,
  photoSlotCount,
  timeToInput,
  vmToFormData,
} from "@/components/student/monthly-assessment/assessmentEditorFormData";
import {
  allProgressPhotosReady,
  countDaysInMask,
  getSubmitBlockers,
  HEALTH_NONE_SENTINEL,
  sectionCompletion,
  slotPhotoSatisfied,
} from "@/components/student/monthly-assessment/assessmentSubmitReadiness";
import { FormProgress } from "@/components/student/monthly-assessment/FormProgress";
import { SectionCard } from "@/components/student/monthly-assessment/SectionCard";
import { SelectableChip } from "@/components/student/monthly-assessment/SelectableChip";
import { SegmentedControl } from "@/components/student/monthly-assessment/SegmentedControl";
import { NumberStepper } from "@/components/student/monthly-assessment/NumberStepper";
import { MeasurementCard } from "@/components/student/monthly-assessment/MeasurementCard";
import { PhotoUploadCard } from "@/components/student/monthly-assessment/PhotoUploadCard";
import { CompletionChecklist } from "@/components/student/monthly-assessment/CompletionChecklist";
import { SubmitSummaryModal } from "@/components/student/monthly-assessment/SubmitSummaryModal";
import { AssessmentWhatToCompleteCard } from "@/components/student/monthly-assessment/AssessmentWhatToCompleteCard";
import { ToggleSwitch } from "@/components/student/monthly-assessment/ToggleSwitch";
import {
  ALLERGY_CHIPS,
  DIET_CHIPS,
  DURATION_PRESETS,
  GOAL_CHIPS,
  HEALTH_QUICK,
  HEIGHT_QUICK_CM,
  MEAL_CHIPS,
  PHOTO_CHECKLIST_LABELS,
  SECTION_ANCHORS,
  TIME_PERIOD_PRESETS,
  TRAINING_HISTORY_QUICK,
  WATER_CHIPS,
  WEIGHT_QUICK_KG,
} from "@/components/student/monthly-assessment/assessmentEditorUiConstants";

const weekdayBits: { bit: number; label: string }[] = [
  { bit: 1, label: "Pzt" },
  { bit: 2, label: "Sal" },
  { bit: 4, label: "Çar" },
  { bit: 8, label: "Per" },
  { bit: 16, label: "Cum" },
  { bit: 32, label: "Cmt" },
  { bit: 64, label: "Paz" },
];

const MEASUREMENT_ROWS: {
  key: MeasurementFieldKey;
  label: string;
  hint: string;
  min: number;
  max: number;
}[] = [
  { key: "neckCm", label: "Boyun", hint: "Boyunun en ince çevresi, hafif eğilmeden.", min: 22, max: 65 },
  { key: "shoulderCm", label: "Omuz", hint: "İki omuz ucu arası, sırt dik.", min: 70, max: 220 },
  { key: "chestCm", label: "Göğüs", hint: "Kaburgaların üstü, normal nefes.", min: 55, max: 220 },
  { key: "waistCm", label: "Bel", hint: "Göbek hizası veya en ince bölge.", min: 45, max: 220 },
  { key: "bicepsCm", label: "Biceps", hint: "Kol gevşek, mezura orta kas hattında.", min: 18, max: 65 },
  { key: "hipCm", label: "Kalça", hint: "En geniş kalça çevresi.", min: 55, max: 200 },
  { key: "upperLegCm", label: "Üst bacak", hint: "Uyluğun en kalın bölümü.", min: 35, max: 120 },
  { key: "calfCm", label: "Baldır", hint: "Baldırın en geniş noktası.", min: 22, max: 60 },
];

function snapshotKey(
  vm: EditVmJson,
  preferredTime: string,
  pickBlood: string,
  removePhotoIds: Set<string>,
  photoFiles: (File | null)[],
): string {
  const { existingPhotos: _e, draftSaveNote: _d, photoSubmitHint: _p, profilePrefillApplied: _pr, ...rest } = vm;
  return JSON.stringify({
    rest,
    preferredTime,
    pickBlood,
    remove: [...removePhotoIds].sort(),
    files: photoFiles.map((f) => (f ? `${f.name}:${f.size}` : null)),
  });
}

type Props = { formIdParam: string };

export function StudentMonthlyAssessmentEditorClient({ formIdParam }: Props) {
  const router = useRouter();
  const { token, ready, user } = useAuth();
  const formId = Number.parseInt(formIdParam, 10);
  const [vm, setVm] = useState<EditVmJson | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [removePhotoIds, setRemovePhotoIds] = useState<Set<string>>(() => new Set());
  const [photoFiles, setPhotoFiles] = useState<(File | null)[]>(() => Array.from({ length: photoSlotCount }, () => null));
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [preferredTime, setPreferredTime] = useState("");
  const [pickBlood, setPickBlood] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const [measurementAcknowledged, setMeasurementAcknowledged] = useState(false);
  const [measureTipOpen, setMeasureTipOpen] = useState(false);
  const [extraHealthOpen, setExtraHealthOpen] = useState(false);
  const [extraNutritionOpen, setExtraNutritionOpen] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const baselineRef = useRef<string>("");
  const [dirty, setDirty] = useState(false);
  const [draftSavedBanner, setDraftSavedBanner] = useState(false);
  const draftBannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashDraftSaved = useCallback(() => {
    setDraftSavedBanner(true);
    if (draftBannerTimerRef.current) clearTimeout(draftBannerTimerRef.current);
    draftBannerTimerRef.current = setTimeout(() => {
      setDraftSavedBanner(false);
      draftBannerTimerRef.current = null;
    }, 9000);
  }, []);

  useEffect(
    () => () => {
      if (draftBannerTimerRef.current) clearTimeout(draftBannerTimerRef.current);
    },
    [],
  );

  const canStudent = user?.roles?.includes("Student");

  const load = useCallback(async () => {
    if (!token || Number.isNaN(formId)) return;
    setLoading(true);
    setErr(null);
    const r = await apiFetch<EditVmJson>(`/api/v1/student/monthly-assessments/${formId}/edit-form`, { accessToken: token });
    if (!r.ok) {
      setErr(r.message);
      setVm(null);
    } else {
      setVm(r.data);
      setPreferredTime(timeToInput(r.data.preferredTrainingTime ?? undefined));
      setPickBlood(fieldSelectValue(r.data.bloodType ?? "", bloodTypeSelectOptions));
      setRemovePhotoIds(new Set());
      setPhotoFiles(Array.from({ length: photoSlotCount }, () => null));
      setValidationErrors({});
      setMeasurementAcknowledged(false);
      setMeasureTipOpen(false);
      baselineRef.current = snapshotKey(r.data, timeToInput(r.data.preferredTrainingTime ?? undefined), fieldSelectValue(r.data.bloodType ?? "", bloodTypeSelectOptions), new Set(), Array.from({ length: photoSlotCount }, () => null));
      setDirty(false);
    }
    setLoading(false);
  }, [token, formId]);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace(`${routes.login}?returnUrl=${encodeURIComponent(routes.studentAssessmentEdit(formId))}`);
      return;
    }
    if (!canStudent) {
      router.replace(primaryDashboardPath(user?.roles ?? []) ?? routes.home);
      return;
    }
    void load();
  }, [ready, token, canStudent, user, router, load, formId]);

  const currentSnap = useMemo(() => {
    if (!vm) return "";
    return snapshotKey(vm, preferredTime, pickBlood, removePhotoIds, photoFiles);
  }, [vm, preferredTime, pickBlood, removePhotoIds, photoFiles]);

  useEffect(() => {
    if (!vm || loading) return;
    setDirty(currentSnap !== baselineRef.current);
  }, [currentSnap, vm, loading]);

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  useEffect(() => {
    if (!vm || loading) return;
    const els = SECTION_ANCHORS.map((id) => document.getElementById(id)).filter((n): n is HTMLElement => !!n);
    if (els.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting && e.target.id)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];
        const id = vis?.target.id;
        if (!id) return;
        const idx = SECTION_ANCHORS.indexOf(id as (typeof SECTION_ANCHORS)[number]);
        if (idx >= 0) setActiveStep(idx);
      },
      { root: null, threshold: [0.12, 0.22, 0.35], rootMargin: "-12% 0px -50% 0px" },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [vm, loading]);

  const periodLabel = useMemo(() => {
    if (!vm) return "";
    try {
      return new Date(vm.year, vm.month - 1, 1).toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
    } catch {
      return `${vm.month}/${vm.year}`;
    }
  }, [vm]);

  const errs = validationErrors;
  const flatErrs = Object.values(errs).flat();

  const sectionsDone = useMemo(
    () => (vm ? sectionCompletion(vm, removePhotoIds, photoFiles, measurementAcknowledged) : [false, false, false, false, false, false]),
    [vm, removePhotoIds, photoFiles, measurementAcknowledged],
  );

  const completedCount = sectionsDone.filter(Boolean).length;
  const progressPct = (completedCount / 6) * 100;

  const blockers = useMemo(
    () => (vm ? getSubmitBlockers(vm, removePhotoIds, photoFiles) : []),
    [vm, removePhotoIds, photoFiles],
  );

  const photosReady = vm ? allProgressPhotosReady(vm, removePhotoIds, photoFiles) : false;

  const dayCountMismatch =
    vm && vm.preferredTrainingDaysMask > 0 && countDaysInMask(vm.preferredTrainingDaysMask) !== vm.weeklyTrainingDays;

  const goalLabel = GOAL_CHIPS.find((g) => g.v === vm?.goalType)?.label ?? "—";

  const scrollToSection = (idx: number) => {
    setActiveStep(idx);
    const id = SECTION_ANCHORS[idx];
    if (typeof document !== "undefined") {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const toggleDay = (bit: number) => {
    if (!vm) return;
    setVm({ ...vm, preferredTrainingDaysMask: vm.preferredTrainingDaysMask ^ bit });
  };

  const applyHealthQuick = (append: string, key: string) => {
    if (!vm) return;
    if (key === "none") {
      setVm({ ...vm, healthIssues: HEALTH_NONE_SENTINEL });
      setExtraHealthOpen(false);
      return;
    }
    const cur = (vm.healthIssues ?? "").trim();
    const base = cur === HEALTH_NONE_SENTINEL ? "" : cur;
    const line = append.trim();
    if (key !== "other" && base.includes(line)) return;
    const next = base ? `${base}\n${line}` : line;
    setVm({ ...vm, healthIssues: next });
    if (key === "other") setExtraHealthOpen(true);
  };

  const appendTrainingLine = (line: string) => {
    if (!vm) return;
    const cur = (vm.trainingHistoryText ?? "").trim();
    if (cur.includes(line)) return;
    setVm({ ...vm, trainingHistoryText: cur ? `${cur}\n${line}` : line });
  };

  const saveDraft = async () => {
    if (!token || !vm) return;
    setSaving(true);
    setErr(null);
    setValidationErrors({});
    const fd = vmToFormData(vm, removePhotoIds, photoFiles, preferredTime);
    const res = await fetch(`${getPublicApiBaseUrl()}/api/v1/student/monthly-assessments/${formId}/draft`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      body: fd,
    });
    const text = await res.text();
    if (res.ok) {
      const next = text ? (JSON.parse(text) as EditVmJson) : null;
      if (next) {
        setVm(next);
        setPreferredTime(timeToInput(next.preferredTrainingTime ?? undefined));
        setPickBlood(fieldSelectValue(next.bloodType ?? "", bloodTypeSelectOptions));
        setRemovePhotoIds(new Set());
        setPhotoFiles(Array.from({ length: photoSlotCount }, () => null));
        baselineRef.current = snapshotKey(
          next,
          timeToInput(next.preferredTrainingTime ?? undefined),
          fieldSelectValue(next.bloodType ?? "", bloodTypeSelectOptions),
          new Set(),
          Array.from({ length: photoSlotCount }, () => null),
        );
        setDirty(false);
      }
      setLastSavedAt(Date.now());
      flashDraftSaved();
      setSaving(false);
      return;
    }
    try {
      const j = JSON.parse(text) as { form?: EditVmJson; validationErrors?: Record<string, string[]>; message?: string };
      if (j.form) {
        setVm(j.form);
        setPreferredTime(timeToInput(j.form.preferredTrainingTime ?? undefined));
        setPickBlood(fieldSelectValue(j.form.bloodType ?? "", bloodTypeSelectOptions));
      }
      if (j.validationErrors) setValidationErrors(j.validationErrors);
      else setErr(j.message ?? res.statusText);
    } catch {
      setErr(text || res.statusText);
    }
    setSaving(false);
  };

  const submitForm = async (): Promise<boolean> => {
    if (!token) return false;
    setSubmitting(true);
    setErr(null);
    const r = await apiFetch<{ submitted?: boolean }>(`/api/v1/student/monthly-assessments/${formId}/submit`, {
      method: "POST",
      accessToken: token,
    });
    if (!r.ok) {
      setErr(r.message);
      setSubmitting(false);
      return false;
    }
    setSubmitting(false);
    router.push(routes.studentAssessments);
    router.refresh();
    return true;
  };

  const lastSavedLabel = useMemo(() => {
    if (lastSavedAt == null) return "Henüz bu oturumda kaydedilmedi";
    const sec = Math.floor((Date.now() - lastSavedAt) / 1000);
    if (sec < 15) return "Son kaydedilme: şimdi";
    if (sec < 120) return `Son kaydedilme: ${Math.floor(sec / 60) || 1} dk önce`;
    return `Son kaydedilme: ${new Date(lastSavedAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`;
  }, [lastSavedAt]);

  const whatRows = useMemo(() => {
    if (!vm) return [];
    const [s0, s1, s2, s3, s4, s5] = sectionsDone;
    return [
      { label: "Temel bilgiler", done: s0 },
      { label: "Sağlık durumu", done: s1 },
      { label: "Antrenman uygunluğu", done: s2 },
      { label: "Beslenme notları", done: s3 },
      { label: "Ölçüler", done: s4 },
      { label: "5 ilerleme fotoğrafı", done: s5 },
    ];
  }, [vm, sectionsDone]);

  const softAge = vm && (vm.age < 10 || vm.age > 100);
  const softH = vm && (vm.heightCm <= 0 || vm.heightCm > 300);
  const softW = vm && (vm.weightKg <= 0 || vm.weightKg > 500);

  if (!ready || loading) return <div className="py-16 text-center text-sm text-zinc-500">Yükleniyor…</div>;
  if (err && !vm) {
    return (
      <div className="py-10">
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{err}</p>
        <Link href={routes.studentAssessments} className="mt-4 inline-block text-pf-orange-bright hover:underline">
          Değerlendirmelere dön
        </Link>
      </div>
    );
  }
  if (!vm) return null;

  const photoCheckItems = Array.from({ length: photoSlotCount }, (_, i) => ({
    id: `ph-${i}`,
    label: PHOTO_CHECKLIST_LABELS[i]!,
    done: slotPhotoSatisfied(vm, removePhotoIds, photoFiles, i),
  }));

  return (
    <div className="mx-auto max-w-4xl py-4 lg:py-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-pf-orange-bright">Öğrenci paneli</p>
          <h1 className="font-display mt-1 text-2xl font-bold text-white md:text-3xl">Aylık değerlendirme</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {periodLabel} — adım adım ilerle; eksikleri tamamlayınca koçuna gönderebilirsin.
          </p>
        </div>
        <Link
          href={routes.studentAssessments}
          className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-zinc-300 hover:border-white/30"
        >
          Listeye dön
        </Link>
      </div>

      {vm.profilePrefillApplied ? (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
          Profilinden uygun alanlar otomatik dolduruldu. Bu ay için hepsini gözden geçirmen yeterli.
        </div>
      ) : null}
      {vm.draftSaveNote ? <div className="mb-4 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-sm text-sky-100">{vm.draftSaveNote}</div> : null}
      {draftSavedBanner ? (
        <div
          role="status"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/45 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-50"
        >
          <p className="min-w-0 flex-1 leading-snug">
            <span className="font-semibold">Taslak kaydedildi.</span> Değişiklikler sunucuya yazıldı; istediğin zaman düzenlemeye devam edebilirsin.
          </p>
          <button
            type="button"
            className="shrink-0 rounded-lg border border-emerald-400/50 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/25"
            onClick={() => {
              setDraftSavedBanner(false);
              if (draftBannerTimerRef.current) {
                clearTimeout(draftBannerTimerRef.current);
                draftBannerTimerRef.current = null;
              }
            }}
          >
            Tamam
          </button>
        </div>
      ) : null}
      {err && vm ? <p className="mb-4 text-sm text-red-300">{err}</p> : null}
      {flatErrs.length > 0 ? (
        <ul className="mb-4 list-inside list-disc rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
          {flatErrs.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      ) : null}

      <div className="mb-4 space-y-3">
        <AssessmentWhatToCompleteCard rows={whatRows} />
        <FormProgress completedSections={completedCount} totalSections={6} percent={progressPct} />
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
          <span>{lastSavedLabel}</span>
          <span className="text-zinc-600">
            {/* Otomatik taslak: sunucu endpoint’i hazır olduğunda burada periyodik saveDraft tetiklenecek. */}
            {/* TODO(autosave): token + vm ile debounced saveDraft; başarıda setLastSavedAt. */}
          </span>
        </div>
      </div>

      <nav
        className="sticky top-0 z-20 mb-4 flex flex-wrap gap-1.5 rounded-xl border border-white/10 bg-pf-void/95 p-2 backdrop-blur-sm"
        aria-label="Bölümler"
      >
        {(
          [
            "Kimlik & hedef",
            "Sağlık",
            "Antrenman",
            "Beslenme",
            "Ölçüler",
            "Fotoğraflar",
          ] as const
        ).map((label, idx) => (
          <button
            key={label}
            type="button"
            onClick={() => scrollToSection(idx)}
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              activeStep === idx
                ? "border-pf-orange/60 bg-pf-orange/15 text-white"
                : sectionsDone[idx]
                  ? "border-emerald-500/30 text-emerald-100/90"
                  : "border-white/10 text-zinc-400 hover:border-white/25 hover:text-white"
            }`}
          >
            {idx + 1}. {label}
            {sectionsDone[idx] ? " ✓" : ""}
          </button>
        ))}
      </nav>

      <div className="grid gap-6 lg:grid-cols-1">
        <SectionCard
          id="sec-basic"
          title="Kimlik ve hedef"
          hint="Bu ayki hedefin ve temel ölçülerin."
          active={activeStep === 0}
          done={sectionsDone[0]!}
          stepIndex={0}
          onActivate={() => scrollToSection(0)}
        >
          <div className="space-y-4">
            <div>
              <span className="text-xs uppercase tracking-wide text-zinc-500">Ad soyad</span>
              <p className="font-medium text-white">{vm.fullName || "—"}</p>
              {!vm.fullName?.trim() ? (
                <p className="mt-1 text-xs text-amber-200/90">
                  Hesabında ad soyad yok.{" "}
                  <Link href={routes.profileSettings} className="text-pf-orange-bright hover:underline">
                    Ayarlardan profilini güncelle
                  </Link>
                  .
                </p>
              ) : (
                <p className="mt-1 text-xs text-zinc-500">
                  Güncellemek için{" "}
                  <Link href={routes.profileSettings} className="text-pf-orange-bright hover:underline">
                    profil ayarları
                  </Link>
                  .
                </p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-400">Bu ayki hedefin ne?</p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {GOAL_CHIPS.map((g) => (
                  <SelectableChip
                    key={g.v}
                    selected={vm.goalType === g.v}
                    onClick={() => setVm({ ...vm, goalType: g.v })}
                  >
                    {g.label}
                  </SelectableChip>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label htmlFor="age-inp" className="text-xs text-zinc-400">
                  Yaş
                </label>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <NumberStepper
                    ariaLabel="Yaş adım"
                    value={vm.age}
                    min={10}
                    max={100}
                    step={1}
                    onChange={(n) => setVm({ ...vm, age: n })}
                  />
                  <input
                    id="age-inp"
                    type="number"
                    min={10}
                    max={100}
                    className={`min-w-[4rem] flex-1 rounded-lg border bg-pf-void/80 px-3 py-2 text-white ${fieldClass(errs, "Age")}`}
                    value={vm.age || ""}
                    onChange={(e) => setVm({ ...vm, age: Number(e.target.value) })}
                  />
                </div>
                {softAge ? <p className="mt-1 text-xs text-amber-200/80">Yaş genelde 10–100 arasında olmalı.</p> : null}
              </div>
              <div>
                <span className="text-xs text-zinc-400">Boy (cm)</span>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <NumberStepper
                    ariaLabel="Boy adım"
                    value={typeof vm.heightCm === "number" ? vm.heightCm : 0}
                    min={120}
                    max={220}
                    step={1}
                    onChange={(n) => setVm({ ...vm, heightCm: n })}
                  />
                  <input
                    type="number"
                    step={0.1}
                    className={`min-w-[4rem] flex-1 rounded-lg border bg-pf-void/80 px-3 py-2 text-white ${fieldClass(errs, "HeightCm")}`}
                    value={vm.heightCm || ""}
                    onChange={(e) => setVm({ ...vm, heightCm: Number(e.target.value) })}
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {HEIGHT_QUICK_CM.map((h) => (
                    <button
                      key={h}
                      type="button"
                      className="rounded-md border border-white/10 px-2 py-0.5 text-[11px] text-zinc-400 hover:border-pf-orange/40 hover:text-white"
                      onClick={() => setVm({ ...vm, heightCm: h })}
                    >
                      {h}
                    </button>
                  ))}
                </div>
                {softH ? <p className="mt-1 text-xs text-amber-200/80">Boyunu cm olarak kontrol et (1–300 aralığı).</p> : null}
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <span className="text-xs text-zinc-400">Kilo (kg)</span>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <NumberStepper
                    ariaLabel="Kilo adım"
                    value={typeof vm.weightKg === "number" ? vm.weightKg : 0}
                    min={35}
                    max={200}
                    step={0.1}
                    decimals={1}
                    onChange={(n) => setVm({ ...vm, weightKg: n })}
                  />
                  <input
                    type="number"
                    step={0.1}
                    className={`min-w-[4rem] flex-1 rounded-lg border bg-pf-void/80 px-3 py-2 text-white ${fieldClass(errs, "WeightKg")}`}
                    value={vm.weightKg || ""}
                    onChange={(e) => setVm({ ...vm, weightKg: Number(e.target.value) })}
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {WEIGHT_QUICK_KG.map((w) => (
                    <button
                      key={w}
                      type="button"
                      className="rounded-md border border-white/10 px-2 py-0.5 text-[11px] text-zinc-400 hover:border-pf-orange/40 hover:text-white"
                      onClick={() => setVm({ ...vm, weightKg: w })}
                    >
                      {w}
                    </button>
                  ))}
                </div>
                {softW ? <p className="mt-1 text-xs text-amber-200/80">Kiloyu ondalıklı girebilirsin (ör. 72,4).</p> : null}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          id="sec-health"
          title="Sağlık durumu"
          hint="Koçunun güvenli plan yapması için dürüst ve net olman yeterli."
          active={activeStep === 1}
          done={sectionsDone[1]!}
          stepIndex={1}
          onActivate={() => scrollToSection(1)}
        >
          <div className="space-y-4">
            <div>
              <p className="text-xs text-zinc-400">Hızlı işaretle — istersen aşağıdan detay yaz</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {HEALTH_QUICK.map((h) => {
                  const selected =
                    h.key === "none"
                      ? (vm.healthIssues ?? "").trim() === HEALTH_NONE_SENTINEL
                      : h.key === "other"
                        ? (vm.healthIssues ?? "").includes("Diğer sağlık notu")
                        : (vm.healthIssues ?? "").includes(h.append.slice(0, 12));
                  return (
                    <SelectableChip
                      key={h.key}
                      selected={selected}
                      onClick={() => applyHealthQuick(h.append, h.key)}
                      className="!px-2.5 !py-1.5 !text-xs"
                    >
                      {h.label}
                    </SelectableChip>
                  );
                })}
              </div>
            </div>
            <label className="block">
              <span className="text-xs text-zinc-400">Sağlık / kronik (metin)</span>
              <textarea
                className={`mt-1 min-h-[64px] w-full rounded-lg border bg-pf-void/80 px-3 py-2 text-white ${fieldClass(errs, "HealthIssues")}`}
                value={vm.healthIssues ?? ""}
                onChange={(e) => setVm({ ...vm, healthIssues: e.target.value })}
                placeholder={
                  (vm.healthIssues ?? "").trim() === HEALTH_NONE_SENTINEL ? "" : "Kısaca yaz veya yukarıdaki chip’leri kullan."
                }
              />
            </label>
            <label className="block">
              <span className="text-xs text-zinc-400">Sakatlık / ağrı</span>
              <textarea
                className={`mt-1 min-h-[48px] w-full rounded-lg border bg-pf-void/80 px-3 py-2 text-white ${fieldClass(errs, "InjuryText")}`}
                value={vm.injuryText ?? ""}
                onChange={(e) => setVm({ ...vm, injuryText: e.target.value })}
                placeholder="Örn. sol dizde zıplamadan sonra ağrı…"
              />
            </label>
            <button
              type="button"
              onClick={() => setExtraHealthOpen((o) => !o)}
              className="text-xs font-medium text-pf-orange-bright hover:underline"
            >
              {extraHealthOpen ? "Ek sağlık notunu gizle" : "Ek sağlık notu ekle"}
            </button>
            {extraHealthOpen ? (
              <p className="rounded-lg border border-white/10 bg-pf-void/30 px-3 py-2 text-xs leading-relaxed text-zinc-400">
                İlaç isimleri, doz veya doktor önerisi gibi ek bilgileri yukarıdaki sağlık alanına paragraflar halinde ekleyebilirsin.
              </p>
            ) : null}
            <ToggleSwitch
              id="sw-steroid"
              label="Daha önce anabolik steroid kullandım"
              checked={vm.hasUsedSteroids}
              onChange={(v) => setVm({ ...vm, hasUsedSteroids: v })}
            />
            {vm.hasUsedSteroids ? (
              <label className="block">
                <span className="text-xs text-zinc-400">Steroid kullanımı (kısa)</span>
                <textarea
                  className="mt-1 min-h-[48px] w-full rounded-lg border border-white/15 bg-pf-void/80 px-3 py-2 text-white"
                  value={vm.steroidUsageText ?? ""}
                  onChange={(e) => setVm({ ...vm, steroidUsageText: e.target.value })}
                />
              </label>
            ) : null}
            <ToggleSwitch
              id="sw-supp"
              label="Koçumdan supplement önerisi istiyorum"
              checked={vm.willUseSupplements}
              onChange={(v) => setVm({ ...vm, willUseSupplements: v })}
            />
            {vm.willUseSupplements ? (
              <label className="block">
                <span className="text-xs text-zinc-400">Merak ettiğin takviyeler (isteğe bağlı)</span>
                <textarea
                  className="mt-1 min-h-[48px] w-full rounded-lg border border-white/15 bg-pf-void/80 px-3 py-2 text-white"
                  value={vm.supplementText ?? ""}
                  onChange={(e) => setVm({ ...vm, supplementText: e.target.value || null })}
                  placeholder="Örn. protein, kreatin — kısaca."
                />
              </label>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard
          id="sec-train"
          title="Antrenman"
          hint="Programını sana göre kurmak için haftalık uygunluğunu netleştir."
          active={activeStep === 2}
          done={sectionsDone[2]!}
          stepIndex={2}
          onActivate={() => scrollToSection(2)}
        >
          <div className="space-y-4">
            <div>
              <p className="text-xs text-zinc-400">Antrenman geçmişine hızlı ekle</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {TRAINING_HISTORY_QUICK.map((line) => (
                  <SelectableChip
                    key={line}
                    selected={(vm.trainingHistoryText ?? "").includes(line)}
                    onClick={() => appendTrainingLine(line)}
                    className="!py-1.5 !text-xs"
                  >
                    {line.replace(/\.$/, "")}
                  </SelectableChip>
                ))}
              </div>
            </div>
            <label className="block">
              <span className="text-xs text-zinc-400">Antrenman geçmişin</span>
              <textarea
                className={`mt-1 min-h-[88px] w-full rounded-lg border bg-pf-void/80 px-3 py-2 text-white ${fieldClass(errs, "TrainingHistoryText")}`}
                value={vm.trainingHistoryText ?? ""}
                onChange={(e) => setVm({ ...vm, trainingHistoryText: e.target.value })}
                placeholder="Salon/ev, sıklık, sevdiğin stil…"
              />
            </label>
            <div>
              <p className="text-xs text-zinc-400">Haftada kaç gün antrenman?</p>
              <SegmentedControl
                ariaLabel="Haftalık gün sayısı"
                className="mt-2"
                options={[0, 1, 2, 3, 4, 5, 6, 7].map((n) => ({ value: n, label: String(n) }))}
                value={vm.weeklyTrainingDays}
                onChange={(n) => setVm({ ...vm, weeklyTrainingDays: n })}
              />
              <p className="mt-1 text-[11px] text-zinc-500">Gönderim için en az 1 gün seçmelisin.</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">Antrenmana hangi günler uygunsun?</p>
              <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Uygun günler">
                {weekdayBits.map(({ bit, label }) => {
                  const on = (vm.preferredTrainingDaysMask & bit) !== 0;
                  return (
                    <SelectableChip key={bit} selected={on} onClick={() => toggleDay(bit)} className="!min-w-[3.25rem] !px-2 !py-2 !text-center !text-xs">
                      {label}
                    </SelectableChip>
                  );
                })}
              </div>
              {dayCountMismatch ? (
                <p className="mt-2 text-xs text-amber-200/90">Seçtiğin gün sayısı haftalık antrenman sayısıyla uyuşmuyor.</p>
              ) : null}
            </div>
            <div>
              <p className="text-xs text-zinc-400">Tercih ettiğin zaman dilimi</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {TIME_PERIOD_PRESETS.map((p) => (
                  <SelectableChip
                    key={p.label}
                    selected={preferredTime === p.time}
                    onClick={() => setPreferredTime(p.time)}
                    className="!text-xs"
                  >
                    {p.label}
                  </SelectableChip>
                ))}
              </div>
              <label className="mt-2 block">
                <span className="text-xs text-zinc-400">İstersen net saat (isteğe bağlı)</span>
                <input
                  type="time"
                  className="mt-1 w-full max-w-[200px] rounded-lg border border-white/15 bg-pf-void/80 px-3 py-2 text-white"
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                />
              </label>
            </div>
            <div>
              <p className="text-xs text-zinc-400">Oturum süresi</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {DURATION_PRESETS.map((p) => (
                  <SelectableChip
                    key={p.label}
                    selected={vm.dailyTrainingHours === p.hours}
                    onClick={() => setVm({ ...vm, dailyTrainingHours: p.hours })}
                    className="!text-xs"
                  >
                    {p.label}
                  </SelectableChip>
                ))}
              </div>
              <label className="mt-2 block max-w-[200px]">
                <span className="text-xs text-zinc-400">Saat (elle)</span>
                <input
                  type="number"
                  step={0.25}
                  min={0}
                  max={8}
                  className={`mt-1 w-full rounded-lg border bg-pf-void/80 px-3 py-2 text-white ${fieldClass(errs, "DailyTrainingHours")}`}
                  value={vm.dailyTrainingHours}
                  onChange={(e) => setVm({ ...vm, dailyTrainingHours: Number(e.target.value) })}
                />
              </label>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          id="sec-nutrition"
          title="Beslenme ve yaşam"
          hint="Su ve öğün alışkanlığını yaklaşık seçmen yeterli."
          active={activeStep === 3}
          done={sectionsDone[3]!}
          stepIndex={3}
          onActivate={() => scrollToSection(3)}
        >
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-pf-void/30 p-3">
              <label className="block">
                <span className="text-xs text-zinc-400">Kan grubu</span>
                <select
                  className={`mt-1 w-full rounded-lg border bg-pf-void/80 px-3 py-2 text-white ${fieldClass(errs, "BloodType")}`}
                  value={pickBlood}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPickBlood(v);
                    if (v === SELECT_OTHER) setVm({ ...vm, bloodType: null });
                    else setVm({ ...vm, bloodType: v || null });
                  }}
                >
                  {bloodTypeSelectOptions.map((o) => (
                    <option key={o.value || "e"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              {pickBlood === SELECT_OTHER ? (
                <input
                  className={`mt-2 w-full rounded-lg border bg-pf-void/80 px-3 py-2 text-white ${fieldClass(errs, "BloodType")}`}
                  maxLength={8}
                  value={vm.bloodType ?? ""}
                  onChange={(e) => setVm({ ...vm, bloodType: e.target.value || null })}
                  placeholder="En fazla 8 karakter"
                />
              ) : null}
            </div>
            <div>
              <p className="text-xs text-zinc-400">Su tüketimini yaklaşık seç</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {WATER_CHIPS.map((w) => (
                  <SelectableChip
                    key={w.label}
                    selected={(vm.dailyWaterConsumptionText ?? "").trim() === w.value}
                    onClick={() => setVm({ ...vm, dailyWaterConsumptionText: w.value })}
                    className="!text-xs"
                  >
                    {w.label}
                  </SelectableChip>
                ))}
              </div>
              <label className="mt-2 block">
                <span className="text-xs text-zinc-400">Su (serbest metin)</span>
                <input
                  className="mt-1 w-full rounded-lg border border-white/15 bg-pf-void/80 px-3 py-2 text-white"
                  value={vm.dailyWaterConsumptionText ?? ""}
                  onChange={(e) => setVm({ ...vm, dailyWaterConsumptionText: e.target.value })}
                  placeholder="Chip’lerden birini seçebilir veya kendin yazabilirsin."
                />
              </label>
            </div>
            <div>
              <p className="text-xs text-zinc-400">Günde kaç öğün?</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {MEAL_CHIPS.map((m) => (
                  <SelectableChip
                    key={m.label}
                    selected={(vm.dailyNutritionText ?? "").trim().startsWith(m.value)}
                    onClick={() => {
                      const cur = (vm.dailyNutritionText ?? "").trim();
                      const next = cur && !cur.startsWith(m.value) ? `${m.value}\n${cur}` : m.value;
                      setVm({ ...vm, dailyNutritionText: next });
                    }}
                    className="!text-xs"
                  >
                    {m.label}
                  </SelectableChip>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-zinc-400">Diyet tipi</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {DIET_CHIPS.map((d) => (
                  <SelectableChip
                    key={d.label}
                    selected={(vm.recentDietOrSpecialPracticeText ?? "").trim() === d.value}
                    onClick={() => setVm({ ...vm, recentDietOrSpecialPracticeText: d.value })}
                    className="!text-xs"
                  >
                    {d.label}
                  </SelectableChip>
                ))}
              </div>
              <label className="mt-2 block">
                <span className="text-xs text-zinc-400">Son dönem diyet / özel uygulama</span>
                <textarea
                  className="mt-1 min-h-[48px] w-full rounded-lg border border-white/15 bg-pf-void/80 px-3 py-2 text-white"
                  value={vm.recentDietOrSpecialPracticeText ?? ""}
                  onChange={(e) => setVm({ ...vm, recentDietOrSpecialPracticeText: e.target.value })}
                />
              </label>
            </div>
            <div>
              <p className="text-xs text-zinc-400">Gıda alerjileri — hızlı seç</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {ALLERGY_CHIPS.map((a) => (
                  <SelectableChip
                    key={a.label}
                    selected={
                      a.label === "Yok"
                        ? (vm.foodAllergiesText ?? "").trim() === a.value
                        : (vm.foodAllergiesText ?? "").includes(a.value.slice(0, Math.min(16, a.value.length)))
                    }
                    onClick={() => {
                      const cur = (vm.foodAllergiesText ?? "").trim();
                      const next = cur && !cur.includes(a.value.slice(0, 8)) ? `${cur}\n${a.value}` : a.value;
                      setVm({ ...vm, foodAllergiesText: next });
                    }}
                    className="!text-xs"
                  >
                    {a.label}
                  </SelectableChip>
                ))}
              </div>
              <label className="mt-2 block">
                <span className="text-xs text-zinc-400">Alerji notu</span>
                <textarea
                  className="mt-1 min-h-[44px] w-full rounded-lg border border-white/15 bg-pf-void/80 px-3 py-2 text-white"
                  value={vm.foodAllergiesText ?? ""}
                  onChange={(e) => setVm({ ...vm, foodAllergiesText: e.target.value })}
                />
              </label>
            </div>
            <ToggleSwitch
              id="sw-cardio"
              label="Evde kardiyo ekipmanım var"
              checked={vm.hasHomeCardioEquipment}
              onChange={(v) => setVm({ ...vm, hasHomeCardioEquipment: v })}
            />
            <label className="block">
              <span className="text-xs text-zinc-400">Evdeki kardiyo</span>
              <input
                className="mt-1 w-full rounded-lg border border-white/15 bg-pf-void/80 px-3 py-2 text-white"
                value={vm.homeCardioEquipmentText ?? ""}
                onChange={(e) => setVm({ ...vm, homeCardioEquipmentText: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="text-xs text-zinc-400">Günlük beslenme özeti</span>
              <textarea
                className={`mt-1 w-full rounded-lg border bg-pf-void/80 px-3 py-2 text-white ${fieldClass(errs, "DailyNutritionText")} ${
                  extraNutritionOpen ? "min-h-[120px]" : "min-h-[56px]"
                }`}
                value={vm.dailyNutritionText ?? ""}
                onChange={(e) => setVm({ ...vm, dailyNutritionText: e.target.value })}
                placeholder={extraNutritionOpen ? "Öğün saatleri, atıştırmalıklar, iş çıkışı rutini…" : "Chip’lerle başlayıp detayı yazabilirsin."}
              />
            </label>
            <button
              type="button"
              onClick={() => setExtraNutritionOpen((o) => !o)}
              className="text-xs font-medium text-pf-orange-bright hover:underline"
            >
              {extraNutritionOpen ? "Detaylı beslenme notunu gizle" : "Detaylı beslenme notu ekle"}
            </button>
            <label className="block">
              <span className="text-xs text-zinc-400">Motivasyon / bu ay odak</span>
              <textarea
                className={`mt-1 min-h-[80px] w-full rounded-lg border bg-pf-void/80 px-3 py-2 text-white ${fieldClass(errs, "MotivationText")}`}
                value={vm.motivationText ?? ""}
                onChange={(e) => setVm({ ...vm, motivationText: e.target.value })}
                placeholder={`Bu ay hedefim…\nZorlandığım konu…\nKoçumdan özellikle istediğim…`}
              />
            </label>
            <div className="rounded-xl border border-white/10 bg-pf-void/25 p-3">
              <label className="block">
                <span className="text-xs font-medium text-zinc-300">Koça kısa not</span>
                <textarea
                  className="mt-1 min-h-[52px] w-full rounded-lg border border-white/10 bg-pf-void/60 px-3 py-2 text-sm text-white"
                  value={vm.studentNote ?? ""}
                  onChange={(e) => setVm({ ...vm, studentNote: e.target.value })}
                  placeholder="Tek mesajda iletmek istediğin ekstra bir şey varsa…"
                />
              </label>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          id="sec-measure"
          title="Ölçüler"
          hint="Boş bırakabilirsin; doldurursan tutarlı ölçüm için ipuçlarını oku."
          active={activeStep === 4}
          done={sectionsDone[4]!}
          stepIndex={4}
          onActivate={() => scrollToSection(4)}
        >
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => {
                setMeasureTipOpen((o) => !o);
                setMeasurementAcknowledged(true);
              }}
              className="text-left text-xs font-medium text-pf-orange-bright hover:underline"
            >
              Ölçü almayı bilmiyorum — kısa rehber
            </button>
            {measureTipOpen ? (
              <p className="rounded-lg border border-white/10 bg-pf-void/40 px-3 py-2 text-xs leading-relaxed text-zinc-300">
                Mezurayı çok sıkmadan, aynı saatlerde ve benzer koşullarda ölçüm al. Aynaya karşı durup nefesini normal tutman yeterli.
              </p>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {MEASUREMENT_ROWS.map((row) => {
                const val = vm[row.key] as number | null | undefined;
                const prev = vm.previousMonthMeasurementsCm?.[row.key] ?? null;
                const bad = val != null && (val < row.min || val > row.max);
                return (
                  <MeasurementCard
                    key={row.key}
                    fieldKey={row.key}
                    label={row.label}
                    hint={row.hint}
                    value={val ?? null}
                    min={row.min}
                    max={row.max}
                    previousCm={prev}
                    error={!!bad}
                    onChange={(n) => setVm({ ...vm, [row.key]: n } as EditVmJson)}
                  />
                );
              })}
            </div>
          </div>
        </SectionCard>

        <SectionCard
          id="sec-photo"
          title="İlerleme fotoğrafları"
          hint="Aynı ışıkta ve benzer açıyla yükle; gövde kadrajda tam görünsün."
          active={activeStep === 5}
          done={sectionsDone[5]!}
          stepIndex={5}
          onActivate={() => scrollToSection(5)}
        >
          {vm.photoSubmitHint ? <p className="mb-3 text-sm text-amber-200">{vm.photoSubmitHint}</p> : null}
          <CompletionChecklist items={photoCheckItems} />
          <div className="mt-4 space-y-4">
            {Array.from({ length: photoSlotCount }, (_, i) => {
              const wantType = ASSESSMENT_PROGRESS_PHOTO_ORDERED_TYPES[i]!;
              const inst = assessmentPhotoInstruction(wantType);
              const existing = vm.existingPhotos?.find((p) => p.photoType === wantType);
              const sat = slotPhotoSatisfied(vm, removePhotoIds, photoFiles, i);
              return (
                <PhotoUploadCard
                  key={i}
                  slotIndex={i}
                  title={inst.title}
                  body={inst.body}
                  checklistLabel={PHOTO_CHECKLIST_LABELS[i]!}
                  existingFileName={existing?.fileName ?? null}
                  existingPublicId={existing?.publicId ?? null}
                  accessToken={token ?? null}
                  markedForRemove={existing ? removePhotoIds.has(existing.publicId) : false}
                  onToggleRemove={(remove) => {
                    if (!existing) return;
                    setRemovePhotoIds((prev) => {
                      const n = new Set(prev);
                      if (remove) n.add(existing.publicId);
                      else n.delete(existing.publicId);
                      return n;
                    });
                  }}
                  newFile={photoFiles[i] ?? null}
                  onPickFile={(f) => {
                    setPhotoFiles((prev) => {
                      const c = [...prev];
                      c[i] = f;
                      return c;
                    });
                    if (f && existing) {
                      setRemovePhotoIds((prev) => {
                        const n = new Set(prev);
                        n.delete(existing.publicId);
                        return n;
                      });
                    }
                  }}
                  satisfied={sat}
                />
              );
            })}
          </div>
        </SectionCard>
      </div>

      <div className="mt-8 space-y-3 border-t border-white/10 pt-6">
        {blockers.length > 0 ? (
          <p className="text-sm text-zinc-400">
            <span className="text-zinc-500">Eksik kalanlar:</span> {blockers.join(" · ")}
          </p>
        ) : (
          <p className="text-sm text-emerald-200/80">Gönderim için gerekli alanlar tamam görünüyor. Son kontrolü modalda yap.</p>
        )}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => void saveDraft()}
            className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/15 disabled:opacity-50"
          >
            {saving ? "Kaydediliyor…" : "Taslak kaydet"}
          </button>
          <button
            type="button"
            disabled={submitting || saving || blockers.length > 0}
            onClick={() => setShowSummary(true)}
            className="rounded-xl bg-pf-orange-bright px-5 py-2.5 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
          >
            Koçuna gönder
          </button>
        </div>
      </div>

      <SubmitSummaryModal
        open={showSummary}
        onClose={() => setShowSummary(false)}
        onConfirm={() => {
          void (async () => {
            const ok = await submitForm();
            if (!ok) return;
            setShowSummary(false);
          })();
        }}
        confirming={submitting}
        goalLabel={goalLabel}
        weightKg={vm.weightKg}
        weeklyDays={vm.weeklyTrainingDays}
        waterSummary={(vm.dailyWaterConsumptionText ?? "").slice(0, 80)}
        photosReady={photosReady}
      />
    </div>
  );
}
