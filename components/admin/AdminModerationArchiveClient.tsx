"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api/client";
import { routes } from "@/lib/site";
import { DashboardShell, EmptyState, ErrorState, LoadingState, PageHeader, SectionCard } from "@/components/dashboard/DashboardUI";
import { fmtDate } from "./AdminShared";
import { ModerationMediaGallery } from "./ModerationMediaGallery";

type Archive = {
  feedPosts: Array<Record<string, unknown>>;
  feedComments: Array<Record<string, unknown>>;
  forumTopics: Array<Record<string, unknown>>;
  forumPosts: Array<Record<string, unknown>>;
};

export function AdminModerationArchiveClient() {
  const router = useRouter();
  const pathname = "/admin/moderasyon-arsiv";
  const sp = useSearchParams();
  const { ready, token } = useAuth();
  const filter = sp.get("filter") === "Deleted" ? "Deleted" : "Rejected";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archive, setArchive] = useState<Archive | null>(null);

  const qs = useMemo(() => {
    const q = new URLSearchParams();
    q.set("filter", filter);
    return q.toString();
  }, [filter]);

  useEffect(() => {
    if (!ready || !token) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const r = await apiFetch<Archive>(`/api/v1/admin/moderation/archive?${qs}`, { accessToken: token });
      if (cancelled) return;
      if (!r.ok) {
        setError(r.message);
        setArchive(null);
      } else {
        setError(null);
        setArchive(r.data);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, token, qs]);

  if (!ready || !token || loading) return <LoadingState label="Arşiv yükleniyor..." />;
  if (error) return <ErrorState message={error} />;

  const pf = archive?.feedPosts ?? [];
  const cf = archive?.feedComments ?? [];
  const tf = archive?.forumTopics ?? [];
  const fp = archive?.forumPosts ?? [];
  const total = pf.length + cf.length + tf.length + fp.length;

  function setFilter(next: string) {
    const q = new URLSearchParams(sp.toString());
    q.set("filter", next);
    router.replace(`${pathname}?${q}`);
  }

  return (
    <DashboardShell>
      <PageHeader
        eyebrow="Yönetim"
        title="İçerik geçmişi"
        lead={`Arşiv modu: ${filter}. API /moderation/archive.`}
        actions={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFilter("Rejected")}
              className={`rounded-full px-4 py-2 text-xs font-semibold ${
                filter === "Rejected" ? "bg-pf-orange text-black" : "border border-white/15 text-zinc-200 hover:bg-white/5"
              }`}
            >
              Reddedilenler
            </button>
            <button
              type="button"
              onClick={() => setFilter("Deleted")}
              className={`rounded-full px-4 py-2 text-xs font-semibold ${
                filter === "Deleted" ? "bg-pf-orange text-black" : "border border-white/15 text-zinc-200 hover:bg-white/5"
              }`}
            >
              Silinenler
            </button>
            <Link href={routes.adminModeration} className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/5">
              Onay kuyruğu
            </Link>
          </div>
        }
      />

      <p className="text-xs text-zinc-500">Toplam liste öğesi: {total}</p>

      <SectionCard title={`Akış gönderileri (${pf.length})`}>
        {pf.length === 0 ? (
          <EmptyState title="Öğe yok" message="Bu kategoride öğe yok." />
        ) : (
          <ul className="space-y-2 text-sm">
            {pf.map((x) => (
              <li key={String(x.publicId)} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-zinc-300">
                {(x.preview as string) ?? ""}{" "}
                <span className="block text-[11px] text-zinc-500">{fmtDate(x.createdAtUtc as string)}</span>
                <ModerationMediaGallery urls={(x.mediaUrls as string[] | undefined) ?? []} label="Görseller" />
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title={`Yorumlar (${cf.length})`}>
        {cf.length === 0 ? (
          <EmptyState title="Öğe yok" message="Bu kategoride öğe yok." />
        ) : (
          <ul className="space-y-2 text-sm">
            {cf.map((x) => (
              <li key={String(x.publicId)} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-zinc-300">
                {(x.preview as string) ?? ""}
                <span className="block text-[11px] text-zinc-500">{fmtDate(x.createdAtUtc as string)}</span>
                <ModerationMediaGallery urls={(x.postMediaUrls as string[] | undefined) ?? []} label="Gönderi görselleri" />
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title={`Forum konuları (${tf.length})`}>
        {tf.length === 0 ? (
          <EmptyState title="Öğe yok" message="Bu kategoride öğe yok." />
        ) : (
          <ul className="space-y-2 text-sm">
            {tf.map((x) => (
              <li key={String(x.publicId)} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-zinc-300">
                {(x.title as string) ?? ""}{" "}
                <span className="block text-[11px] text-zinc-500">{fmtDate(x.createdAtUtc as string)}</span>
                {(x.openingPreview as string | undefined) ? (
                  <p className="mt-2 line-clamp-3 text-xs text-zinc-500">{x.openingPreview as string}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title={`Forum yanıtları (${fp.length})`}>
        {fp.length === 0 ? (
          <EmptyState title="Öğe yok" message="Bu kategoride öğe yok." />
        ) : (
          <ul className="space-y-2 text-sm">
            {fp.map((x) => (
              <li key={String(x.publicId)} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-zinc-300">
                {(x.preview as string) ?? ""}{" "}
                <span className="block text-[11px] text-zinc-500">{fmtDate(x.createdAtUtc as string)}</span>
                <ModerationMediaGallery urls={(x.mediaUrls as string[] | undefined) ?? []} label="Ekler" />
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </DashboardShell>
  );
}
