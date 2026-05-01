"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api/client";
import { routes } from "@/lib/site";
import { Badge, DashboardShell, EmptyState, ErrorState, LoadingState, PageHeader, SectionCard } from "@/components/dashboard/DashboardUI";

type Item = {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  durationDays: number;
  displayPriceText?: string | null;
  priceAmount: number;
  includesLiveCoachChat: boolean;
  liveChatStudentMessageQuota: number;
  liveChatStudentImageQuota: number;
};

export function AdminPackagesClient() {
  const { ready, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    if (!ready || !token) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const r = await apiFetch<Item[]>("/api/v1/admin/packages", { accessToken: token });
      if (cancelled) return;
      if (!r.ok) {
        setError(r.message);
        setItems([]);
      } else {
        setError(null);
        setItems(r.data ?? []);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, token]);

  if (!ready || loading) return <LoadingState label="Paket katalogu yükleniyor..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <DashboardShell>
      <PageHeader
        eyebrow="Yönetim"
        title="Paketler (katalog)"
        lead="`/api/v1/admin/packages` — yayın politikası paketleri de görebilir; düzenlemek için yönetim rolü gerekebilir."
        actions={
          <div className="flex gap-2">
            <Link
              href={routes.adminPackageNew}
              className="rounded-full bg-pf-orange px-4 py-2 text-xs font-bold text-black hover:brightness-110"
            >
              Yeni paket
            </Link>
            <Link href={routes.admin} className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/5">
              ← Özet
            </Link>
          </div>
        }
      />
      <SectionCard title={`Kayıtlar (${items.length})`}>
        {items.length === 0 ? (
          <EmptyState title="Paket yok" message="Yeni paket oluşturarak başlayın." />
        ) : (
          <div className="divide-y divide-white/10 rounded-2xl border border-white/10">
            {items.map((p) => (
              <Link
                key={p.id}
                href={routes.adminPackage(p.id)}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-white/5"
              >
                <div>
                  <p className="font-semibold text-zinc-100">{p.name}</p>
                  <p className="text-xs font-mono text-zinc-500">{p.slug}</p>
                  <p className="mt-1 text-xs text-zinc-400">{p.durationDays} gün — {Number(p.priceAmount).toFixed(2)} ₺ civarı</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {p.isActive ? <Badge tone="success">Aktif</Badge> : <Badge tone="neutral">Pasif</Badge>}
                  {p.includesLiveCoachChat ? <Badge tone="orange">Canlı koç chat</Badge> : null}
                  <span className="text-xs text-zinc-500">sıra #{p.sortOrder}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </SectionCard>
    </DashboardShell>
  );
}
