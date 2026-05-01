"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { primaryDashboardPath } from "@/lib/auth/paths";
import { PageHeader } from "@/components/PageHeader";
import { routes } from "@/lib/site";
import type { StudentMonthlyAssessmentIndexJson } from "@/lib/api/types-dashboard";
import { Badge, DashboardShell, EmptyState, ErrorState, LoadingState, SectionCard, StatCard } from "@/components/dashboard/DashboardUI";

function nextCalendarMonth(year: number, month: number) {
  const d = new Date(year, month - 1, 1);
  d.setMonth(d.getMonth() + 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

function statusLabel(s: number) {
  if (s === 0) return "Taslak";
  if (s === 1) return "Gönderildi";
  if (s === 2) return "İncelendi";
  if (s === 3) return "Onaylandı";
  if (s === 4) return "Revizyon";
  if (s === 5) return "Arşiv";
  return `Durum ${s}`;
}

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export function StudentAssessmentsClient() {
  const router = useRouter();
  const { token, ready, user } = useAuth();
  const [data, setData] = useState<StudentMonthlyAssessmentIndexJson | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState<string | null>(null);
  const [currentCoachNote, setCurrentCoachNote] = useState<string | null>(null);
  const [currentDetailStatus, setCurrentDetailStatus] = useState<number | null>(null);

  const loadIndex = useCallback(async () => {
    if (!token) return;
    const r = await apiFetch<StudentMonthlyAssessmentIndexJson>("/api/v1/student/monthly-assessments", { accessToken: token });
    if (!r.ok) {
      setErr(r.message);
      setData(null);
    } else {
      setErr(null);
      setData(r.data);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace(`${routes.login}?returnUrl=${encodeURIComponent(routes.studentAssessments)}`);
      return;
    }
    if (!user?.roles?.includes("Student")) {
      router.replace(primaryDashboardPath(user?.roles ?? []) ?? routes.home);
      return;
    }
    let cancel = false;
    void (async () => {
      setLoading(true);
      await loadIndex();
      if (cancel) return;
    })();
    return () => {
      cancel = true;
    };
  }, [ready, token, user, router, loadIndex]);

  async function openOrCreateDraft() {
    if (!token || !data) return;
    const cycle = data.assessmentCycle;
    const blocked = cycle?.newMonthlyDraftBlocked === true;
    const draftCur = data.currentCalendarMonthItem;
    if (draftCur?.formStatus === 0) {
      router.push(routes.studentAssessmentEdit(draftCur.id));
      return;
    }
    if (blocked) {
      setCreateErr("Şu an yeni dönem formu açılamıyor (aktif program dönemi). Bitişe yaklaşınca tekrar dene.");
      return;
    }
    const hasSubmittedThisMonth = data.hasCurrentCalendarMonthRecord && !data.currentCalendarMonthIsDraft;
    const wantRenewal = Boolean(cycle?.requiresRenewalEvaluation);
    const { year, month } =
      hasSubmittedThisMonth && wantRenewal
        ? nextCalendarMonth(data.calendarReferenceYear, data.calendarReferenceMonth)
        : { year: data.calendarReferenceYear, month: data.calendarReferenceMonth };

    setCreating(true);
    setCreateErr(null);
    const r = await apiFetch<{ id: number }>("/api/v1/student/monthly-assessments/drafts", {
      method: "POST",
      accessToken: token,
      body: JSON.stringify({ year, month }),
    });
    setCreating(false);
    if (!r.ok) {
      setCreateErr(r.message);
      return;
    }
    router.push(routes.studentAssessmentEdit(r.data.id));
    router.refresh();
  }

  useEffect(() => {
    const cur = data?.currentCalendarMonthItem;
    if (!token || !cur || cur.formStatus === 0) {
      setCurrentCoachNote(null);
      setCurrentDetailStatus(null);
      return;
    }
    let cancel = false;
    void (async () => {
      const r = await apiFetch<{ formStatus: number; coachReviewNote?: string | null }>(
        `/api/v1/student/monthly-assessments/${cur.id}`,
        { accessToken: token },
      );
      if (cancel) return;
      if (!r.ok) {
        setCurrentCoachNote(null);
        setCurrentDetailStatus(null);
        return;
      }
      setCurrentDetailStatus(r.data.formStatus);
      setCurrentCoachNote(r.data.coachReviewNote?.trim() || null);
    })();
    return () => {
      cancel = true;
    };
  }, [token, data?.currentCalendarMonthItem]);

  if (!ready || loading) return <LoadingState label="Değerlendirmeler yükleniyor..." />;
  if (err || !data) {
    return <ErrorState message={err ?? "Veri yüklenemedi."} />;
  }

  const renewal = data.assessmentCycle?.requiresRenewalEvaluation === true;
  const currentIsDraft = data.hasCurrentCalendarMonthRecord && data.currentCalendarMonthIsDraft;
  const currentSubmittedOrLocked = data.hasCurrentCalendarMonthRecord && !data.currentCalendarMonthIsDraft;
  const postDraftBanner = Boolean(data.assessmentCycle?.bannerMessageTr);
  const lockedThisMonth = data.hasCurrentCalendarMonthRecord && !data.currentCalendarMonthIsDraft && !renewal;
  const currentMonthStatus = data.currentCalendarMonthItem?.formStatus ?? null;

  const assessmentsPageLead = currentIsDraft
    ? "Taslak kaydı sunucuda tutulur; koçun görmesi için formu tamamlayıp düzenleme ekranındaki «Koçuna gönder» ile iletmen gerekir. Gönderimden sonra bu sayfadaki durum güncellenir."
    : currentSubmittedOrLocked
      ? "Bu takvim ayı için kaydın koça iletildi. Koç programı hazırlayıp bağladığında aşağıdaki tabloda program bağlantısı görünür. Gönderdiğin metin ve ölçüleri satırdaki «Görüntüle» ile salt okunur açabilirsin; yeni ay formu genelde aktif programın bitişine yakın açılır."
      : "Henüz bu ay için kayıt yoksa ve dönem açıksa yeni form oluşturabilirsin. Taslak kaydettiğinde veriler sunucuda kalır; koçun görmesi için «Koçuna gönder» gerekir.";

  const monthStatusLine = currentIsDraft
    ? "Bu ay için taslak formun var — düzenleyip tamamladığında koçuna göndermeyi unutma."
    : currentSubmittedOrLocked
      ? currentMonthStatus === 4
        ? "Bu ayki formun revizyona düşmüş. Koç notunu kontrol edip düzenleme ekranından tekrar gönder."
        : currentMonthStatus === 3
          ? "Bu ayki formun koç tarafından onaylandı. Program bağlantısı yoksa koçun kısa süre içinde programa bağlayacaktır."
          : currentMonthStatus === 2
            ? "Bu ayki formun koç tarafından incelendi. Not/geri bildirim varsa aşağıda görebilirsin."
            : postDraftBanner
        ? "Bu ay: kayıt koça iletilmiş; özet bilgi yukarıdaki kutuda. Tablodan «Görüntüle» ile gönderdiğin tam içeriği açabilirsin."
        : "Bu ay için formun koça iletilmiş veya işlenmiş; yeni taslak bu ay için açılmaz. «Görüntüle» ile gönderdiğin kaydı okuyabilirsin."
      : "Bu ay için henüz kayıt yok; dönem açıksa yeni form oluşturabilirsin.";

  return (
    <DashboardShell className="py-2">
      <PageHeader eyebrow="Öğrenci paneli" title="Değerlendirmeler" lead={assessmentsPageLead} />

      {data.assessmentCycle?.bannerMessageTr ? (
        <div
          className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
          role="status"
        >
          {data.assessmentCycle.bannerMessageTr}
        </div>
      ) : null}

      {data.hasCurrentCalendarMonthRecord && data.currentCalendarMonthIsDraft ? (
        <div
          className="mb-4 rounded-2xl border border-pf-orange/45 bg-gradient-to-br from-pf-orange/15 to-pf-void/60 px-4 py-4 sm:px-5"
          role="region"
          aria-label="Taslak form bilgisi"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-pf-orange-bright">Bu ay — taslak</p>
          <h2 className="mt-1 font-display text-lg font-semibold text-white sm:text-xl">Formun kayıtlı ama koçuna iletilmedi</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-200">
            <strong className="text-white">Taslak kaydet</strong> çalışır; verilerin sunucuda durur fakat koçun panelinde görünmez ve program üretilmez. Her şeyi tamamlayıp düzenleme ekranındaki{" "}
            <strong className="text-pf-orange-bright">Koçuna gönder</strong> ile ilettiğinde bu satır «Gönderildi» olur ve koç süreci başlatır.
          </p>
          {data.currentCalendarMonthItem ? (
            <Link
              href={routes.studentAssessmentEdit(data.currentCalendarMonthItem.id)}
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-pf-orange-bright px-5 py-2.5 text-sm font-semibold text-black hover:opacity-90"
            >
              Taslağı aç ve devam et
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        {data.currentCalendarMonthItem?.formStatus === 0 &&
        !(data.hasCurrentCalendarMonthRecord && data.currentCalendarMonthIsDraft) ? (
          <Link
            href={routes.studentAssessmentEdit(data.currentCalendarMonthItem.id)}
            className="inline-flex items-center justify-center rounded-xl bg-pf-orange-bright px-5 py-2.5 text-sm font-semibold text-black hover:opacity-90"
          >
            Taslağı düzenle
          </Link>
        ) : (() => {
            const blocked = data.assessmentCycle?.newMonthlyDraftBlocked === true;
            if (lockedThisMonth && !postDraftBanner) {
              return (
                <p className="text-sm text-zinc-400">
                  Bu takvim ayı için zaten gönderilmiş veya kilitli bir kaydın var. Yeni dönem, program yenileme penceresinde
                  açılır.
                </p>
              );
            }
            if (lockedThisMonth && postDraftBanner) {
              return null;
            }
            if (!blocked) {
              return (
                <button
                  type="button"
                  disabled={creating}
                  onClick={() => void openOrCreateDraft()}
                  className="inline-flex items-center justify-center rounded-xl bg-pf-orange-bright px-5 py-2.5 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
                >
                  {creating ? "Açılıyor…" : "Değerlendirme formu oluştur"}
                </button>
              );
            }
            return (
              <button
                type="button"
                disabled
                className="inline-flex cursor-not-allowed items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-zinc-500"
                title="Aktif program dönemi bitene kadar yeni dönem açılamaz."
              >
                Yeni form şu an kapalı
              </button>
            );
          })()}
        {createErr ? <p className="text-sm text-red-300">{createErr}</p> : null}
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatCard label="Toplam kayıt" value={data.totalCount} hint="Tüm aylar" />
        <StatCard label="Taslak" value={data.draftCount} hint='Henüz "Koçuna gönder" yapılmadı' tone="orange" />
        <StatCard label="Koça iletilmiş" value={data.beyondDraftCount} hint="Gönderildi veya sonrası" tone="success" />
      </div>

      <SectionCard className="mb-4 bg-pf-void/40">
        <p className="text-sm text-zinc-300">
          <span className="font-medium text-zinc-200">{data.currentCalendarMonthTitleTr}:</span> {monthStatusLine}
        </p>
      </SectionCard>

      {currentSubmittedOrLocked && currentDetailStatus != null ? (
        <div className="mb-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200">Koç değerlendirmesi</p>
          <p className="mt-1 text-sm text-zinc-100">Durum: {statusLabel(currentDetailStatus)}</p>
          <p className="mt-1 text-sm text-zinc-300">
            {currentCoachNote
              ? `Koç notu: ${currentCoachNote}`
              : "Koç notu henüz eklenmemiş olabilir. Form satırındaki «Görüntüle» ile detayını açabilirsin."}
          </p>
        </div>
      ) : null}

      <SectionCard>
      <div className="space-y-3 md:hidden">
        {data.items.length === 0 ? (
          <EmptyState title="Kayıt bulunamadı" message="Bu dönem için henüz değerlendirme satırı görünmüyor." />
        ) : (
          data.items.map((x) => (
            <article key={x.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-zinc-100">{x.month}/{x.year}</p>
                <Badge tone={x.formStatus === 4 ? "warning" : x.formStatus >= 2 ? "success" : "orange"}>{statusLabel(x.formStatus)}</Badge>
              </div>
              <p className="mt-2 text-xs text-zinc-400">Koça gönderim: {x.formStatus === 0 ? "Henüz gönderilmedi" : fmt(x.submittedAtUtc)}</p>
              <p className="mt-1 text-xs text-zinc-500">
                Program: {x.linkedTrainingProgramId ? `#${x.linkedTrainingProgramId}` : "Henüz bağlı değil"}
              </p>
              {x.sensitivePreview?.trim() ? <p className="mt-2 text-xs leading-relaxed text-zinc-300">{x.sensitivePreview}</p> : null}
              <div className="mt-3">
                <Link
                  href={x.formStatus === 0 ? routes.studentAssessmentEdit(x.id) : routes.studentAssessmentView(x.id)}
                  className="text-xs font-semibold text-pf-orange-bright hover:underline"
                >
                  {x.formStatus === 0 ? "Düzenle / gönder" : "Görüntüle"}
                </Link>
              </div>
            </article>
          ))
        )}
      </div>
      <div className="hidden overflow-x-auto rounded-2xl border border-white/10 md:block">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-pf-void/80 text-xs uppercase text-pf-mist">
              <th className="p-3">Dönem</th>
              <th className="p-3">Durum</th>
              <th className="p-3">Koça gönderim</th>
              <th className="p-3">Program</th>
              <th className="p-3">Özet</th>
              <th className="p-3 w-28">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {data.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-zinc-500">
                  <EmptyState title="Kayıt bulunamadı" message="Bu dönem için henüz değerlendirme satırı görünmüyor." />
                </td>
              </tr>
            ) : (
              data.items.map((x) => (
                <tr key={x.id} className="border-b border-white/5">
                  <td className="p-3 text-zinc-300">
                    {x.month}/{x.year}
                  </td>
                  <td className="p-3 align-top">
                    {x.formStatus === 0 ? (
                      <div className="space-y-1">
                        <span className="inline-flex rounded-md border border-amber-500/35 bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-100">
                          Taslak
                        </span>
                        <p className="text-[11px] leading-snug text-amber-100/75">Koç henüz görmez</p>
                      </div>
                    ) : (
                      <span className="font-medium text-white">{statusLabel(x.formStatus)}</span>
                    )}
                  </td>
                  <td className="p-3 align-top text-zinc-400">
                    {x.formStatus === 0 ? (
                      <div>
                        <p className="text-sm text-amber-100/90">Henüz gönderilmedi</p>
                        <p className="mt-0.5 text-[11px] text-zinc-500">Gönderim tarihi burada görünür</p>
                      </div>
                    ) : (
                      fmt(x.submittedAtUtc)
                    )}
                  </td>
                  <td className="p-3 align-top text-zinc-400">
                    {x.linkedTrainingProgramId ? (
                      <Link href={routes.studentProgram} className="text-pf-orange-bright hover:underline">
                        #{x.linkedTrainingProgramId}
                      </Link>
                    ) : x.formStatus === 0 ? (
                      <span className="text-[11px] text-zinc-500">Koça gönderimden sonra</span>
                    ) : (
                      <span className="text-[11px] text-zinc-500">Koç programı yayınlayınca burada bağlantı görünür</span>
                    )}
                  </td>
                  <td className="max-w-[min(100vw-2rem,22rem)] p-3 align-top text-xs leading-snug text-zinc-300 sm:max-w-xs">
                    {x.sensitivePreview?.trim() ? x.sensitivePreview : "—"}
                  </td>
                  <td className="p-3 align-top">
                    {x.formStatus === 0 ? (
                      <Link
                        href={routes.studentAssessmentEdit(x.id)}
                        className="text-sm font-medium text-pf-orange-bright hover:underline"
                      >
                        Düzenle / gönder
                      </Link>
                    ) : (
                      <Link
                        href={routes.studentAssessmentView(x.id)}
                        className="text-sm font-medium text-pf-orange-bright hover:underline"
                      >
                        Görüntüle
                      </Link>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </SectionCard>
      {currentDetailStatus != null ? (
        <div className="flex justify-end">
          <Badge tone={currentDetailStatus === 4 ? "warning" : currentDetailStatus >= 2 ? "success" : "neutral"}>
            Güncel durum: {statusLabel(currentDetailStatus)}
          </Badge>
        </div>
      ) : null}
    </DashboardShell>
  );
}

