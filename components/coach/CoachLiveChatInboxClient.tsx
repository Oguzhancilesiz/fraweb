"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api/client";
import { canAccessCoachArea, primaryDashboardPath } from "@/lib/auth/paths";
import { PageHeader } from "@/components/PageHeader";
import { routes } from "@/lib/site";
import { resolveMediaUrl } from "@/lib/media";
import { DashboardShell, EmptyState, ErrorState, LoadingState, SectionCard } from "@/components/dashboard/DashboardUI";

type InboxRow = {
  studentPackageId: number;
  studentUserId: string;
  studentDisplayName: string;
  studentProfilePhotoPath?: string | null;
  lastMessageAtUtc?: string | null;
  lastMessagePreview?: string | null;
  lastMessageFromStudent: boolean;
  unreadCount: number;
};

export function CoachLiveChatInboxClient() {
  const router = useRouter();
  const { token, ready, user } = useAuth();
  const [rows, setRows] = useState<InboxRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    const r = await apiFetch<InboxRow[]>("/api/v1/coach/live-chat/inbox", { accessToken: token });
    if (!r.ok) {
      setErr(r.message);
      setRows([]);
      return;
    }
    setErr(null);
    setRows(Array.isArray(r.data) ? r.data : []);
  }, [token]);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace(`${routes.login}?returnUrl=${encodeURIComponent(routes.coachLiveChat)}`);
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

  if (!ready || loading) {
    return <LoadingState label="Sohbet kutusu yükleniyor..." />;
  }

  return (
    <DashboardShell className="py-2">
      <PageHeader
        eyebrow="Operasyon"
        title="Canlı sohbet"
        lead="Öğrenci paketlerine göre gelen kutusu. Sohbet API: /api/v1/coach/live-chat."
      />
      {err ? <ErrorState message={err} /> : null}
      <SectionCard>
      <ul className="space-y-2">
        {rows.length === 0 && !err ? (
          <li>
            <EmptyState title="Aktif sohbet yok" message="Öğrenciler mesaj gönderdiğinde burada konuşmalar listelenir." />
          </li>
        ) : null}
        {rows.map((r) => (
          <li key={r.studentPackageId}>
            <Link
              href={`${routes.coachLiveChat}/${r.studentPackageId}`}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-pf-card/40 px-4 py-3 text-sm transition hover:border-pf-orange/40"
            >
              <div className="flex min-w-0 items-center gap-3">
                {resolveMediaUrl(r.studentProfilePhotoPath) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolveMediaUrl(r.studentProfilePhotoPath) ?? ""}
                    alt={r.studentDisplayName}
                    className="h-10 w-10 rounded-full border border-white/15 object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-xs font-bold text-zinc-300">
                    {(r.studentDisplayName || "?").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{r.studentDisplayName}</p>
                  <p className={`truncate text-xs ${r.unreadCount > 0 ? "text-pf-orange-bright" : "text-zinc-500"}`}>
                    {r.lastMessageFromStudent ? "Öğrenci: " : "Koç: "}
                    {r.lastMessagePreview?.trim() || "Mesaj yok"}
                  </p>
                </div>
              </div>
              <div className="ml-3 flex flex-col items-end gap-1">
                <span className="text-[11px] text-zinc-500">{r.lastMessageAtUtc ? new Date(r.lastMessageAtUtc).toLocaleString("tr-TR") : "—"}</span>
                {r.unreadCount > 0 ? (
                  <span className="rounded-full bg-pf-orange-bright px-2 py-0.5 text-[11px] font-bold text-black">{r.unreadCount} okunmamış</span>
                ) : (
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-zinc-500">okundu</span>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
      </SectionCard>
    </DashboardShell>
  );
}
