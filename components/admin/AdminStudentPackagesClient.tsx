"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api/client";
import { studentPackageStatusLabel } from "@/lib/admin-labels";
import { routes } from "@/lib/site";
import { DashboardShell, EmptyState, ErrorState, LoadingState, PageHeader, SectionCard } from "@/components/dashboard/DashboardUI";
import { fmtDate } from "./AdminShared";
import { AdminPager } from "./AdminPager";

type Row = {
  id: number;
  publicId: string;
  studentEmail: string;
  studentFullName: string;
  packageName: string;
  packageStatus: number;
  startsAtUtc: string;
  endsAtUtc: string;
  coachEmail?: string | null;
  paymentOrderId?: number | null;
  createdAtUtc: string;
};

type Result = { totalCount: number; items: Row[] };

export function AdminStudentPackagesClient() {
  const router = useRouter();
  const pathname = "/admin/ogrenci-paketleri";
  const sp = useSearchParams();
  const { ready, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Result | null>(null);

  const page = Math.max(1, Number(sp.get("page") ?? "1") || 1);
  const pageSize = Math.min(100, Math.max(10, Number(sp.get("pageSize") ?? "25") || 25));
  const packageStatus = sp.get("packageStatus")?.trim() ?? "";
  const studentEmailContains = sp.get("studentEmailContains")?.trim() ?? "";
  const expiringWithinDays = sp.get("expiringWithinDays")?.trim() ?? "";

  const qs = useMemo(() => {
    const q = new URLSearchParams();
    q.set("page", String(page));
    q.set("pageSize", String(pageSize));
    if (packageStatus !== "") q.set("packageStatus", packageStatus);
    if (studentEmailContains) q.set("studentEmailContains", studentEmailContains);
    if (expiringWithinDays) q.set("expiringWithinDays", expiringWithinDays);
    return q.toString();
  }, [page, pageSize, packageStatus, studentEmailContains, expiringWithinDays]);

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
      const r = await apiFetch<Result>(`/api/v1/admin/student-packages?${qs}`, { accessToken: token });
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

  if (!ready || !token || loading) return <LoadingState label="Öğrenci paketleri yükleniyor..." />;
  if (error) return <ErrorState message={error} />;
  const items = data?.items ?? [];
  const total = data?.totalCount ?? 0;

  return (
    <DashboardShell>
      <PageHeader
        eyebrow="Yönetim"
        title="Öğrenci paketleri"
        lead="`/api/v1/admin/student-packages` — atanmış paket yaşam döngüsü."
        actions={
          <Link href={routes.admin} className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/5">
            ← Özet
          </Link>
        }
      />
      <SectionCard title="Filtreler">
        <div className="flex flex-wrap gap-3">
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Paket durumu
            <select
              className="rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-sm text-zinc-100"
              value={packageStatus}
              onChange={(e) => mergeQuery({ packageStatus: e.target.value || null }, true)}
            >
              <option value="">Tümü</option>
              {[0, 1, 2, 3].map((v) => (
                <option key={v} value={String(v)}>
                  {studentPackageStatusLabel(v)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Öğrenci e-posta
            <input
              className="min-w-[200px] rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-sm text-zinc-100"
              defaultValue={studentEmailContains}
              placeholder="içerir..."
              onBlur={(e) => mergeQuery({ studentEmailContains: e.target.value.trim() || null }, true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") mergeQuery({ studentEmailContains: (e.target as HTMLInputElement).value.trim() || null }, true);
              }}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Bitiş (N gün içinde)
            <input
              type="number"
              min={1}
              max={365}
              className="w-28 rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-sm text-zinc-100"
              placeholder="—"
              defaultValue={expiringWithinDays}
              onBlur={(e) =>
                mergeQuery({ expiringWithinDays: e.target.value.trim() ? e.target.value.trim() : null }, true)
              }
            />
          </label>
        </div>
      </SectionCard>
      <SectionCard title="Liste">
        {items.length === 0 ? (
          <EmptyState title="Kayıt yok" message="Filtreleri gevşetmeyi deneyin." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-zinc-500">
                <tr className="border-b border-white/10">
                  <th className="pb-2 pr-3">Öğrenci</th>
                  <th className="pb-2 pr-3">Paket</th>
                  <th className="pb-2 pr-3">Durum</th>
                  <th className="pb-2 pr-3">Başlangıç</th>
                  <th className="pb-2 pr-3">Bitiş</th>
                  <th className="pb-2">Koç</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((r) => (
                  <tr key={r.id} className="text-zinc-300">
                    <td className="py-2 pr-3 align-top text-xs">
                      <span className="block font-medium text-zinc-100">{r.studentFullName}</span>
                      {r.studentEmail}
                    </td>
                    <td className="py-2 pr-3 align-top">{r.packageName}</td>
                    <td className="py-2 pr-3 align-top">{studentPackageStatusLabel(r.packageStatus)}</td>
                    <td className="py-2 pr-3 align-top text-xs">{fmtDate(r.startsAtUtc)}</td>
                    <td className="py-2 pr-3 align-top text-xs">{fmtDate(r.endsAtUtc)}</td>
                    <td className="py-2 align-top text-xs">{r.coachEmail ?? "—"}</td>
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
