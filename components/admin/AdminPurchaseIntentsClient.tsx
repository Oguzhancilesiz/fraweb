"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api/client";
import { purchaseIntentStatusLabel } from "@/lib/admin-labels";
import { routes } from "@/lib/site";
import { DashboardShell, EmptyState, ErrorState, LoadingState, PageHeader, SectionCard } from "@/components/dashboard/DashboardUI";
import { fmtDate } from "./AdminShared";
import { AdminPager } from "./AdminPager";

type Row = {
  id: number;
  publicId: string;
  referenceCode: string;
  packageName: string;
  buyerEmail?: string | null;
  expectedAmount: number;
  currency: string;
  intentStatus: number;
  expiresAtUtc: string;
  createdAtUtc: string;
  selectedCoachEmail?: string | null;
};

type Result = { totalCount: number; items: Row[] };

export function AdminPurchaseIntentsClient() {
  const router = useRouter();
  const pathname = "/admin/odeme-niyetleri";
  const sp = useSearchParams();
  const { ready, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Result | null>(null);

  const page = Math.max(1, Number(sp.get("page") ?? "1") || 1);
  const pageSize = Math.min(100, Math.max(10, Number(sp.get("pageSize") ?? "25") || 25));
  const intentStatus = sp.get("intentStatus")?.trim() ?? "";
  const buyerEmailContains = sp.get("buyerEmailContains")?.trim() ?? "";

  const qs = useMemo(() => {
    const q = new URLSearchParams();
    q.set("page", String(page));
    q.set("pageSize", String(pageSize));
    if (intentStatus !== "") q.set("intentStatus", intentStatus);
    if (buyerEmailContains) q.set("buyerEmailContains", buyerEmailContains);
    return q.toString();
  }, [page, pageSize, intentStatus, buyerEmailContains]);

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
      const r = await apiFetch<Result>(`/api/v1/admin/purchase-intents?${qs}`, { accessToken: token });
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

  if (!ready || !token || loading) return <LoadingState label="Ödeme niyetleri yükleniyor..." />;
  if (error) return <ErrorState message={error} />;
  const items = data?.items ?? [];
  const total = data?.totalCount ?? 0;

  return (
    <DashboardShell>
      <PageHeader
        eyebrow="Yönetim"
        title="Ödeme niyetleri"
        lead="`/api/v1/admin/purchase-intents` — Checkout öncesi niyet kayıtları."
        actions={
          <Link href={routes.admin} className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/5">
            ← Özet
          </Link>
        }
      />
      <SectionCard title="Filtreler">
        <div className="flex flex-wrap gap-3">
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Niyet durumu
            <select
              className="rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-sm text-zinc-100"
              value={intentStatus}
              onChange={(e) => mergeQuery({ intentStatus: e.target.value || null }, true)}
            >
              <option value="">Tümü</option>
              {[0, 1, 2, 3, 4, 5, 6].map((v) => (
                <option key={v} value={String(v)}>
                  {purchaseIntentStatusLabel(v)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Alıcı e-posta içerir
            <input
              className="min-w-[200px] rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-sm text-zinc-100"
              defaultValue={buyerEmailContains}
              onBlur={(e) => mergeQuery({ buyerEmailContains: e.target.value.trim() || null }, true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") mergeQuery({ buyerEmailContains: (e.target as HTMLInputElement).value.trim() || null }, true);
              }}
            />
          </label>
        </div>
      </SectionCard>
      <SectionCard title="Liste">
        {items.length === 0 ? (
          <EmptyState title="Kayıt yok" message="Filtreyi temizlemeyi deneyin." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-zinc-500">
                <tr className="border-b border-white/10">
                  <th className="pb-2 pr-3">Referans</th>
                  <th className="pb-2 pr-3">Paket</th>
                  <th className="pb-2 pr-3">Alıcı</th>
                  <th className="pb-2 pr-3">Tutar</th>
                  <th className="pb-2 pr-3">Durum</th>
                  <th className="pb-2 pr-3">Bitiş</th>
                  <th className="pb-2">Koç seçimi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((r) => (
                  <tr key={r.id} className="text-zinc-300">
                    <td className="py-2 pr-3 align-top font-mono text-xs">{r.referenceCode}</td>
                    <td className="py-2 pr-3 align-top">{r.packageName}</td>
                    <td className="py-2 pr-3 align-top text-xs">{r.buyerEmail ?? "—"}</td>
                    <td className="py-2 pr-3 align-top">
                      {r.expectedAmount} {r.currency}
                    </td>
                    <td className="py-2 pr-3 align-top">{purchaseIntentStatusLabel(r.intentStatus)}</td>
                    <td className="py-2 pr-3 align-top text-xs">{fmtDate(r.expiresAtUtc)}</td>
                    <td className="py-2 align-top text-xs">{r.selectedCoachEmail ?? "—"}</td>
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
