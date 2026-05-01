"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api/client";
import { routes } from "@/lib/site";
import {
  Badge,
  DashboardShell,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  SectionCard,
} from "@/components/dashboard/DashboardUI";

type Stats = {
  cachedExerciseCount: number;
  localDemoCatalogCount: number;
  hasApiKeyConfigured: boolean;
  recentLogs: Array<Record<string, unknown>>;
};

export function AdminMuscleWikiClient() {
  const { ready, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!token) return;
    setLoading(true);
    const r = await apiFetch<Stats>("/api/v1/admin/muscle-wiki/status?recentLogTake=40", {
      accessToken: token,
    });
    setLoading(false);
    if (!r.ok) {
      setError(r.message);
      setStats(null);
    } else {
      setError(null);
      setStats(r.data ?? null);
    }
  }

  useEffect(() => {
    if (!ready || !token) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- token yüklenince
  }, [ready, token]);

  async function postAction(path: "full-import" | "refresh-expired" | "mirror-to-exercise-library") {
    if (!token) return;
    setBusy(true);
    setActionMsg(null);
    const r = await apiFetch<{ message?: string }>(`/api/v1/admin/muscle-wiki/${path}`, {
      method: "POST",
      accessToken: token,
    });
    setBusy(false);
    if (!r.ok) setActionMsg(r.message);
    else setActionMsg((r.data as { message?: string } | undefined)?.message ?? "Tamam.");
    await load();
  }

  if (!ready || !token || loading) return <LoadingState label="MuscleWiki durumu yükleniyor..." />;
  if (error) return <ErrorState message={error} />;
  if (!stats) return <EmptyState title="Veri alınamadı" message="Sunucu durum uç noktası yanıt vermedi." />;

  return (
    <DashboardShell>
      <PageHeader
        eyebrow="Yönetim"
        title="MuscleWiki senk."
        lead="Önbellek MuscleWiki API ile dolar; koç araması ExerciseLibrary tablosunu kullanır — tam içe aktarımdan sonra otomatik yansıtılır veya aşağıdaki düğümle tek başına da çalıştırılabilir."
        actions={
          <Link href={routes.admin} className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/5">
            ← Özet
          </Link>
        }
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
          <p className="text-xs text-zinc-500">Önbellek (MuscleWiki)</p>
          <p className="mt-1 font-display text-2xl font-bold text-white">{stats.cachedExerciseCount}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
          <p className="text-xs text-zinc-500">Yerel demo katalog</p>
          <p className="mt-1 font-display text-2xl font-bold text-white">{stats.localDemoCatalogCount}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
          <p className="text-xs text-zinc-500">API anahtarı</p>
          <p className="mt-3">
            {stats.hasApiKeyConfigured ? (
              <Badge tone="success">Yapılandırılmış</Badge>
            ) : (
              <Badge tone="error">Yok — içe aktarma çalışmaz</Badge>
            )}
          </p>
        </div>
      </div>
      <SectionCard title="Uzun süre çalışan işler">
        {actionMsg ? <p className="mb-2 text-xs text-emerald-300">{actionMsg}</p> : null}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void postAction("full-import")}
            className="rounded-xl bg-pf-orange px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
          >
            Tam içe aktarma
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void postAction("refresh-expired")}
            className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-zinc-100 disabled:opacity-50"
          >
            Süresi dolanları yenile
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void postAction("mirror-to-exercise-library")}
            className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 disabled:opacity-50"
          >
            Önbelleği koç kütüphanesine yansıt
          </button>
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          «Yansıt» yalnızca veritabanındaki MuscleWiki önbelleğini okur; API anahtarı gerektirmez. Önce tam içe aktarma veya demo verisi olmalıdır.
        </p>
      </SectionCard>
      <SectionCard title="Son günlükler (JSON)">
        {stats.recentLogs.length === 0 ? (
          <p className="text-sm text-zinc-500">Günlük yok.</p>
        ) : (
          <pre className="max-h-80 overflow-auto rounded-xl border border-white/10 bg-black/40 p-3 text-[11px] text-zinc-400">
            {JSON.stringify(stats.recentLogs.slice(0, 12), null, 2)}
          </pre>
        )}
      </SectionCard>
    </DashboardShell>
  );
}
