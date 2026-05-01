"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api/client";
import { canAccessCoachArea, primaryDashboardPath } from "@/lib/auth/paths";
import { routes } from "@/lib/site";
import { resolveMediaUrl } from "@/lib/media";
import { Badge, DashboardShell, ErrorState, LoadingState, SectionCard } from "@/components/dashboard/DashboardUI";

type Week = {
  weekNumber: number;
  title?: string | null;
  notes?: string | null;
  days: {
    dayNumber: number;
    dayLabel: string;
    isRestDay: boolean;
    dayType?: number;
    scheduledTimeMinutes?: number | null;
    focusArea?: string | null;
    cardioType?: string | null;
    cardioDurationMinutes?: number | null;
    exercises: {
      resolvedName?: string | null;
      customExerciseName?: string | null;
      exerciseLibraryId?: number | null;
      sets: number;
      reps?: string | null;
      restSeconds?: number | null;
      tempo?: string | null;
      rir?: number | null;
      weightNote?: string | null;
      durationMinutes?: number | null;
      distanceKm?: number | null;
      notes?: string | null;
      circuitGroupKey?: string | null;
    }[];
  }[];
};

type DayDraft = {
  dayNumber: number;
  dayLabel: string;
  isRestDay: boolean;
  dayType?: number;
  scheduledTimeMinutes?: number | null;
  focusArea?: string | null;
  cardioType?: string | null;
  cardioDurationMinutes?: number | null;
  notes?: string | null;
  exercises: {
    resolvedName?: string | null;
    customExerciseName?: string | null;
    exerciseLibraryId?: number | null;
    sets: number;
    reps?: string | null;
    restSeconds?: number | null;
    tempo?: string | null;
    rir?: number | null;
    weightNote?: string | null;
    durationMinutes?: number | null;
    distanceKm?: number | null;
    notes?: string | null;
    circuitGroupKey?: string | null;
  }[];
};

type ExerciseSearchItem = {
  id: number;
  name: string;
  muscleGroup?: string | null;
  thumbnailPath?: string | null;
};

type ExercisePreset = "hypertrophy" | "strength" | "endurance" | "fatloss" | "power" | "cardio" | "mobility";

const DAY_OPTIONS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"] as const;
type DayOption = (typeof DAY_OPTIONS)[number];

function normalizeDayLabel(raw: string): string {
  const base = raw.split("·")[0]?.trim() ?? raw.trim();
  const found = DAY_OPTIONS.find((d) => d.toLocaleLowerCase("tr-TR") === base.toLocaleLowerCase("tr-TR"));
  return found ?? base;
}

function withOptionalTime(dayLabel: string, timeMinutes?: number | null): string {
  if (!timeMinutes && timeMinutes !== 0) return dayLabel;
  const h = String(Math.floor(timeMinutes / 60)).padStart(2, "0");
  const m = String(timeMinutes % 60).padStart(2, "0");
  return `${dayLabel} · ${h}:${m}`;
}

function applyPresetToExercise(
  ex: DayDraft["exercises"][number],
  preset: ExercisePreset,
): DayDraft["exercises"][number] {
  switch (preset) {
    case "power":
      return { ...ex, sets: 6, reps: "2-4", restSeconds: 150, tempo: "X-0-X", rir: 1, durationMinutes: null, distanceKm: null };
    case "strength":
      return { ...ex, sets: 5, reps: "3-5", restSeconds: 120, tempo: "2-1-X", rir: 1, durationMinutes: null, distanceKm: null };
    case "endurance":
      return { ...ex, sets: 3, reps: "15-20", restSeconds: 45, tempo: "2-0-2", rir: 3, durationMinutes: null, distanceKm: null };
    case "fatloss":
      return { ...ex, sets: 4, reps: "12-15", restSeconds: 45, tempo: "2-0-2", rir: 2, durationMinutes: null, distanceKm: null };
    case "cardio":
      return { ...ex, sets: 0, reps: null, restSeconds: null, tempo: null, rir: null, durationMinutes: ex.durationMinutes ?? 30, distanceKm: ex.distanceKm ?? 3 };
    case "mobility":
      return { ...ex, sets: 0, reps: null, restSeconds: null, tempo: null, rir: null, durationMinutes: ex.durationMinutes ?? 20, distanceKm: null };
    case "hypertrophy":
    default:
      return { ...ex, sets: 4, reps: "8-12", restSeconds: 60, tempo: "2-0-2", rir: 2, durationMinutes: null, distanceKm: null };
  }
}

function presetLabel(preset: ExercisePreset): string {
  if (preset === "power") return "Patlayıcı Güç";
  if (preset === "strength") return "Güç";
  if (preset === "endurance") return "Dayanıklılık";
  if (preset === "fatloss") return "Yağ Yakım";
  if (preset === "cardio") return "Kardiyo";
  if (preset === "mobility") return "Mobilite";
  return "Hipertrofi";
}

function inferPresetFromExerciseName(name?: string | null): ExercisePreset {
  const n = (name ?? "").toLocaleLowerCase("tr-TR");
  if (n.includes("koşu") || n.includes("bisiklet") || n.includes("yürüyüş") || n.includes("cardio")) return "cardio";
  if (n.includes("mobilite") || n.includes("esneme") || n.includes("stretch")) return "mobility";
  if (n.includes("deadlift") || n.includes("bench") || n.includes("squat")) return "strength";
  return "hypertrophy";
}

function resolveDurationTypeByDates(startDate: string, endDate: string): number {
  const s = new Date(startDate);
  const e = new Date(endDate);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 3;
  const diffDays = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 14) return 0;
  if (diffDays <= 31) return 1;
  if (diffDays <= 62) return 2;
  return 3;
}

type DetailJson = {
  id: number;
  studentUserId: string;
  title: string;
  goalSummary?: string | null;
  startDate: string;
  endDate: string;
  durationType: number;
  versionNo: number;
  isCurrent: boolean;
  programStatus: number;
  /** Aylık değerlendirme formu bağlantısı; yayındaki güncel programda doğrudan düzenleme için gerekli. */
  monthlyAssessmentFormId?: number | null;
  coachNotes?: string | null;
  weeks: Week[];
  totalScheduledDayCount: number;
  totalExerciseSlotCount: number;
};

const stLabel: Record<number, string> = {
  0: "Taslak",
  1: "Yayında",
  2: "Arşiv",
  3: "İptal",
  4: "Tamamlandı",
};

export function CoachProgramDetailClient({ programId }: { programId: string }) {
  const router = useRouter();
  const { token, ready, user } = useAuth();
  const [d, setD] = useState<DetailJson | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftGoal, setDraftGoal] = useState("");
  const [draftStartDate, setDraftStartDate] = useState("");
  const [draftEndDate, setDraftEndDate] = useState("");
  const [draftCoachNotes, setDraftCoachNotes] = useState("");
  const [dayTemplate, setDayTemplate] = useState<DayDraft[]>([]);
  const [activeSuggest, setActiveSuggest] = useState<{ dayIdx: number; exIdx: number } | null>(null);
  const [suggestQ, setSuggestQ] = useState("");
  const [suggestItems, setSuggestItems] = useState<ExerciseSearchItem[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [dragExercise, setDragExercise] = useState<{ dayIdx: number; exIdx: number } | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    const r = await apiFetch<DetailJson>(`/api/v1/coach/programs/${programId}`, { accessToken: token });
    if (!r.ok) {
      setErr(r.message);
      setD(null);
      return;
    }
    setErr(null);
    setD(r.data);
    setDraftTitle(r.data.title ?? "");
    setDraftGoal(r.data.goalSummary ?? "");
    setDraftStartDate(r.data.startDate ?? "");
    setDraftEndDate(r.data.endDate ?? "");
    setDraftCoachNotes(r.data.coachNotes ?? "");
    const firstWeek = r.data.weeks?.[0];
    setDayTemplate(
      (firstWeek?.days ?? []).map((day, idx) => ({
        dayNumber: idx + 1,
        dayLabel: normalizeDayLabel(day.dayLabel),
        isRestDay: day.isRestDay,
        dayType: day.dayType ?? (day.isRestDay ? 4 : 0),
        scheduledTimeMinutes: day.scheduledTimeMinutes ?? null,
        focusArea: day.focusArea ?? null,
        cardioType: day.cardioType ?? null,
        cardioDurationMinutes: day.cardioDurationMinutes ?? null,
        notes: null,
        exercises: (day.exercises ?? []).map((ex) => ({
          resolvedName: ex.resolvedName,
          customExerciseName: ex.customExerciseName,
          exerciseLibraryId: ex.exerciseLibraryId ?? null,
          sets: ex.sets ?? 3,
          reps: ex.reps ?? null,
          restSeconds: ex.restSeconds ?? null,
          tempo: ex.tempo ?? null,
          rir: ex.rir ?? null,
          weightNote: ex.weightNote ?? null,
          durationMinutes: ex.durationMinutes ?? null,
          distanceKm: ex.distanceKm ?? null,
          notes: ex.notes ?? null,
          circuitGroupKey: ex.circuitGroupKey ?? null,
        })),
      })),
    );
  }, [token, programId]);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace(`${routes.login}?returnUrl=${encodeURIComponent(`${routes.coachPrograms}/${programId}`)}`);
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
  }, [ready, token, user, router, load, programId]);

  const act = async (path: string, method: string) => {
    if (!token) return;
    setBusy(true);
    setMsg(null);
    const r = await apiFetch<{ message?: string }>(path, { method, accessToken: token });
    setBusy(false);
    if (!r.ok) {
      setMsg(r.message);
      return;
    }
    setMsg(r.data && typeof r.data === "object" && "message" in r.data ? (r.data.message ?? "Tamam") : "Tamam");
    await load();
  };

  const toDraftRequest = (detail: DetailJson) => ({
    title: draftTitle.trim(),
    goalSummary: draftGoal.trim() || null,
    startDate: draftStartDate,
    endDate: draftEndDate,
    durationType: resolveDurationTypeByDates(draftStartDate, draftEndDate),
    coachNotes: draftCoachNotes.trim() || null,
    coachSupplementRecommendation: null,
    weeks: [
      {
        weekNumber: 1,
        title: "Haftalık şablon",
        notes: null,
        days: dayTemplate.map((day, dayIdx) => ({
          dayNumber: dayIdx + 1,
          dayLabel: withOptionalTime(day.dayLabel, day.scheduledTimeMinutes),
          dayType: day.isRestDay ? 4 : day.dayType ?? 0,
          scheduledTimeMinutes: day.isRestDay ? null : day.scheduledTimeMinutes ?? null,
          focusArea: day.focusArea ?? null,
          cardioType: day.cardioType ?? null,
          cardioDurationMinutes: day.cardioDurationMinutes ?? null,
          notes: day.notes ?? null,
          isRestDay: day.isRestDay,
          exercises: (day.exercises ?? []).map((ex, i) => ({
            exerciseLibraryId: ex.exerciseLibraryId ?? null,
            customExerciseName: ex.customExerciseName ?? ex.resolvedName ?? null,
            sortOrder: i + 1,
            sets: ex.sets ?? 3,
            reps: ex.reps ?? null,
            restSeconds: ex.restSeconds ?? null,
            tempo: ex.tempo ?? null,
            rir: ex.rir ?? null,
            weightNote: ex.weightNote ?? null,
            durationMinutes: ex.durationMinutes ?? null,
            distanceKm: ex.distanceKm ?? null,
            notes: ex.notes ?? null,
            circuitGroupKey: ex.circuitGroupKey ?? null,
          })),
        })),
      },
    ],
  });

  const saveDraft = async (publishAfter: boolean) => {
    if (!token || !d) return;
    if (!draftTitle.trim()) {
      setErr("Program başlığı boş olamaz.");
      return;
    }
    if (!draftStartDate || !draftEndDate) {
      setErr("Başlangıç ve bitiş tarihini girin.");
      return;
    }
    if (dayTemplate.length === 0) {
      setErr("En az bir gün ekleyin.");
      return;
    }
    setBusy(true);
    setErr(null);
    setMsg(null);
    const body = toDraftRequest(d);
    const updateRes = await apiFetch<{ message?: string; publishedInPlace?: boolean }>(
      `/api/v1/coach/programs/${programId}/draft`,
      {
        method: "PUT",
        accessToken: token,
        body: JSON.stringify(body),
      },
    );
    setBusy(false);
    if (!updateRes.ok) {
      setErr(updateRes.message);
      return;
    }
    const onlyDraftShouldPublish = d.programStatus === 0 && publishAfter;
    if (!onlyDraftShouldPublish) {
      setMsg(updateRes.data?.message ?? "Kaydedildi.");
      await load();
      return;
    }
    setPublishing(true);
    const publishRes = await apiFetch<{ message?: string }>(`/api/v1/coach/programs/${programId}/publish`, {
      method: "POST",
      accessToken: token,
    });
    setPublishing(false);
    if (!publishRes.ok) {
      setErr(publishRes.message);
      await load();
      return;
    }
    setMsg(publishRes.data?.message ?? "Program kaydedilip yayınlandı.");
    await load();
  };

  const updateDay = (idx: number, patch: Partial<DayDraft>) => {
    setDayTemplate((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  };

  const addDay = () => {
    const used = new Set(dayTemplate.map((d) => normalizeDayLabel(d.dayLabel)));
    const firstAvailable = DAY_OPTIONS.find((d) => !used.has(d));
    if (!firstAvailable) return;
    addSpecificDay(firstAvailable);
  };

  const addSpecificDay = (selectedDay: DayOption) => {
    setDayTemplate((prev) => {
      const exists = prev.some((d) => normalizeDayLabel(d.dayLabel) === selectedDay);
      if (exists) return prev;
      const fallbackTime = prev.find((d) => d.scheduledTimeMinutes != null)?.scheduledTimeMinutes ?? null;
      const next = [
        ...prev,
        {
          dayNumber: prev.length + 1,
          dayLabel: selectedDay,
          isRestDay: false,
          dayType: 0,
          scheduledTimeMinutes: fallbackTime,
          focusArea: null,
          cardioType: null,
          cardioDurationMinutes: null,
          notes: null,
          exercises: [],
        } as DayDraft,
      ];
      const order = new Map<string, number>(DAY_OPTIONS.map((d, i) => [d, i]));
      next.sort((a, b) => (order.get(normalizeDayLabel(a.dayLabel)) ?? 99) - (order.get(normalizeDayLabel(b.dayLabel)) ?? 99));
      return next.map((d, i) => ({ ...d, dayNumber: i + 1 }));
    });
  };

  const removeDay = (idx: number) => {
    setDayTemplate((prev) => prev.filter((_, i) => i !== idx).map((d, i) => ({ ...d, dayNumber: i + 1 })));
  };

  const moveDay = (idx: number, dir: -1 | 1) => {
    setDayTemplate((prev) => {
      const ni = idx + dir;
      if (ni < 0 || ni >= prev.length) return prev;
      const copy = [...prev];
      const cur = copy[idx];
      copy[idx] = copy[ni];
      copy[ni] = cur;
      return copy.map((d, i) => ({ ...d, dayNumber: i + 1 }));
    });
  };

  const addExercise = (dayIdx: number) => {
    setDayTemplate((prev) =>
      prev.map((d, i) =>
        i !== dayIdx
          ? d
          : {
              ...d,
              exercises: [
                ...d.exercises,
                {
                  customExerciseName: "",
                  sets: 3,
                  reps: "10",
                },
              ],
            },
      ),
    );
  };

  const updateExercise = (dayIdx: number, exIdx: number, patch: Partial<DayDraft["exercises"][number]>) => {
    setDayTemplate((prev) =>
      prev.map((d, i) =>
        i !== dayIdx
          ? d
          : {
              ...d,
              exercises: d.exercises.map((ex, j) => (j === exIdx ? { ...ex, ...patch } : ex)),
            },
      ),
    );
  };

  const removeExercise = (dayIdx: number, exIdx: number) => {
    setDayTemplate((prev) =>
      prev.map((d, i) => (i !== dayIdx ? d : { ...d, exercises: d.exercises.filter((_, j) => j !== exIdx) })),
    );
  };

  const moveExercise = (dayIdx: number, exIdx: number, dir: -1 | 1) => {
    setDayTemplate((prev) =>
      prev.map((d, i) => {
        if (i !== dayIdx) return d;
        const ni = exIdx + dir;
        if (ni < 0 || ni >= d.exercises.length) return d;
        const exs = [...d.exercises];
        const cur = exs[exIdx];
        exs[exIdx] = exs[ni];
        exs[ni] = cur;
        return { ...d, exercises: exs };
      }),
    );
  };

  const reorderExercise = (dayIdx: number, fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return;
    setDayTemplate((prev) =>
      prev.map((d, i) => {
        if (i !== dayIdx) return d;
        if (fromIdx < 0 || toIdx < 0 || fromIdx >= d.exercises.length || toIdx >= d.exercises.length) return d;
        const exs = [...d.exercises];
        const [moved] = exs.splice(fromIdx, 1);
        exs.splice(toIdx, 0, moved);
        return { ...d, exercises: exs };
      }),
    );
  };

  useEffect(() => {
    if (!token || !suggestOpen) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      const term = suggestQ.trim();
      const path =
        term.length > 0
          ? `/api/v1/coach/exercise-library/search?q=${encodeURIComponent(term)}&take=8`
          : "/api/v1/coach/exercise-library/search?take=8";
      const res = await apiFetch<ExerciseSearchItem[]>(path, { accessToken: token });
      if (cancelled) return;
      setSuggestItems(res.ok ? (res.data ?? []) : []);
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [token, suggestQ, suggestOpen]);

  const addExerciseFromLibrary = (dayIdx: number, item: ExerciseSearchItem) => {
    const preset = inferPresetFromExerciseName(item.name);
    const seeded = applyPresetToExercise(
      {
        exerciseLibraryId: item.id,
        customExerciseName: item.name,
        sets: 3,
        reps: "10-12",
        restSeconds: 60,
        tempo: "2-0-2",
        rir: 2,
        durationMinutes: null,
        distanceKm: null,
        notes: null,
      },
      preset,
    );
    setDayTemplate((prev) =>
      prev.map((d, i) =>
        i !== dayIdx
          ? d
          : {
              ...d,
              exercises: [...d.exercises, d.isRestDay ? { ...seeded, durationMinutes: seeded.durationMinutes ?? 20 } : seeded],
            },
      ),
    );
  };
  const applyExercisePreset = (dayIdx: number, exIdx: number, preset: ExercisePreset) => {
    setDayTemplate((prev) =>
      prev.map((d, i) =>
        i !== dayIdx
          ? d
          : {
              ...d,
              exercises: d.exercises.map((ex, j) => (j === exIdx ? applyPresetToExercise(ex, preset) : ex)),
            },
      ),
    );
  };


  const addQuickRecommendedExercise = (dayIdx: number, kind: "kardiyo" | "mobilite" | "esneme") => {
    const defs: Record<typeof kind, { name: string; duration: number; note: string }> = {
      kardiyo: { name: "Hafif tempolu yürüyüş", duration: 30, note: "Nabız kontrolü ile düşük-orta tempo." },
      mobilite: { name: "Mobilite rutini", duration: 20, note: "Kalça, omuz ve thoracic mobilite." },
      esneme: { name: "Esneme / soğuma", duration: 15, note: "Tüm ana kas grupları için statik esneme." },
    };
    const sel = defs[kind];
    setDayTemplate((prev) =>
      prev.map((d, i) =>
        i !== dayIdx
          ? d
          : {
              ...d,
              exercises: [
                ...d.exercises,
                {
                  customExerciseName: sel.name,
                  sets: 0,
                  reps: null,
                  durationMinutes: sel.duration,
                  notes: sel.note,
                },
              ],
            },
      ),
    );
  };

  const missingDays: DayOption[] = DAY_OPTIONS.filter(
    (opt): opt is DayOption => !dayTemplate.some((d) => normalizeDayLabel(d.dayLabel) === opt),
  );

  if (!ready || loading) {
    return <LoadingState label="Program detayı yükleniyor..." />;
  }

  if (err || !d) {
    return (
      <div className="py-10">
        <ErrorState message={err ?? "Bulunamadı."} />
        <Link href={routes.coachPrograms} className="mt-4 inline-block text-sm text-pf-orange-bright">
          ← Programlar
        </Link>
      </div>
    );
  }

  const isDraft = d.programStatus === 0;
  const canEditPublishedInPlace =
    d.programStatus === 1 && d.isCurrent && d.monthlyAssessmentFormId != null;
  const showEditor = isDraft || canEditPublishedInPlace;

  return (
    <DashboardShell className="py-2">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link href={routes.coachPrograms} className="text-sm text-zinc-400 hover:text-white">
          ← Programlar
        </Link>
        <Link href={`${routes.coachStudents}/${d.studentUserId}`} className="text-sm text-pf-orange-bright hover:underline">
          Öğrenci profili
        </Link>
      </div>

      <header className="rounded-3xl border border-white/10 bg-pf-card/40 p-5 md:p-6">
        <p className="text-xs font-bold uppercase text-pf-orange-bright">Program #{d.id}</p>
        <h1 className="font-display mt-2 text-2xl font-bold text-white md:text-3xl">{d.title}</h1>
        <p className="mt-2 text-sm text-zinc-400">
          {stLabel[d.programStatus] ?? d.programStatus} · v{d.versionNo} · {d.startDate} → {d.endDate}
          {d.isCurrent ? (
            <Badge tone="success">Güncel</Badge>
          ) : null}
        </p>
        {d.goalSummary ? <p className="mt-3 text-sm text-zinc-300">{d.goalSummary}</p> : null}
        {d.coachNotes ? (
          <p className="mt-3 rounded-lg border border-white/10 bg-pf-void/50 p-3 text-sm text-zinc-400">
            <span className="font-bold text-zinc-300">Koç notu: </span>
            {d.coachNotes}
          </p>
        ) : null}
        <p className="mt-3 text-xs text-zinc-500">
          Planlı gün: {d.totalScheduledDayCount} · Egzersiz slotu: {d.totalExerciseSlotCount}
        </p>
      </header>

      {msg ? <p className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-pf-green-bright">{msg}</p> : null}

      <SectionCard title="Program aksiyonları" className="mt-2">
      <div className="flex flex-wrap gap-2">
        {isDraft ? (
          <>
            <button
              type="button"
              disabled={busy || publishing}
              onClick={() => void saveDraft(false)}
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Taslağı kaydet
            </button>
            <button
              type="button"
              disabled={busy || publishing}
              onClick={() => void saveDraft(true)}
              className="rounded-full bg-pf-orange-bright px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
            >
              {publishing ? "Yayınlanıyor…" : "Kaydet ve yayınla"}
            </button>
            <button
              type="button"
              disabled={busy || publishing}
              onClick={() => void act(`/api/v1/coach/programs/${programId}/publish`, "POST")}
              className="rounded-full bg-pf-orange-bright px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
            >
              Yayınla
            </button>
            <button
              type="button"
              disabled={busy || publishing}
              onClick={() => void act(`/api/v1/coach/programs/${programId}/fork-draft`, "POST")}
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Yeni taslak çatalla
            </button>
            <button
              type="button"
              disabled={busy || publishing}
              onClick={() => void act(`/api/v1/coach/programs/${programId}/rebuild-skeleton`, "POST")}
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-zinc-300 disabled:opacity-50"
            >
              Formdan iskelet yenile
            </button>
          </>
        ) : canEditPublishedInPlace ? (
          <>
            <button
              type="button"
              disabled={busy || publishing}
              onClick={() => void saveDraft(false)}
              className="rounded-full bg-pf-orange-bright px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
            >
              Değişiklikleri kaydet
            </button>
            <button
              type="button"
              disabled={busy || publishing}
              onClick={() => void act(`/api/v1/coach/programs/${programId}/fork-draft`, "POST")}
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Yeni taslak çatalla
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => void act(`/api/v1/coach/programs/${programId}/fork-draft`, "POST")}
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Yeni taslak çatalla
          </button>
        )}
      </div>
      </SectionCard>

      {showEditor ? (
        <SectionCard
          title={isDraft ? "Hızlı düzenleyici (taslak)" : "Hızlı düzenleyici (yayındaki program)"}
          className="mt-2 border-emerald-500/25 bg-emerald-500/5"
        >
          <p className="mt-1 text-xs text-zinc-400">
            {isDraft
              ? "Başlık, tarih, hedef ve notu hızlıca güncelle; sonra taslak kaydet veya tek adımda yayınla."
              : "Bağlı aylık form üzerinden atanmış güncel programı düzenleyebilirsiniz; kaydettiğinizde öğrenci tarafı güncellenir (yeniden yayın gerekmez)."}
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="text-xs text-zinc-400">
              Program başlığı
              <input
                className="mt-1 w-full rounded-lg border border-white/15 bg-pf-void px-3 py-2 text-sm text-white"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
              />
            </label>
            <label className="text-xs text-zinc-400">
              Hedef özeti
              <input
                className="mt-1 w-full rounded-lg border border-white/15 bg-pf-void px-3 py-2 text-sm text-white"
                value={draftGoal}
                onChange={(e) => setDraftGoal(e.target.value)}
              />
            </label>
            <label className="text-xs text-zinc-400">
              Başlangıç
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-white/15 bg-pf-void px-3 py-2 text-sm text-white [color-scheme:dark]"
                value={draftStartDate}
                readOnly
              />
            </label>
            <label className="text-xs text-zinc-400">
              Bitiş
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-white/15 bg-pf-void px-3 py-2 text-sm text-white [color-scheme:dark]"
                value={draftEndDate}
                onChange={(e) => setDraftEndDate(e.target.value)}
              />
            </label>
          </div>
          <label className="mt-3 block text-xs text-zinc-400">
            Koç notu
            <textarea
              className="mt-1 min-h-[90px] w-full rounded-lg border border-white/15 bg-pf-void px-3 py-2 text-sm text-white"
              value={draftCoachNotes}
              onChange={(e) => setDraftCoachNotes(e.target.value)}
            />
          </label>
        </SectionCard>
      ) : null}

      <SectionCard
        title={showEditor ? (isDraft ? "Gün planı editörü" : "Gün planı editörü (yayında)") : "Haftalar"}
        className="mt-2"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <span />
          {showEditor ? (
            <div className="flex flex-wrap gap-2">
              {missingDays.length > 0 ? (
                missingDays.map((dayName) => (
                  <button
                    key={dayName}
                    type="button"
                    onClick={() => addSpecificDay(dayName)}
                    className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white"
                  >
                    {dayName} ekle
                  </button>
                ))
              ) : (
                <button
                  type="button"
                  onClick={addDay}
                  className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-zinc-400"
                >
                  Eklenecek gün kalmadı
                </button>
              )}
            </div>
          ) : null}
        </div>
        {showEditor ? (
          <div className="space-y-4">
            {dayTemplate.map((day, dayIdx) => (
              <div key={`${day.dayNumber}-${dayIdx}`} className="rounded-2xl border border-white/15 bg-pf-void/60 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
                <div className="mb-2 flex flex-wrap items-center gap-2 border-b border-white/10 pb-2">
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold text-zinc-200">Gün {dayIdx + 1}</span>
                  <input
                    type="time"
                    className="rounded-md border border-white/15 bg-black/30 px-2 py-1 text-sm text-white [color-scheme:dark]"
                    value={
                      day.scheduledTimeMinutes == null
                        ? ""
                        : `${String(Math.floor(day.scheduledTimeMinutes / 60)).padStart(2, "0")}:${String(day.scheduledTimeMinutes % 60).padStart(2, "0")}`
                    }
                    onChange={(e) => {
                      const v = e.target.value;
                      if (!v) {
                        updateDay(dayIdx, { scheduledTimeMinutes: null });
                        return;
                      }
                      const [hh, mm] = v.split(":");
                      const total = Number(hh) * 60 + Number(mm);
                      updateDay(dayIdx, { scheduledTimeMinutes: Number.isFinite(total) ? total : null });
                    }}
                  />
                  <select
                    className="min-w-[12rem] flex-1 rounded-md border border-white/15 bg-black/30 px-2 py-1 text-sm text-white"
                    value={day.dayLabel}
                    onChange={(e) => updateDay(dayIdx, { dayLabel: e.target.value })}
                  >
                    {DAY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <label className="inline-flex items-center gap-2 rounded-full border border-white/10 px-2 py-1 text-xs text-zinc-300">
                    <input
                      type="checkbox"
                      checked={day.isRestDay}
                      onChange={(e) => updateDay(dayIdx, { isRestDay: e.target.checked, dayType: e.target.checked ? 4 : 0 })}
                    />
                    Off day
                  </label>
                  <button type="button" className="rounded border border-white/10 px-1.5 py-0.5 text-xs text-zinc-300" onClick={() => moveDay(dayIdx, -1)}>
                    ↑
                  </button>
                  <button type="button" className="rounded border border-white/10 px-1.5 py-0.5 text-xs text-zinc-300" onClick={() => moveDay(dayIdx, 1)}>
                    ↓
                  </button>
                  <button type="button" className="rounded border border-red-500/30 px-1.5 py-0.5 text-xs text-red-300" onClick={() => removeDay(dayIdx)}>
                    Sil
                  </button>
                </div>

                {day.isRestDay ? (
                  <div className="mt-3 grid gap-2 md:grid-cols-3">
                    <input
                      placeholder="Off day kardiyo türü"
                      className="rounded-md border border-white/15 bg-black/30 px-2 py-1 text-sm text-white"
                      value={day.cardioType ?? ""}
                      onChange={(e) => updateDay(dayIdx, { cardioType: e.target.value })}
                    />
                    <input
                      type="number"
                      placeholder="Dakika"
                      className="rounded-md border border-white/15 bg-black/30 px-2 py-1 text-sm text-white"
                      value={day.cardioDurationMinutes ?? ""}
                      onChange={(e) => updateDay(dayIdx, { cardioDurationMinutes: e.target.value ? Number(e.target.value) : null })}
                    />
                    <input
                      placeholder="Off day not/görev"
                      className="rounded-md border border-white/15 bg-black/30 px-2 py-1 text-sm text-white"
                      value={day.notes ?? ""}
                      onChange={(e) => updateDay(dayIdx, { notes: e.target.value })}
                    />
                    <div className="md:col-span-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded-md border border-white/15 px-2 py-1 text-xs text-zinc-200"
                        onClick={() => addQuickRecommendedExercise(dayIdx, "kardiyo")}
                      >
                        Hızlı ekle: Kardiyo 30dk
                      </button>
                      <button
                        type="button"
                        className="rounded-md border border-white/15 px-2 py-1 text-xs text-zinc-200"
                        onClick={() => addQuickRecommendedExercise(dayIdx, "mobilite")}
                      >
                        Hızlı ekle: Mobilite
                      </button>
                      <button
                        type="button"
                        className="rounded-md border border-white/15 px-2 py-1 text-xs text-zinc-200"
                        onClick={() => addQuickRecommendedExercise(dayIdx, "esneme")}
                      >
                        Hızlı ekle: Esneme
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    {day.exercises.map((ex, exIdx) => (
                      <div
                        key={`${dayIdx}-${exIdx}`}
                        draggable
                        onDragStart={() => setDragExercise({ dayIdx, exIdx })}
                        onDragEnd={() => setDragExercise(null)}
                        onDragOver={(e) => {
                          if (dragExercise?.dayIdx === dayIdx) e.preventDefault();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (!dragExercise || dragExercise.dayIdx !== dayIdx) return;
                          reorderExercise(dayIdx, dragExercise.exIdx, exIdx);
                          setDragExercise(null);
                        }}
                        className={`space-y-2 rounded-xl border p-2 transition ${
                          dragExercise?.dayIdx === dayIdx && dragExercise.exIdx === exIdx
                            ? "border-pf-orange-bright/60 bg-pf-orange-bright/10"
                            : "border-white/10 bg-black/20"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-zinc-400">Hareket {exIdx + 1}</span>
                          <span className="cursor-grab rounded border border-white/10 px-2 py-0.5 text-[11px] text-zinc-400">Sürükle</span>
                        </div>
                        <div className="grid gap-2 md:grid-cols-12">
                        <div className="relative md:col-span-6">
                          <input
                            placeholder="Hareket adı (yazdıkça öneri çıkar)"
                            className="w-full rounded-md border border-white/15 bg-black/30 px-2 py-1 text-sm text-white"
                            value={ex.customExerciseName ?? ex.resolvedName ?? ""}
                            onFocus={() => {
                              setActiveSuggest({ dayIdx, exIdx });
                              setSuggestQ(ex.customExerciseName ?? ex.resolvedName ?? "");
                              setSuggestOpen(true);
                            }}
                            onBlur={() => {
                              setTimeout(() => setSuggestOpen(false), 150);
                            }}
                            onChange={(e) => {
                              updateExercise(dayIdx, exIdx, { customExerciseName: e.target.value });
                              setActiveSuggest({ dayIdx, exIdx });
                              setSuggestQ(e.target.value);
                              setSuggestOpen(true);
                            }}
                          />
                          {suggestOpen && activeSuggest?.dayIdx === dayIdx && activeSuggest?.exIdx === exIdx && suggestItems.length > 0 ? (
                            <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-white/15 bg-[#0d0d0d] p-1 shadow-lg">
                              {suggestItems.map((it) => {
                                const thumb = resolveMediaUrl(it.thumbnailPath);
                                return (
                                <button
                                  key={it.id}
                                  type="button"
                                  onMouseDown={(ev) => ev.preventDefault()}
                                  onClick={() => {
                                    updateExercise(dayIdx, exIdx, { exerciseLibraryId: it.id, customExerciseName: it.name });
                                    setSuggestOpen(false);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-white/5"
                                >
                                  {thumb ? (
                                    <img src={thumb} alt={it.name} className="h-8 w-8 rounded object-cover" />
                                  ) : (
                                    <div className="h-8 w-8 rounded bg-white/10" />
                                  )}
                                  <div className="min-w-0">
                                    <p className="truncate text-sm text-white">{it.name}</p>
                                    <p className="truncate text-xs text-zinc-400">{it.muscleGroup ?? "Kas grubu yok"}</p>
                                  </div>
                                </button>
                              );
                              })}
                            </div>
                          ) : null}
                        </div>
                        <input
                          type="number"
                          placeholder="Set"
                          className="md:col-span-2 rounded-md border border-white/15 bg-black/30 px-2 py-1 text-sm font-semibold text-white"
                          value={ex.sets}
                          onChange={(e) => updateExercise(dayIdx, exIdx, { sets: Number(e.target.value || 0) })}
                        />
                        <input
                          placeholder="Tekrar"
                          className="md:col-span-2 rounded-md border border-white/15 bg-black/30 px-2 py-1 text-sm font-semibold text-white"
                          value={ex.reps ?? ""}
                          onChange={(e) => updateExercise(dayIdx, exIdx, { reps: e.target.value })}
                        />
                        <input
                          placeholder="Not"
                          className="md:col-span-12 rounded-md border border-white/15 bg-black/30 px-2 py-1 text-sm text-white"
                          value={ex.notes ?? ""}
                          onChange={(e) => updateExercise(dayIdx, exIdx, { notes: e.target.value })}
                        />
                        </div>
                        <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-2">
                          <span className="text-[11px] text-zinc-400">Hızlı protokol:</span>
                          {(["hypertrophy", "strength", "power", "fatloss", "endurance", "cardio", "mobility"] as ExercisePreset[]).map((p) => (
                            <button
                              key={p}
                              type="button"
                              className="rounded-full border border-white/15 px-2 py-1 text-xs text-zinc-100"
                              onClick={() => applyExercisePreset(dayIdx, exIdx, p)}
                            >
                              {presetLabel(p)}
                            </button>
                          ))}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-300">
                          <span className="rounded border border-white/10 px-2 py-0.5">{`Set ${ex.sets || 0}`}</span>
                          <span className="rounded border border-white/10 px-2 py-0.5">{`Tekrar ${ex.reps || "-"}`}</span>
                          <span className="rounded border border-white/10 px-2 py-0.5">{`Dinlenme ${ex.restSeconds ?? "-"} sn`}</span>
                          <span className="rounded border border-white/10 px-2 py-0.5">{`Tempo ${ex.tempo ?? "-"}`}</span>
                          <span className="rounded border border-white/10 px-2 py-0.5">{`RIR ${ex.rir ?? "-"}`}</span>
                          <span className="rounded border border-white/10 px-2 py-0.5">{`Süre ${ex.durationMinutes ?? "-"} dk`}</span>
                          <span className="rounded border border-white/10 px-2 py-0.5">{`Mesafe ${ex.distanceKm ?? "-"} km`}</span>
                        </div>
                        <div className="flex items-center justify-end gap-2 border-t border-white/10 pt-2 text-xs">
                          <button type="button" className="text-zinc-300" onClick={() => moveExercise(dayIdx, exIdx, -1)}>
                            ↑
                          </button>
                          <button type="button" className="text-zinc-300" onClick={() => moveExercise(dayIdx, exIdx, 1)}>
                            ↓
                          </button>
                          <button type="button" className="text-red-300" onClick={() => removeExercise(dayIdx, exIdx)}>
                            Sil
                          </button>
                        </div>
                      </div>
                    ))}
                    <button type="button" className="rounded-md border border-pf-orange-bright/40 px-3 py-1 text-xs font-semibold text-pf-orange-bright" onClick={() => addExercise(dayIdx)}>
                      + Hareket ekle
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {(d.weeks ?? []).map((w) => (
              <details key={w.weekNumber} className="rounded-xl border border-white/10 bg-pf-void/40 px-4 py-3">
                <summary className="cursor-pointer font-semibold text-white">
                  Hafta {w.weekNumber}
                  {w.title ? <span className="ml-2 text-sm font-normal text-zinc-400">{w.title}</span> : null}
                </summary>
                <div className="mt-3 space-y-3 border-t border-white/5 pt-3">
                  {w.days.map((day) => (
                    <div key={day.dayNumber} className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm">
                      <p className="font-bold text-pf-mist">
                        Gün {day.dayNumber}: {day.dayLabel}
                        {day.isRestDay ? <span className="ml-2 text-xs text-zinc-500">dinlenme</span> : null}
                      </p>
                      {day.isRestDay ? (
                        <p className="mt-1 text-xs text-zinc-400">
                          Off day — kardiyo/mobilite/not varsa öğrenci tarafında bu gün için görev olarak görünür.
                        </p>
                      ) : day.exercises.length > 0 ? (
                        <ul className="mt-2 space-y-1">
                          {day.exercises.map((ex, i) => (
                            <li key={`${day.dayNumber}-${i}`} className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-200">
                              <span className="font-semibold text-white">{i + 1}.</span>{" "}
                              {ex.resolvedName || ex.customExerciseName || "Egzersiz"} · {ex.sets} set · tekrar {ex.reps ?? "-"}
                              {ex.notes ? <span className="text-zinc-400"> · not: {ex.notes}</span> : null}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-1 text-xs text-zinc-500">Bu gün için hareket eklenmemiş.</p>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        )}
      </SectionCard>
    </DashboardShell>
  );
}
