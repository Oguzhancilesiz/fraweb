"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api/client";
import type { CoachHomeOverviewJson } from "@/lib/api/types-dashboard";
import { routes } from "@/lib/site";
import { usePanelTheme } from "@/contexts/PanelThemeContext";
import { cn } from "@/components/dashboard/DashboardUI";

export function CoachTopBarInsights() {
  const { token, ready } = useAuth();
  const { theme, enabled } = usePanelTheme();
  const L = enabled && theme === "light";
  const [m, setM] = useState<CoachHomeOverviewJson["metrics"] | null>(null);

  useEffect(() => {
    if (!ready || !token) return;
    let c = false;
    void (async () => {
      const r = await apiFetch<CoachHomeOverviewJson>("/api/v1/coach/home/overview", {
        accessToken: token,
      });
      if (c || !r.ok || !r.data?.metrics) return;
      setM(r.data.metrics);
    })();
    return () => {
      c = true;
    };
  }, [ready, token]);

  if (!m) return null;

  const hasAny =
    m.pendingAssessmentReviewCount > 0 ||
    m.activePackageWithoutPublishedProgramCount > 0 ||
    m.submittedAssessmentWithoutLinkedProgramCount > 0 ||
    m.draftProgramsCount > 0;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-end gap-2 border-t px-4 py-2",
        L ? "border-orange-950/13" : "border-white/10",
      )}
    >
      {m.activeStudentCount > 0 ? (
        <span className={cn("hidden text-[11px] xl:inline", L ? "text-stone-600" : "text-zinc-500")} title="Size atanmış öğrenci">
          {m.activeStudentCount} öğrenci
        </span>
      ) : null}
      {m.activeProgramsCount > 0 ? (
        <span className={cn("hidden text-[11px] 2xl:inline", L ? "text-stone-600" : "text-zinc-500")} title="Yayımda güncel program">
          {m.activeProgramsCount} program
        </span>
      ) : null}

      {m.pendingAssessmentReviewCount > 0 ? (
        <Link
          href={routes.coachStudentsReviewQueue}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
            L
              ? "border-amber-800/37 bg-amber-100 text-amber-950 hover:bg-amber-200/93"
              : "border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20",
          )}
        >
          {m.pendingAssessmentReviewCount} form incele
        </Link>
      ) : null}
      {m.activePackageWithoutPublishedProgramCount > 0 ? (
        <Link
          href={routes.coachStudentsNoPublished}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
            L
              ? "border-orange-800/43 bg-orange-100 text-orange-950 hover:bg-orange-200/93"
              : "border-orange-500/35 bg-orange-500/10 text-orange-200 hover:bg-orange-500/20",
          )}
        >
          {m.activePackageWithoutPublishedProgramCount} program yok
        </Link>
      ) : null}
      {m.submittedAssessmentWithoutLinkedProgramCount > 0 ? (
        <Link
          href={routes.coachStudentsNoProgramLink}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
            L
              ? "border-sky-800/38 bg-sky-100 text-sky-950 hover:bg-sky-200/93"
              : "border-sky-500/35 bg-sky-500/10 text-sky-200 hover:bg-sky-500/20",
          )}
        >
          {m.submittedAssessmentWithoutLinkedProgramCount} forma program bağla
        </Link>
      ) : null}
      {m.draftProgramsCount > 0 ? (
        <Link
          href={routes.coachPrograms}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
            L
              ? "border-orange-950/37 bg-orange-950/[0.04] text-orange-950 hover:bg-orange-950/[0.08]"
              : "border-zinc-500/40 bg-zinc-500/10 text-zinc-200 hover:bg-zinc-500/20",
          )}
        >
          {m.draftProgramsCount} taslak
        </Link>
      ) : null}

      {!hasAny && m.activeStudentCount === 0 ? (
        <span className={cn("hidden text-[11px] italic md:inline", L ? "text-stone-600" : "text-zinc-500")}>Henüz atanmış öğrenci yok</span>
      ) : !hasAny ? (
        <span className={cn("hidden text-[11px] md:inline", L ? "text-emerald-900 font-medium" : "text-pf-green-bright")}>Bekleyen iş yok</span>
      ) : null}
    </div>
  );
}
