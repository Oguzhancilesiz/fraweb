"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api/client";
import { routes } from "@/lib/site";
import { ActionCard, DashboardShell, EmptyState, ErrorState, LoadingState, PageHeader, SectionCard, StatCard } from "@/components/dashboard/DashboardUI";
import { AdminOverviewJson } from "./AdminShared";

export function AdminHomeClient() {
  const { ready, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AdminOverviewJson | null>(null);

  useEffect(() => {
    if (!ready || !token) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const r = await apiFetch<AdminOverviewJson>("/api/v1/admin/home/overview", { accessToken: token });
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

  if (!ready || loading) return <LoadingState label="Admin paneli yükleniyor..." />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <EmptyState title="Veri yok" message="Platform özeti alınamadı." />;

  return (
    <DashboardShell>
      <PageHeader
        eyebrow="Yönetim"
        title="Admin genel bakış"
        lead="`/api/v1/admin/home/overview` ile platform özeti. Tüm yönetim ekranları bu API’nin arkasından çalışır."
        actions={
          <>
            <Link href={routes.adminUsers} className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-white/5">
              Kullanıcılar
            </Link>
            <Link href={routes.adminModeration} className="rounded-full bg-pf-orange px-4 py-2 text-sm font-bold text-black">
              İçerik onayı
            </Link>
          </>
        }
      />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Öğrenci" value={data.statistics.usersInRoleStudent} />
        <StatCard label="Koç" value={data.statistics.usersInRoleCoach} tone="purple" />
        <StatCard label="Admin" value={data.statistics.usersInRoleAdmin} tone="orange" />
        <StatCard label="Süper admin" value={data.statistics.usersInRoleSuperAdmin} tone="pink" />
      </section>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Onay bekleyen toplam" value={data.moderationPendingTotal} tone="orange" />
        <StatCard label="Aktif öğrenci paketi" value={data.statistics.activeStudentPackagesCount} />
        <StatCard label="30g ödenen sipariş" value={data.statistics.paidOrdersLast30DaysCount} />
        <StatCard label="Son 24s audit kaydı" value={data.statistics.auditLogEntriesLast24Hours} />
      </section>
      <SectionCard title="Hızlı aksiyonlar">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <ActionCard title="Ödemeler" description="Tamamlanan / bekleyen siparişler." href={routes.adminPayments} />
          <ActionCard title="Öğrenci paketleri" description="Aktifleşme ve bitiş tarihleri." href={routes.adminStudentPackages} />
          <ActionCard title="Paket kataloğu" description="Landing ve Shopier ile hizalı katalog düzenleri." href={routes.adminPackages} />
          <ActionCard title="Kullanıcı dizini" description="Profil ve güvenlik için detay bağlantıları." href={routes.adminUsers} />
          <ActionCard title="İçerik onayı" description="Topluluk ve forum bekleyen kuyruğu." href={routes.adminModeration} />
          <ActionCard title="E-posta merkezi" description="Şablon, otomasyon ve toplu yayın." href={routes.adminEmailCenter} />
          <ActionCard title="Denetim" description="Audit sorgusu (JSON detay dahil)." href={routes.adminAuditLogs} />
          <ActionCard title="Koç paneli" description="Koç görünümüne hızlı geçiş (yetki varsa)." href={routes.coach} />
        </div>
      </SectionCard>
    </DashboardShell>
  );
}
