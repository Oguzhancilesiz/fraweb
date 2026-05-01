"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api/client";
import { auditActionTypeLabel } from "@/lib/admin-labels";
import { routes } from "@/lib/site";
import { DashboardShell, EmptyState, ErrorState, LoadingState, PageHeader, SectionCard } from "@/components/dashboard/DashboardUI";
import { fmtDate } from "./AdminShared";
import { AdminPager } from "./AdminPager";

type Row = {
  id: number;
  createdAtUtc: string;
  actionType: number;
  entityName: string;
  entityId: string;
  userId?: string | null;
  actorEmail?: string | null;
  message?: string | null;
  ipAddress?: string | null;
};

type Result = { totalCount: number; items: Row[] };

export function AdminAuditLogsClient() {
  const router = useRouter();
  const pathname = "/admin/denetim";
  const sp = useSearchParams();
  const { ready, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Result | null>(null);

  const page = Math.max(1, Number(sp.get("page") ?? "1") || 1);
  const pageSize = Math.min(200, Math.max(10, Number(sp.get("pageSize") ?? "50") || 50));
  const actionTypeRaw = sp.get("actionType")?.trim() ?? "";
  const userId = sp.get("userId")?.trim() ?? "";
  const textContains = sp.get("textContains")?.trim() ?? "";
  const fromUtc = sp.get("fromUtc")?.trim() ?? "";
  const toUtc = sp.get("toUtc")?.trim() ?? "";

  const qs = useMemo(() => {
    const q = new URLSearchParams();
    q.set("page", String(page));
    q.set("pageSize", String(pageSize));
    if (actionTypeRaw !== "") q.set("actionType", actionTypeRaw);
    if (userId) q.set("userId", userId);
    if (textContains) q.set("textContains", textContains);
    if (fromUtc) q.set("fromUtc", fromUtc);
    if (toUtc) q.set("toUtc", toUtc);
    return q.toString();
  }, [page, pageSize, actionTypeRaw, userId, textContains, fromUtc, toUtc]);

  function mergeQuery(updates: Record<string, string | null | undefined>, resetPage?: boolean) {
    const q = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === undefined) continue;
      if (v === null || v === "") q.delete(k);
      else q.set(k, v);
    }
    if (resetPage) q.set("page", "1");
    router.replace(`${pathname}?${q}`);
  }

  useEffect(() => {
    if (!ready || !token) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const r = await apiFetch<Result>(`/api/v1/admin/audit-logs?${qs}`, { accessToken: token });
      if (cancelled) return;
      if (!r.ok) {
        setError(r.message);
        setData(null);
      } else {
        setError(null);
        setData(r.data);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, token, qs]);

  if (!ready || !token || loading) return <LoadingState label="Denetim kayıtları yükleniyor..." />;
  if (error) return <ErrorState message={error} />;
  const items = data?.items ?? [];
  const total = data?.totalCount ?? 0;

  return (
    <DashboardShell>
      <PageHeader
        eyebrow="Yönetim"
        title="Denetim (audit)"
        lead="`/api/v1/admin/audit-logs` — denetlenebilir eylemler."
        actions={
          <Link href={routes.admin} className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/5">
            ← Özet
          </Link>
        }
      />
      <SectionCard title="Filtreler">
        <div className="flex flex-wrap gap-3">
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Eylem türü
            <select
              className="max-w-[min(100vw,320px)] rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-sm text-zinc-100"
              value={actionTypeRaw}
              onChange={(e) => mergeQuery({ actionType: e.target.value || null }, true)}
            >
              <option value="">Tümü</option>
              {Array.from({ length: 30 }, (_, i) => (
                <option key={i} value={String(i)}>
                  #{i}: {auditActionTypeLabel(i)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Kullanıcı (GUID)
            <input
              className="w-72 max-w-full rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 font-mono text-sm text-zinc-100"
              defaultValue={userId}
              onBlur={(e) => mergeQuery({ userId: e.target.value.trim() || null }, true)}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Serbest metin
            <input
              className="min-w-[200px] rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-sm text-zinc-100"
              defaultValue={textContains}
              onBlur={(e) => mergeQuery({ textContains: e.target.value.trim() || null }, true)}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            UTC başlangıç (ISO, ops.)
            <input
              key={fromUtc}
              className="min-w-[200px] rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 font-mono text-sm text-zinc-100"
              placeholder="Örn: 2026-03-01T00:00:00Z"
              defaultValue={fromUtc}
              onBlur={(e) =>
                mergeQuery({ fromUtc: e.target.value.trim() ? e.target.value.trim() : null }, true)
              }
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            UTC bitiş (ISO, ops.)
            <input
              key={toUtc}
              className="min-w-[200px] rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 font-mono text-sm text-zinc-100"
              placeholder="Örn: 2026-04-01T23:59:59Z"
              defaultValue={toUtc}
              onBlur={(e) => mergeQuery({ toUtc: e.target.value.trim() ? e.target.value.trim() : null }, true)}
            />
          </label>
        </div>
      </SectionCard>
      <SectionCard title="Liste">
        {items.length === 0 ? (
          <EmptyState title="Kayıt yok" message="Kriterlere uyan audit satırı bulunamadı." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-zinc-500">
                <tr className="border-b border-white/10">
                  <th className="pb-2 pr-3">Zaman</th>
                  <th className="pb-2 pr-3">Eylem</th>
                  <th className="pb-2 pr-3">Varlık</th>
                  <th className="pb-2 pr-3">Aktör</th>
                  <th className="pb-2">Mesaj</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((r) => (
                  <tr key={r.id} className="text-zinc-300">
                    <td className="py-2 pr-3 align-top whitespace-nowrap text-xs">{fmtDate(r.createdAtUtc)}</td>
                    <td className="py-2 pr-3 align-top text-xs">
                      {auditActionTypeLabel(r.actionType)}
                      <span className="ml-1 text-zinc-500">({r.actionType})</span>
                    </td>
                    <td className="py-2 pr-3 align-top text-xs">
                      <span className="font-semibold">{r.entityName}</span>
                      <span className="ml-1 font-mono text-zinc-500">{r.entityId}</span>
                    </td>
                    <td className="py-2 pr-3 align-top text-xs">{r.actorEmail ?? r.userId ?? "—"}</td>
                    <td className="py-2 align-top text-xs text-zinc-400">{r.message ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <AdminPager page={page} pageSize={pageSize} totalCount={total} onPageChange={(p) => mergeQuery({ page: String(p) })} />
      </SectionCard>
    </DashboardShell>
  );
}
