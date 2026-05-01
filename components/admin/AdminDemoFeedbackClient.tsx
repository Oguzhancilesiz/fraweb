"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api/client";
import { demoFeedbackStatusLabel } from "@/lib/demo-feedback-status";
import { routes } from "@/lib/site";
import { DashboardShell, EmptyState, ErrorState, LoadingState, PageHeader, SectionCard } from "@/components/dashboard/DashboardUI";
import { AdminPager } from "./AdminPager";
import { fmtDate } from "./AdminShared";

type Row = {
  id: number;
  publicId: string;
  status: number;
  message: string;
  pageUrl?: string | null;
  userAgent?: string | null;
  contactEmail?: string | null;
  reporterUserId?: string | null;
  ipAddress?: string | null;
  adminNotes?: string | null;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
  handledByUserId?: string | null;
};

type Result = { totalCount: number; items: Row[] };

export function AdminDemoFeedbackClient() {
  const router = useRouter();
  const pathname = "/admin/demo-bildirimleri";
  const sp = useSearchParams();
  const { ready, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Result | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  const page = Math.max(1, Number(sp.get("page") ?? "1") || 1);
  const pageSize = Math.min(100, Math.max(10, Number(sp.get("pageSize") ?? "25") || 25));
  const statusRaw = sp.get("status")?.trim() ?? "";

  const qs = useMemo(() => {
    const q = new URLSearchParams();
    q.set("page", String(page));
    q.set("pageSize", String(pageSize));
    if (statusRaw !== "") q.set("status", statusRaw);
    return q.toString();
  }, [page, pageSize, statusRaw]);

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
      const r = await apiFetch<Result>(`/api/v1/admin/demo-feedback?${qs}`, { accessToken: token });
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

  async function patchRow(id: number, status: number, adminNotes: string) {
    if (!token) return;
    setSavingId(id);
    const r = await apiFetch(`/api/v1/admin/demo-feedback/${id}`, {
      method: "PATCH",
      accessToken: token,
      body: JSON.stringify({ status, adminNotes: adminNotes.trim() || null }),
    });
    setSavingId(null);
    if (!r.ok) {
      setError(r.message);
      return;
    }
    const r2 = await apiFetch<Result>(`/api/v1/admin/demo-feedback?${qs}`, { accessToken: token });
    if (r2.ok && r2.data) {
      setData(r2.data);
      setError(null);
    }
  }

  if (!ready || !token || loading) return <LoadingState label="Bildirimler yükleniyor..." />;
  if (error) return <ErrorState message={error} />;
  const items = data?.items ?? [];
  const total = data?.totalCount ?? 0;

  return (
    <DashboardShell>
      <PageHeader
        eyebrow="Yönetim"
        title="Demo bildirimleri"
        lead="Ziyaretçilerin gönderdiği hata ve geri bildirimler (`/api/v1/public/demo-feedback`)."
        actions={
          <Link href={routes.admin} className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/5">
            ← Özet
          </Link>
        }
      />
      <SectionCard title="Filtre">
        <label className="flex max-w-xs flex-col gap-1 text-xs text-zinc-400">
          Durum
          <select
            className="rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-sm text-zinc-100"
            value={statusRaw}
            onChange={(e) => mergeQuery({ status: e.target.value || null }, true)}
          >
            <option value="">Tümü</option>
            <option value="0">Yeni</option>
            <option value="1">İnceleniyor</option>
            <option value="2">Çözüldü</option>
            <option value="3">Arşiv</option>
          </select>
        </label>
      </SectionCard>
      <SectionCard title={`Kayıtlar (${total})`}>
        {items.length === 0 ? (
          <EmptyState title="Kayıt yok" message="Henüz bildirim gelmemiş." />
        ) : (
          <div className="space-y-4">
            {items.map((row) => (
              <RowEditor
                key={`${row.id}-${row.updatedAtUtc ?? row.createdAtUtc}`}
                row={row}
                disabled={savingId === row.id}
                onSave={(status, notes) => void patchRow(row.id, status, notes)}
              />
            ))}
            <AdminPager page={page} pageSize={pageSize} totalCount={total} onPageChange={(p) => mergeQuery({ page: String(p) })} />
          </div>
        )}
      </SectionCard>
    </DashboardShell>
  );
}

function RowEditor({
  row,
  disabled,
  onSave,
}: {
  row: Row;
  disabled: boolean;
  onSave: (status: number, adminNotes: string) => void;
}) {
  const [status, setStatus] = useState(row.status);
  const [notes, setNotes] = useState(row.adminNotes ?? "");

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2 text-xs text-zinc-400">
        <span>#{row.id}</span>
        <span>{fmtDate(row.createdAtUtc)}</span>
        {row.reporterUserId && <span className="font-mono text-[10px]">Kullanıcı: {row.reporterUserId}</span>}
        {row.ipAddress && <span>IP: {row.ipAddress}</span>}
      </div>
      <p className="mt-2 whitespace-pre-wrap text-zinc-100">{row.message}</p>
      {row.pageUrl && (
        <p className="mt-1 break-all text-xs text-pf-orange-bright/90">
          <a href={row.pageUrl} target="_blank" rel="noreferrer">
            {row.pageUrl}
          </a>
        </p>
      )}
      {row.contactEmail && <p className="mt-1 text-xs text-zinc-400">İletişim: {row.contactEmail}</p>}
      {row.userAgent && <p className="mt-1 line-clamp-2 text-[10px] text-zinc-500">{row.userAgent}</p>}
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Durum
          <select
            className="rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-sm text-zinc-100"
            value={status}
            disabled={disabled}
            onChange={(e) => setStatus(Number(e.target.value))}
          >
            <option value={0}>{demoFeedbackStatusLabel(0)}</option>
            <option value={1}>{demoFeedbackStatusLabel(1)}</option>
            <option value={2}>{demoFeedbackStatusLabel(2)}</option>
            <option value={3}>{demoFeedbackStatusLabel(3)}</option>
          </select>
        </label>
        <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-xs text-zinc-400">
          Admin notu
          <input
            className="rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-sm text-zinc-100"
            value={notes}
            disabled={disabled}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="İç not"
          />
        </label>
        <button
          type="button"
          disabled={disabled}
          className="rounded-full bg-pf-orange-bright px-3 py-1.5 text-xs font-bold text-black hover:opacity-95 disabled:opacity-50"
          onClick={() => onSave(status, notes)}
        >
          {disabled ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </div>
    </div>
  );
}
