"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { primaryDashboardPath } from "@/lib/auth/paths";
import { PageHeader } from "@/components/PageHeader";
import { routes } from "@/lib/site";
import type { StudentMonthlyAssessmentIndexJson, StudentProgramOverviewJson } from "@/lib/api/types-dashboard";
import { resolveMediaUrl } from "@/lib/media";
import { ErrorState, LoadingState } from "@/components/dashboard/DashboardUI";

const calloutMap: Record<string, string> = {
  GenericNoProgram: "Henüz bir programın görünmüyor.",
  ActivePackageNeedsAssessment: "Programın açılması için bu ayın değerlendirme formunu doldurman gerekiyor.",
  ActivePackageAwaitingCoachProgram: "Formun iletilmiş. Koçun programı yayınladığında burada göreceksin.",
  ActivePackageNeedsRevision: "Koçun revizyon istemiş. Değerlendirme formunu güncelleyip tekrar gönder.",
  HadPackageNowInactive: "Daha önce paketin vardı fakat şu an aktif değil.",
};

function statusLabel(n: number | undefined) {
  if (n == null) return "—";
  if (n === 0) return "Taslak";
  if (n === 1) return "Yayında";
  if (n === 2) return "Arşiv";
  if (n === 3) return "İptal";
  if (n === 4) return "Tamamlandı";
  return `Durum ${n}`;
}

export function StudentProgramClient() {
  const router = useRouter();
  const { token, ready, user } = useAuth();
  const [data, setData] = useState<StudentProgramOverviewJson | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [latestAssessmentInfo, setLatestAssessmentInfo] = useState<{
    id: number;
    status: number;
    submittedAtUtc?: string | null;
    coachReviewNote?: string | null;
  } | null>(null);
  const [activeDayId, setActiveDayId] = useState<number | null>(null);
  const [dayData, setDayData] = useState<any | null>(null);
  const [dayLoading, setDayLoading] = useState(false);
  const [exerciseCursor, setExerciseCursor] = useState(0);
  const [exerciseNote, setExerciseNote] = useState("");
  const [dayFeedback, setDayFeedback] = useState("");
  const [dayBusy, setDayBusy] = useState(false);
  const [flowMsg, setFlowMsg] = useState<string | null>(null);
  const [pageNotice, setPageNotice] = useState<string | null>(null);
  const [summaryMode, setSummaryMode] = useState(false);
  const FEEDBACK_PRESETS = [
    "Antrenman planlandığı gibi geçti.",
    "Son setlerde zorlandım ama tamamladım.",
    "Formu korumakta zorlandığım hareketler oldu.",
    "Enerjim iyiydi, bir sonraki antrenmanda ağırlık artırabilirim.",
    "Bugün düşük enerjiyle yaptım, tempo düşürdüm.",
    "Ağrı yok, toparlanmam iyi.",
  ];

  const loadOverview = useCallback(async () => {
    if (!token) return;
    const r = await apiFetch<StudentProgramOverviewJson>("/api/v1/student/my-program/overview", { accessToken: token });
    if (!r.ok) {
      setErr(r.message);
      setData(null);
      return;
    }
    setErr(null);
    setData(r.data);
    const idx = await apiFetch<StudentMonthlyAssessmentIndexJson>("/api/v1/student/monthly-assessments", { accessToken: token });
    if (!idx.ok) {
      setLatestAssessmentInfo(null);
      return;
    }
    const latest = (idx.data.items ?? []).find((x) => x.formStatus !== 0) ?? null;
    if (!latest) {
      setLatestAssessmentInfo(null);
      return;
    }
    const det = await apiFetch<{ formStatus: number; submittedAtUtc?: string | null; coachReviewNote?: string | null }>(
      `/api/v1/student/monthly-assessments/${latest.id}`,
      { accessToken: token },
    );
    if (!det.ok) {
      setLatestAssessmentInfo({ id: latest.id, status: latest.formStatus, submittedAtUtc: latest.submittedAtUtc, coachReviewNote: null });
      return;
    }
    setLatestAssessmentInfo({
      id: latest.id,
      status: det.data.formStatus,
      submittedAtUtc: det.data.submittedAtUtc ?? latest.submittedAtUtc,
      coachReviewNote: det.data.coachReviewNote ?? null,
    });
  }, [token]);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace(`${routes.login}?returnUrl=${encodeURIComponent(routes.studentProgram)}`);
      return;
    }
    if (!user?.roles?.includes("Student")) {
      router.replace(primaryDashboardPath(user?.roles ?? []) ?? routes.home);
      return;
    }
    let cancel = false;
    void (async () => {
      setLoading(true);
      await loadOverview();
      if (!cancel) setLoading(false);
    })();
    return () => {
      cancel = true;
    };
  }, [ready, token, user, router, loadOverview]);

  const plannedDays = useMemo(
    () => data?.program?.weeks.reduce((acc, w) => acc + (w.days?.filter((d) => !d.isRestDay).length ?? 0), 0) ?? 0,
    [data],
  );
  const weekCount = data?.program?.weeks?.length ?? 0;
  const progressPercent = Math.max(
    0,
    Math.min(100, data?.progress?.trainingDaysCompletedPercent ?? data?.progress?.completionPercent ?? 0),
  );
  const progressCompletedDays = data?.progress?.daysCompleted ?? data?.progress?.completedDays ?? 0;
  const progressTotalDays = data?.progress?.trainingDayTotal ?? data?.progress?.totalDays ?? plannedDays;
  const progressCompletedExercises = data?.progress?.exerciseLinesLoggedDone ?? data?.progress?.completedExercises ?? 0;
  const progressTotalExercises = data?.progress?.exerciseLineTotal ?? data?.progress?.totalExercises ?? 0;

  const startWorkout = async (dayId?: number | null) => {
    if (!token || !dayId) return;
    setPageNotice(null);
    setActiveDayId(dayId);
    setDayLoading(true);
    const r = await apiFetch<{ day: any; log: any }>(`/api/v1/student/my-program/days/${dayId}`, { accessToken: token });
    setDayLoading(false);
    if (!r.ok) {
      setErr(r.message);
      return;
    }
    setDayData(r.data);
    setExerciseCursor(0);
    setExerciseNote("");
    setDayFeedback(r.data.log?.studentFeedback ?? "");
    setFlowMsg(null);
    setSummaryMode(false);
  };

  const openDaySummary = async (dayId?: number | null) => {
    if (!token || !dayId) return;
    setActiveDayId(dayId);
    setDayLoading(true);
    const r = await apiFetch<{ day: any; log: any }>(`/api/v1/student/my-program/days/${dayId}`, { accessToken: token });
    setDayLoading(false);
    if (!r.ok) {
      setErr(r.message);
      return;
    }
    setDayData(r.data);
    setExerciseCursor(0);
    setExerciseNote("");
    setDayFeedback(r.data.log?.studentFeedback ?? "");
    setFlowMsg(null);
    setSummaryMode(true);
  };

  const closeWorkout = () => {
    setActiveDayId(null);
    setDayData(null);
    setExerciseCursor(0);
    setExerciseNote("");
    setDayFeedback("");
    setFlowMsg(null);
    setSummaryMode(false);
  };

  const saveExerciseStatus = async (status: number, autoNext = true) => {
    if (!token || !activeDayId || !dayData?.day?.exercises?.length) return;
    const ex = dayData.day.exercises[exerciseCursor];
    if (!ex?.id) return;
    const isLast = exerciseCursor >= (dayData?.day?.exercises?.length ?? 1) - 1;
    setDayBusy(true);
    const r = await apiFetch<{ ok: boolean }>(`/api/v1/student/my-program/days/${activeDayId}/exercises/${ex.id}/log`, {
      method: "POST",
      accessToken: token,
      body: JSON.stringify({
        completionStatus: status,
        studentNote: exerciseNote.trim() || null,
      }),
    });
    setDayBusy(false);
    if (!r.ok) {
      setErr(r.message);
      return;
    }
    if (autoNext && !isLast) {
      const nextIndex = exerciseCursor + 1;
      await startWorkout(activeDayId);
      setExerciseCursor(nextIndex);
      setFlowMsg("Kaydedildi, sonraki harekete geçildi.");
    } else if (autoNext && isLast) {
      await startWorkout(activeDayId);
      setExerciseCursor(dayData?.day?.exercises?.length ?? 0);
      setFlowMsg("Son harekete kadar kaydedildi. Gün geri bildirimini tamamlayabilirsin.");
    } else {
      await startWorkout(activeDayId);
      setFlowMsg("Kaydedildi.");
    }
    setExerciseNote("");
  };

  const saveDayLog = async (status: number) => {
    if (!token || !activeDayId) return;
    setDayBusy(true);
    const r = await apiFetch<any>(`/api/v1/student/my-program/days/${activeDayId}/workout-log`, {
      method: "POST",
      accessToken: token,
      body: JSON.stringify({
        completionStatus: status,
        studentFeedback: dayFeedback.trim() || null,
        painOrIssueNote: null,
        energyScore: null,
        difficultyScore: null,
      }),
    });
    setDayBusy(false);
    if (!r.ok) {
      setErr(r.message);
      return;
    }
    await loadOverview();
    if (status === 2) {
      closeWorkout();
      setPageNotice("Antrenman tamamlandı. Program ilerleme kartı güncellendi.");
      return;
    }
    await startWorkout(activeDayId);
    setFlowMsg("Gün durumu kaydedildi.");
  };

  const totalExercises = dayData?.day?.exercises?.length ?? 0;
  const finishedExercises =
    dayData?.day?.exercises?.filter((x: any) => {
      const s = x?.myExerciseLog?.completionStatus;
      return s === 2 || s === 3 || s === 4;
    }).length ?? 0;
  const allExercisesFinished = totalExercises > 0 && finishedExercises >= totalExercises;
  const showExerciseFlow = !allExercisesFinished && exerciseCursor < totalExercises;
  const completedExercises =
    dayData?.day?.exercises?.filter((x: any) => x?.myExerciseLog?.completionStatus === 2).length ?? 0;
  const partialExercises =
    dayData?.day?.exercises?.filter((x: any) => x?.myExerciseLog?.completionStatus === 4).length ?? 0;
  const skippedExercises =
    dayData?.day?.exercises?.filter((x: any) => x?.myExerciseLog?.completionStatus === 3).length ?? 0;
  const summaryPercent = totalExercises > 0 ? Math.round((finishedExercises / totalExercises) * 100) : 0;

  if (!ready || loading) return <LoadingState label="Program verileri yükleniyor..." />;
  if (err) {
    return <ErrorState message={err} />;
  }

  const hasProgram = !!data?.hasProgram && !!data.program;
  const latest = latestAssessmentInfo;
  const reviewStatusLabel =
    latest?.status === 4
      ? "Revizyon"
      : latest?.status === 3
        ? "Onaylandı"
        : latest?.status === 2
          ? "İncelendi"
          : latest?.status === 1
            ? "Gönderildi"
            : null;

  return (
    <div className="py-2 lg:py-4">
      <PageHeader
        eyebrow="Öğrenci paneli"
        title="Programım"
        lead="Güncel program özeti, ilerleme ve haftalık plan API üzerinden yüklenir."
      />
      {pageNotice ? (
        <div className="mb-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {pageNotice}
        </div>
      ) : null}

      {!hasProgram ? (
        <section className="rounded-2xl border border-white/10 bg-pf-card/40 p-5">
          <p className="text-sm text-zinc-300">{calloutMap[data?.empty?.callout ?? ""] ?? "Şu an program görünmüyor."}</p>
          {latest ? (
            <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200">Son form durumu</p>
              <p className="mt-1 text-sm text-zinc-100">
                {reviewStatusLabel ? `Koç değerlendirmesi: ${reviewStatusLabel}` : "Form koça iletildi."}
                {latest.submittedAtUtc ? ` · Gönderim: ${new Date(latest.submittedAtUtc).toLocaleString("tr-TR")}` : ""}
              </p>
              <p className="mt-1 text-sm text-zinc-300">
                {latest.coachReviewNote?.trim()
                  ? `Koç notu: ${latest.coachReviewNote}`
                  : "Koç notu henüz eklenmemiş olabilir. Değerlendirmeler ekranından form detayını açabilirsin."}
              </p>
              <Link href={routes.studentAssessmentView(latest.id)} className="mt-2 inline-block text-xs font-semibold text-pf-orange-bright hover:underline">
                Form detayını aç
              </Link>
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={routes.studentAssessments} className="rounded-full bg-pf-orange-bright px-3 py-1.5 text-xs font-semibold text-black">
              Değerlendirmelere git
            </Link>
            <Link href={routes.student} className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-zinc-200">
              Genel bakış
            </Link>
          </div>
        </section>
      ) : (
        <>
          <section className="rounded-2xl border border-white/10 bg-pf-card/40 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold text-white">{data.program?.title}</h2>
                <p className="mt-1 text-xs text-zinc-500">
                  {data?.program?.startDate} → {data?.program?.endDate} · v{data?.program?.versionNo} · {statusLabel(data?.program?.programStatus)}
                </p>
                <p className="mt-1 text-xs text-zinc-400">{weekCount} hafta program</p>
              </div>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                {plannedDays} planlı gün
              </span>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-pf-void">
              <div
                className="h-full rounded-full bg-gradient-to-r from-pf-orange to-pf-orange-bright"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-zinc-400">
              Gün ilerlemesi: {progressCompletedDays}/{progressTotalDays} · Egzersiz: {progressCompletedExercises}/{progressTotalExercises}
            </p>
            {data?.program?.goalSummary ? (
              <p className="mt-3 border-t border-white/10 pt-3 text-sm text-zinc-300">
                <strong className="text-zinc-100">Hedef:</strong> {data.program.goalSummary}
              </p>
            ) : null}
          </section>

          <section className="mt-4 rounded-2xl border border-white/10 bg-pf-void/30 p-5">
            <h3 className="text-sm font-bold text-white">Haftalık plan</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {data?.program?.weeks?.map((w) => (
                <article key={w.weekNumber} className="rounded-xl border border-white/10 bg-pf-card/40 p-3">
                  <p className="text-xs font-bold uppercase text-pf-mist">Hafta {w.weekNumber}</p>
                  {w.title ? <p className="text-xs text-zinc-500">{w.title}</p> : null}
                  <ul className="mt-2 space-y-1 text-sm">
                    {w.days?.map((d) => (
                      <li key={`${w.weekNumber}-${d.dayNumber}`} className="rounded-lg bg-pf-void/30 px-2 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className={d.isRestDay ? "text-zinc-500" : "text-zinc-300"}>
                            Gün {d.dayNumber}: {d.dayLabel}
                          </span>
                          <span className="text-[11px] text-zinc-500">
                            {d.isRestDay ? "Dinlenme" : `${d.exercises?.length ?? d.completedOrPartialExerciseCount ?? 0} egzersiz`}
                          </span>
                        </div>
                        {!d.isRestDay && (d.exercises?.length ?? 0) > 0 ? (
                          <p className="mt-1 text-xs text-zinc-500">
                            {(d.exercises ?? [])
                              .slice(0, 3)
                              .map((x) => x.resolvedName ?? x.customExerciseName ?? "Egzersiz")
                              .join(" · ")}
                            {(d.exercises?.length ?? 0) > 3 ? " ..." : ""}
                          </p>
                        ) : null}
                        {!d.isRestDay && d.id ? (
                          d.myLog?.completionStatus === 2 ? (
                            <button
                              className="mt-2 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-300"
                              onClick={() => void openDaySummary(d.id)}
                            >
                              Antrenman özeti
                            </button>
                          ) : (
                            <button
                              className="mt-2 rounded-full bg-pf-orange-bright px-3 py-1 text-[11px] font-semibold text-black"
                              onClick={() => void startWorkout(d.id)}
                            >
                              Antrenmana başla
                            </button>
                          )
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      {activeDayId ? (
        <div className="fixed inset-0 z-50 bg-black/75 p-0 backdrop-blur-sm sm:p-4">
          <div className="relative mx-auto flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-none border border-white/15 bg-pf-card sm:h-[92vh] sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="px-4 pt-4 text-lg font-bold text-white sm:px-6 sm:pt-5">{dayData?.day?.dayLabel ?? "Gün antrenmanı"}</h3>
              <button className="rounded border border-white/15 px-2 py-1 text-xs text-zinc-300" onClick={closeWorkout}>
                Kapat
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-24 sm:px-6">
            {dayLoading ? (
              <p className="text-sm text-zinc-500">Antrenman detayı yükleniyor…</p>
            ) : (
              <>
                {summaryMode ? (
                  <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4">
                    <p className="text-sm font-semibold text-emerald-200">Gün özeti</p>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-pf-void">
                      <div className="h-full rounded-full bg-emerald-400" style={{ width: `${summaryPercent}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-zinc-300">
                      Tamamlanan: {completedExercises} · Kısmi: {partialExercises} · Atlanan: {skippedExercises} · Toplam işaretlenen: {finishedExercises}/{totalExercises}
                    </p>
                    <ul className="mt-3 space-y-2">
                      {(dayData?.day?.exercises ?? []).map((ex: any, idx: number) => {
                        const s = ex?.myExerciseLog?.completionStatus;
                        const label = s === 2 ? "Tamamlandı" : s === 4 ? "Kısmi" : s === 3 ? "Atlandı" : s === 1 ? "Başlandı" : "İşaretlenmedi";
                        const cls =
                          s === 2
                            ? "text-emerald-300"
                            : s === 4
                              ? "text-amber-300"
                              : s === 3
                                ? "text-red-300"
                                : "text-zinc-400";
                        return (
                          <li key={`${ex?.id ?? idx}`} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs">
                            <span className="text-zinc-200">{ex?.resolvedName ?? ex?.customExerciseName ?? `Hareket ${idx + 1}`}</span>
                            <span className={cls}>{label}</span>
                          </li>
                        );
                      })}
                    </ul>
                    <div className="mt-3 flex justify-end">
                      <button className="rounded border border-white/20 px-3 py-1 text-xs text-zinc-200" onClick={closeWorkout}>
                        Kapat
                      </button>
                    </div>
                  </div>
                ) : null}
                {flowMsg ? (
                  <p className="mb-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">{flowMsg}</p>
                ) : null}
                {!summaryMode ? <p className="mb-3 text-xs text-zinc-400">
                  Egzersiz {Math.min(exerciseCursor + 1, dayData?.day?.exercises?.length ?? 0)} / {dayData?.day?.exercises?.length ?? 0}
                </p> : null}
                {!summaryMode && showExerciseFlow && dayData?.day?.exercises?.[exerciseCursor] ? (
                  <div className="rounded-xl border border-white/10 bg-pf-void/40 p-4">
                    <div className="flex items-start gap-3">
                      {resolveMediaUrl(dayData.day.exercises[exerciseCursor].libraryImagePath) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={resolveMediaUrl(dayData.day.exercises[exerciseCursor].libraryImagePath) ?? ""}
                          alt={dayData.day.exercises[exerciseCursor].resolvedName ?? "Egzersiz görseli"}
                          className="h-20 w-20 rounded-lg border border-white/15 object-cover"
                        />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[11px] text-zinc-400">
                          Görsel yok
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-white">
                          {dayData.day.exercises[exerciseCursor].resolvedName ??
                            dayData.day.exercises[exerciseCursor].customExerciseName ??
                            "Egzersiz"}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-zinc-200">
                            <strong>Set:</strong> {dayData.day.exercises[exerciseCursor].sets}
                          </span>
                          {dayData.day.exercises[exerciseCursor].reps ? (
                            <span className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-zinc-200">
                              <strong>Tekrar:</strong> {dayData.day.exercises[exerciseCursor].reps}
                            </span>
                          ) : null}
                          {dayData.day.exercises[exerciseCursor].restSeconds ? (
                            <span className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-zinc-200">
                              <strong>Dinlenme:</strong> {dayData.day.exercises[exerciseCursor].restSeconds} sn
                            </span>
                          ) : null}
                          {dayData.day.exercises[exerciseCursor].tempo ? (
                            <span className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-zinc-200">
                              <strong>Tempo:</strong> {dayData.day.exercises[exerciseCursor].tempo}
                            </span>
                          ) : null}
                          {dayData.day.exercises[exerciseCursor].rir != null ? (
                            <span className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-zinc-200">
                              <strong>Zorluk (RIR):</strong> {dayData.day.exercises[exerciseCursor].rir}
                            </span>
                          ) : null}
                          {dayData.day.exercises[exerciseCursor].durationMinutes ? (
                            <span className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-zinc-200">
                              <strong>Süre:</strong> {dayData.day.exercises[exerciseCursor].durationMinutes} dk
                            </span>
                          ) : null}
                          {dayData.day.exercises[exerciseCursor].distanceKm ? (
                            <span className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-zinc-200">
                              <strong>Mesafe:</strong> {dayData.day.exercises[exerciseCursor].distanceKm} km
                            </span>
                          ) : null}
                        </div>
                        {dayData.day.exercises[exerciseCursor].notes ? (
                          <p className="mt-1 text-xs text-zinc-500">{dayData.day.exercises[exerciseCursor].notes}</p>
                        ) : null}
                        {dayData.day.exercises[exerciseCursor].libraryDescription ? (
                          <p className="mt-2 text-xs text-zinc-400">{dayData.day.exercises[exerciseCursor].libraryDescription}</p>
                        ) : null}
                        {dayData.day.exercises[exerciseCursor].libraryDetailedDescription ? (
                          <details className="mt-2 text-xs text-zinc-400">
                            <summary className="cursor-pointer text-zinc-300">Hareket detayı</summary>
                            <p className="mt-1 leading-5 text-zinc-400">{dayData.day.exercises[exerciseCursor].libraryDetailedDescription}</p>
                          </details>
                        ) : null}
                      </div>
                    </div>

                    {dayData.day.exercises[exerciseCursor].videoEmbedUrl ? (
                      <div className="mt-3 max-w-xl overflow-hidden rounded-xl border border-white/10 bg-black/40">
                        <div className="aspect-video w-full">
                          <iframe
                            className="h-full w-full"
                            src={dayData.day.exercises[exerciseCursor].videoEmbedUrl}
                            title={`${dayData.day.exercises[exerciseCursor].resolvedName ?? "Egzersiz"} video`}
                            loading="lazy"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    ) : dayData.day.exercises[exerciseCursor].videoWatchUrl ? (
                      <a
                        href={dayData.day.exercises[exerciseCursor].videoWatchUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-block text-xs font-semibold text-pf-orange-bright hover:underline"
                      >
                        Videoyu aç
                      </a>
                    ) : null}

                    <textarea
                      className="mt-3 w-full rounded-lg border border-white/15 bg-pf-void px-3 py-2 text-sm text-white"
                      placeholder="Bu egzersiz için not (opsiyonel)"
                      value={exerciseNote}
                      onChange={(e) => setExerciseNote(e.target.value)}
                    />

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button className="rounded border border-white/15 px-3 py-1.5 text-xs text-zinc-200" onClick={() => void saveExerciseStatus(1, true)} disabled={dayBusy}>
                        Başladım
                      </button>
                      <button className="rounded bg-pf-green-bright px-3 py-1.5 text-xs font-semibold text-black" onClick={() => void saveExerciseStatus(2, true)} disabled={dayBusy}>
                        Tamamlandı
                      </button>
                      <button className="rounded border border-amber-400/40 px-3 py-1.5 text-xs text-amber-300" onClick={() => void saveExerciseStatus(4, true)} disabled={dayBusy}>
                        Kısmi tamamlandı
                      </button>
                      <button className="rounded border border-red-400/40 px-3 py-1.5 text-xs text-red-300" onClick={() => void saveExerciseStatus(3, true)} disabled={dayBusy}>
                        Atlandı
                      </button>
                    </div>

                    <div className="mt-3 hidden items-center justify-between sm:flex">
                      <button
                        className="rounded border border-white/15 px-3 py-1 text-xs text-zinc-300 disabled:opacity-40"
                        onClick={() => setExerciseCursor((x) => Math.max(0, x - 1))}
                        disabled={exerciseCursor <= 0}
                      >
                        Önceki
                      </button>
                      <button
                        className="rounded border border-pf-orange-bright/50 bg-pf-orange-bright/10 px-3 py-1 text-xs text-pf-orange-bright disabled:opacity-40"
                        onClick={() => void saveExerciseStatus(2, true)}
                        disabled={dayBusy || exerciseCursor >= (dayData?.day?.exercises?.length ?? 1)}
                      >
                        Sonraki (tamamlandı)
                      </button>
                    </div>
                  </div>
                ) : null}

                {!summaryMode ? <div className="mt-4 rounded-xl border border-white/10 bg-pf-void/30 p-4">
                  <p className="text-sm font-semibold text-white">Gün geri bildirimi</p>
                  {!allExercisesFinished ? (
                    <p className="mt-2 text-xs text-zinc-400">
                      Geri bildirim bölümü, tüm egzersizler işaretlendikten sonra açılır. ({finishedExercises}/{totalExercises})
                    </p>
                  ) : (
                    <>
                      <div className="mb-2 rounded-lg border border-pf-orange/40 bg-pf-orange/10 px-3 py-2 text-xs text-pf-orange-bright">
                        Tüm hareketler bitti. Son adım: geri bildirimini seç ve antrenmanı tamamla.
                      </div>
                      <p className="mt-2 text-xs text-emerald-300">Tüm egzersizler tamamlandı/işaretlendi. Geri bildirimi kaydedebilirsin.</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {FEEDBACK_PRESETS.map((preset) => (
                          <button
                            key={preset}
                            className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[11px] text-zinc-300 hover:border-pf-orange/40 hover:text-white"
                            onClick={() => setDayFeedback((prev) => (prev.trim() ? `${prev.trim()} ${preset}` : preset))}
                            type="button"
                          >
                            + {preset}
                          </button>
                        ))}
                      </div>
                      <textarea
                        className="mt-2 w-full rounded-lg border border-white/15 bg-pf-void px-3 py-2 text-sm text-white"
                        placeholder="Antrenman sonrası kısa geri bildirim"
                        value={dayFeedback}
                        onChange={(e) => setDayFeedback(e.target.value)}
                      />
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button className="rounded border border-white/15 px-3 py-1.5 text-xs text-zinc-200" onClick={() => void saveDayLog(1)} disabled={dayBusy}>
                          Günü başlattım
                        </button>
                        <button className="rounded bg-pf-orange-bright px-3 py-1.5 text-xs font-semibold text-black" onClick={() => void saveDayLog(2)} disabled={dayBusy}>
                          Antrenmanı bitir · Günü tamamla
                        </button>
                        <button className="rounded border border-red-400/40 px-3 py-1.5 text-xs text-red-300" onClick={() => void saveDayLog(3)} disabled={dayBusy}>
                          Günü atladım
                        </button>
                      </div>
                    </>
                  )}
                </div> : null}
              </>
            )}
            </div>
            {!summaryMode ? (
              <div className="absolute inset-x-0 bottom-0 z-10 border-t border-white/10 bg-[#111111]/95 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] pt-2 backdrop-blur sm:px-6">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    className="rounded-xl border border-white/15 px-3 py-2 text-xs text-zinc-300 disabled:opacity-40"
                    onClick={() => setExerciseCursor((x) => Math.max(0, x - 1))}
                    disabled={exerciseCursor <= 0 || dayBusy}
                  >
                    Önceki
                  </button>
                  <button
                    className="rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-200 disabled:opacity-40"
                    onClick={() => void saveExerciseStatus(2, true)}
                    disabled={!showExerciseFlow || dayBusy}
                  >
                    Tamamlandı
                  </button>
                  <button
                    className="rounded-xl border border-pf-orange-bright/50 bg-pf-orange-bright/10 px-3 py-2 text-xs font-semibold text-pf-orange-bright disabled:opacity-40"
                    onClick={() => void saveExerciseStatus(2, true)}
                    disabled={!showExerciseFlow || dayBusy}
                  >
                    Sonraki
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

