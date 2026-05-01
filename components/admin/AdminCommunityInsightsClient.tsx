"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api/client";
import { DashboardShell, EmptyState, ErrorState, LoadingState, PageHeader, SectionCard, StatCard } from "@/components/dashboard/DashboardUI";
import { AdminCommunityStatsJson } from "./AdminShared";

export function AdminCommunityInsightsClient() {
  const { ready, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AdminCommunityStatsJson | null>(null);

  useEffect(() => {
    if (!ready || !token) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const r = await apiFetch<AdminCommunityStatsJson>("/api/v1/admin/community/insights", { accessToken: token });
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

  if (!ready || !token || loading) return <LoadingState label="Topluluk içgörüleri yükleniyor..." />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <EmptyState title="Veri yok" message="Topluluk istatistikleri bulunamadı." />;

  return (
    <DashboardShell>
      <PageHeader eyebrow="Yönetim" title="Topluluk içgörüleri" lead="Admin API istatistikleri ile içerik moderasyon sağlığı." />
      <SectionCard title="Akış gönderileri">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Toplam" value={data.feedPostsTotal} />
          <StatCard label="Bekleyen" value={data.feedPostsPending} tone="orange" />
          <StatCard label="Onaylı" value={data.feedPostsApproved} tone="success" />
          <StatCard label="Reddedilen" value={data.feedPostsRejected} tone="pink" />
        </div>
      </SectionCard>
      <SectionCard title="Akış yorumları">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Toplam" value={data.feedCommentsTotal} />
          <StatCard label="Bekleyen" value={data.feedCommentsPending} tone="orange" />
          <StatCard label="Onaylı" value={data.feedCommentsApproved} tone="success" />
          <StatCard label="Reddedilen" value={data.feedCommentsRejected} tone="pink" />
        </div>
      </SectionCard>
      <SectionCard title="Forum">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Konu bekleyen" value={data.forumTopicsPending} tone="orange" />
          <StatCard label="Konu onaylı" value={data.forumTopicsApproved} tone="success" />
          <StatCard label="Yorum bekleyen" value={data.forumPostsPending} tone="orange" />
          <StatCard label="Yorum onaylı" value={data.forumPostsApproved} tone="success" />
        </div>
      </SectionCard>
    </DashboardShell>
  );
}
