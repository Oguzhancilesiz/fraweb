"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api/client";
import { routes } from "@/lib/site";
import { DashboardShell, EmptyState, ErrorState, LoadingState, PageHeader, SectionCard } from "@/components/dashboard/DashboardUI";

type Row = {
  id: number;
  key: string;
  valueDisplay: string;
  groupName: string;
  description?: string | null;
  isSecret: boolean;
};

type Result = { items: Row[] };

export function AdminSiteSettingsClient() {
  const { ready, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Result | null>(null);

  useEffect(() => {
    if (!ready || !token) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const r = await apiFetch<Result>("/api/v1/admin/system-settings", { accessToken: token });
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
  }, [ready, token]);

  if (!ready || !token || loading) return <LoadingState label="Site ayarları yükleniyor..." />;
  if (error) return <ErrorState message={error} />;
  const items = data?.items ?? [];

  const byGroup = items.reduce<Record<string, Row[]>>((acc, row) => {
    const g = row.groupName || "Genel";
    acc[g] ??= [];
    acc[g].push(row);
    return acc;
  }, {});

  return (
    <DashboardShell>
      <PageHeader
        eyebrow="Yönetim"
        title="Site ayarları"
        lead="Salt okuma — `GET /api/v1/admin/system-settings`. Üretimde değerler ortam değişkeni, User Secrets veya DB üzerinden yönetilir."
        actions={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/5"
            >
              Yenile
            </button>
            <Link href={routes.admin} className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/5">
              ← Özet
            </Link>
          </div>
        }
      />
      {items.length === 0 ? (
        <SectionCard title="Bilgi">
          <EmptyState
            title="Henüz sistem anahtarı yok"
            message={
              "Varsayılan kayıtlar API açılışında `DbSeeder.SeedSystemSettingsAsync` ile oluşturulur (Site:PublicBaseUrl, aktivasyon süresi, Shopier URL ve maskeli API alanları). Veritabanında `SystemSettings` tablosu boşsa API sürecini yeniden başlatın veya EF migration + seed çalıştığını doğrulayın."
            }
          />
        </SectionCard>
      ) : (
        <div className="space-y-6">
          {Object.entries(byGroup).map(([group, rows]) => (
            <SectionCard key={group} title={group}>
              <div className="space-y-3">
                {rows.map((row) => (
                  <article key={row.id} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-mono text-xs text-zinc-400">{row.key}</span>
                      {row.isSecret ? (
                        <span className="text-[10px] font-bold uppercase text-amber-400/90">gizli / maskeli</span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-zinc-100">{row.valueDisplay}</p>
                    {row.description ? <p className="mt-1 text-xs text-zinc-500">{row.description}</p> : null}
                  </article>
                ))}
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
