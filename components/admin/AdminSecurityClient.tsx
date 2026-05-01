"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api/client";
import { auditActionTypeLabel } from "@/lib/admin-labels";
import { routes } from "@/lib/site";
import { DashboardShell, EmptyState, ErrorState, LoadingState, PageHeader, SectionCard } from "@/components/dashboard/DashboardUI";
import { fmtDate } from "./AdminShared";

type FeedRow = {
  id: number;
  createdAtUtc: string;
  actionType: number;
  message?: string | null;
  entityName: string;
  entityId: string;
  userId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
  isHighSignal: boolean;
};

export function AdminSecurityClient() {
  const { ready, token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feed, setFeed] = useState<FeedRow[]>([]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const r = await apiFetch<FeedRow[]>("/api/v1/admin/security/feed?take=80", { accessToken: token });
    setLoading(false);
    if (!r.ok) {
      setError(r.message);
      setFeed([]);
    } else {
      setError(null);
      setFeed(r.data ?? []);
    }
  }, [token]);

  useEffect(() => {
    if (!ready || !token) return;
    void load();
  }, [ready, token, load]);

  async function lockUser(uid: string) {
    if (!token) return;
    if (!confirm("Bu kullanıcıyı kilitliyor musun? (Ban)")) return;
    const r = await apiFetch(`/api/v1/admin/security/users/${uid}/lock`, { method: "POST", accessToken: token });
    if (!r.ok) alert(r.message);
    await load();
  }

  async function unlockUser(uid: string) {
    if (!token) return;
    if (!confirm("Kilidi kaldırmayı onaylıyor musun?")) return;
    const r = await apiFetch(`/api/v1/admin/security/users/${uid}/unlock`, { method: "POST", accessToken: token });
    if (!r.ok) alert(r.message);
    await load();
  }

  if (!ready || !token || loading) return <LoadingState label="Güvenlik akışı yükleniyor..." />;
  if (error) return <ErrorState message={error} />;

  const me = user?.userId;

  return (
    <DashboardShell>
      <PageHeader
        eyebrow="Yönetim"
        title="Canlı güvenlik"
        lead="`/api/v1/admin/security/feed` + hesap kilitleme uçları. Yüksek sinyalli satırlar turuncudur."
        actions={
          <>
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/5"
            >
              Yenile
            </button>
            <Link href={routes.admin} className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/5">
              ← Özet
            </Link>
          </>
        }
      />
      <SectionCard title={`Son olaylar (${feed.length})`}>
        {feed.length === 0 ? (
          <EmptyState title="Henüz satır yok" message="Son güvenlik/audit güvenilir olayları burada görünür." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-zinc-500">
                <tr className="border-b border-white/10">
                  <th className="pb-2 pr-3">Zaman</th>
                  <th className="pb-2 pr-3">Eylem</th>
                  <th className="pb-2 pr-3">Aktör / IP</th>
                  <th className="pb-2">Detay</th>
                  <th className="pb-2 w-48">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {feed.map((r) => (
                  <tr
                    key={`${r.id}-${r.createdAtUtc}`}
                    className={r.isHighSignal ? "bg-amber-500/5 text-zinc-200" : "text-zinc-300"}
                  >
                    <td className="py-2 pr-3 align-top whitespace-nowrap text-xs">{fmtDate(r.createdAtUtc)}</td>
                    <td className="py-2 pr-3 align-top text-xs">
                      {auditActionTypeLabel(r.actionType)}{" "}
                      <span className="font-mono text-zinc-500">#{r.actionType}</span>
                    </td>
                    <td className="py-2 pr-3 align-top text-xs">
                      <span className="block">{r.actorEmail ?? "—"}</span>
                      <span className="text-zinc-500">{r.ipAddress ?? ""}</span>
                    </td>
                    <td className="py-2 align-top text-xs">
                      <span className="font-medium">{r.entityName}</span>{" "}
                      <span className="font-mono text-zinc-500">{r.entityId}</span>
                      <span className="mt-1 block text-zinc-500">{r.message ?? ""}</span>
                    </td>
                    <td className="py-2 align-top">
                      {r.userId && String(r.userId) !== String(me || "") ? (
                        <div className="flex flex-col gap-1">
                          <Link
                            href={routes.adminUser(String(r.userId))}
                            className="text-xs font-semibold text-pf-orange-bright hover:underline"
                          >
                            Kullanıcı
                          </Link>
                          <button
                            type="button"
                            className="rounded-lg border border-red-400/40 px-2 py-1 text-[11px] text-red-200 hover:bg-red-500/10"
                            onClick={() => void lockUser(String(r.userId))}
                          >
                            Kilitle
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-emerald-400/30 px-2 py-1 text-[11px] text-emerald-200 hover:bg-emerald-500/10"
                            onClick={() => void unlockUser(String(r.userId))}
                          >
                            Kilidi kaldır
                          </button>
                        </div>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </DashboardShell>
  );
}
