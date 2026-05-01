"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api/client";
import { routes } from "@/lib/site";
import { DashboardShell, EmptyState, ErrorState, LoadingState, PageHeader, SectionCard } from "@/components/dashboard/DashboardUI";
import { ModerationPendingJson, fmtDate } from "./AdminShared";
import { ModerationMediaGallery } from "./ModerationMediaGallery";

type Kind = "feedPost" | "feedComment" | "forumTopic" | "forumPost";

type RejectPayload = { kind: Kind; publicId: string };

type RejectDialog =
  | { mode: "single"; payload: RejectPayload }
  | { mode: "bulk"; kind: Kind; ids: string[] };

const BULK_MAX = 100;

function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}

export function AdminModerationClient() {
  const { ready, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ModerationPendingJson | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [rejectDlg, setRejectDlg] = useState<RejectDialog | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const [selPosts, setSelPosts] = useState<string[]>([]);
  const [selComments, setSelComments] = useState<string[]>([]);
  const [selTopics, setSelTopics] = useState<string[]>([]);
  const [selForumPosts, setSelForumPosts] = useState<string[]>([]);

  const load = useCallback(async () => {
    if (!token) return;
    const r = await apiFetch<ModerationPendingJson>("/api/v1/admin/moderation/pending", { accessToken: token });
    if (!r.ok) {
      setError(r.message);
      setData(null);
    } else {
      setError(null);
      setData(r.data);
    }
    setSelPosts([]);
    setSelComments([]);
    setSelTopics([]);
    setSelForumPosts([]);
  }, [token]);

  useEffect(() => {
    if (!ready || !token) return;
    void (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [ready, token, load]);

  function busyKey(kind: string, id: string) {
    return `${kind}:${id}`;
  }

  async function approve(kind: Kind, publicId: string) {
    if (!token) return;
    setBusy(busyKey(kind, publicId));
    let path = "";
    if (kind === "feedPost") path = `feed-posts/${publicId}/approve`;
    if (kind === "feedComment") path = `feed-comments/${publicId}/approve`;
    if (kind === "forumTopic") path = `forum-topics/${publicId}/approve`;
    if (kind === "forumPost") path = `forum-posts/${publicId}/approve`;
    const r = await apiFetch(`/api/v1/admin/moderation/${path}`, { method: "POST", accessToken: token });
    setBusy(null);
    if (!r.ok) setError(r.message);
    await load();
  }

  function bulkApprovePath(kind: Kind): string {
    if (kind === "feedPost") return "bulk/feed-posts/approve";
    if (kind === "feedComment") return "bulk/feed-comments/approve";
    if (kind === "forumTopic") return "bulk/forum-topics/approve";
    return "bulk/forum-posts/approve";
  }

  function bulkRejectPath(kind: Kind): string {
    if (kind === "feedPost") return "bulk/feed-posts/reject";
    if (kind === "feedComment") return "bulk/feed-comments/reject";
    if (kind === "forumTopic") return "bulk/forum-topics/reject";
    return "bulk/forum-posts/reject";
  }

  function idsForKind(kind: Kind): string[] {
    if (kind === "feedPost") return selPosts;
    if (kind === "feedComment") return selComments;
    if (kind === "forumTopic") return selTopics;
    return selForumPosts;
  }

  async function postBulkApproveChunks(kind: Kind, ids: string[]) {
    if (!token || ids.length === 0) return;
    setBulkBusy(true);
    setError(null);
    try {
      for (let i = 0; i < ids.length; i += BULK_MAX) {
        const chunk = ids.slice(i, i + BULK_MAX);
        const r = await apiFetch(`/api/v1/admin/moderation/${bulkApprovePath(kind)}`, {
          method: "POST",
          accessToken: token,
          body: JSON.stringify({ ids: chunk }),
        });
        if (!r.ok) {
          setError(r.message);
          return;
        }
      }
    } finally {
      setBulkBusy(false);
      await load();
    }
  }

  async function runBulkApprove(kind: Kind) {
    await postBulkApproveChunks(kind, idsForKind(kind));
  }

  async function submitReject() {
    if (!token || !rejectDlg) return;
    const dlg = rejectDlg;
    const note = rejectNote.trim() || undefined;

    if (dlg.mode === "single") {
      const { kind, publicId } = dlg.payload;
      setBusy(busyKey(kind, publicId));
      let path = "";
      if (kind === "feedPost") path = `feed-posts/${publicId}/reject`;
      if (kind === "feedComment") path = `feed-comments/${publicId}/reject`;
      if (kind === "forumTopic") path = `forum-topics/${publicId}/reject`;
      if (kind === "forumPost") path = `forum-posts/${publicId}/reject`;
      const r = await apiFetch(`/api/v1/admin/moderation/${path}`, {
        method: "POST",
        accessToken: token,
        body: JSON.stringify({ note }),
      });
      setBusy(null);
      if (!r.ok) setError(r.message);
    } else {
      const all = dlg.ids;
      if (all.length === 0) {
        setRejectDlg(null);
        setRejectNote("");
        return;
      }
      setBulkBusy(true);
      setError(null);
      try {
        for (let i = 0; i < all.length; i += BULK_MAX) {
          const chunk = all.slice(i, i + BULK_MAX);
          const r = await apiFetch(`/api/v1/admin/moderation/${bulkRejectPath(dlg.kind)}`, {
            method: "POST",
            accessToken: token,
            body: JSON.stringify({ ids: chunk, note }),
          });
          if (!r.ok) {
            setError(r.message);
            break;
          }
        }
      } finally {
        setBulkBusy(false);
      }
    }

    setRejectDlg(null);
    setRejectNote("");
    await load();
  }

  const anyBusy = busy !== null || bulkBusy;

  if (!ready || loading) return <LoadingState label="Moderasyon kuyruğu yükleniyor..." />;
  if (error && !data) return <ErrorState message={error} />;

  const posts = data?.feedPosts ?? [];
  const comments = data?.feedComments ?? [];
  const topics = data?.forumTopics ?? [];
  const forumPosts = data?.forumPosts ?? [];

  function allIdsForKind(kind: Kind): string[] {
    if (kind === "feedPost") return posts.map((p) => p.publicId);
    if (kind === "feedComment") return comments.map((c) => c.publicId);
    if (kind === "forumTopic") return topics.map((t) => t.publicId);
    return forumPosts.map((p) => p.publicId);
  }

  function selectAllForKind(kind: Kind) {
    const ids = allIdsForKind(kind);
    if (kind === "feedPost") setSelPosts(ids);
    else if (kind === "feedComment") setSelComments(ids);
    else if (kind === "forumTopic") setSelTopics(ids);
    else setSelForumPosts(ids);
  }

  async function approveEntireSection(kind: Kind) {
    const ids = allIdsForKind(kind);
    if (ids.length === 0) return;
    if (
      !confirm(
        `Bu bölümdeki ${ids.length} öğenin tamamı onaylansın mı? (${Math.ceil(ids.length / BULK_MAX)} API çağrısı)`,
      )
    )
      return;
    await postBulkApproveChunks(kind, ids);
  }

  return (
    <DashboardShell>
      <PageHeader
        eyebrow="Yönetim"
        title="İçerik onayı"
        lead="Görseller API’deki mediaUrls ile önizlenir. Toplu işlem başına en fazla 100 kimlik; daha fazlası otomatik parçalanır. «Bölümdeki tümünü onayla» tüm bekleyenleri onaylar."
        actions={
          <div className="flex gap-2">
            <Link
              href={routes.adminModerationArchive}
              className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-zinc-100 hover:bg-white/5"
            >
              İçerik geçmişi
            </Link>
            <Link href={routes.admin} className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-zinc-100 hover:bg-white/5">
              Panele dön
            </Link>
          </div>
        }
      />

      {error ? <p className="mb-4 text-sm text-red-400">{error}</p> : null}

      <SectionCard title={`Akış gönderileri (${posts.length})`}>
        {posts.length === 0 ? (
          <EmptyState title="Kuyruk boş" message="Akış bekleyeni yok." />
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
              <button
                type="button"
                disabled={anyBusy}
                onClick={() => selectAllForKind("feedPost")}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-white/5 disabled:opacity-50"
              >
                Tümünü seç
              </button>
              <button
                type="button"
                disabled={anyBusy}
                onClick={() => void approveEntireSection("feedPost")}
                className="rounded-lg bg-emerald-600/90 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                Bölümdeki tümünü onayla ({posts.length})
              </button>
            </div>
            {selPosts.length > 0 ? (
              <div className="mb-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={anyBusy}
                  onClick={() => void runBulkApprove("feedPost")}
                  className="rounded-lg bg-pf-orange px-3 py-1.5 text-xs font-bold text-black disabled:opacity-50"
                >
                  Seçilenleri onayla ({selPosts.length})
                </button>
                <button
                  type="button"
                  disabled={anyBusy}
                  onClick={() => setRejectDlg({ mode: "bulk", kind: "feedPost", ids: selPosts })}
                  className="rounded-lg border border-red-400/40 px-3 py-1.5 text-xs font-semibold text-red-200 disabled:opacity-50"
                >
                  Seçilenleri reddet
                </button>
                <button
                  type="button"
                  disabled={anyBusy}
                  onClick={() => setSelPosts([])}
                  className="text-xs text-zinc-500 underline disabled:opacity-50"
                >
                  Seçimi temizle
                </button>
              </div>
            ) : null}
            <div className="space-y-3">
              {posts.map((p) => (
                <article key={p.publicId} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="flex gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 shrink-0 rounded border-white/30"
                      checked={selPosts.includes(p.publicId)}
                      disabled={anyBusy}
                      onChange={() => setSelPosts((s) => toggleId(s, p.publicId))}
                      aria-label="Seç"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-zinc-100">{p.authorDisplayName}</p>
                        <span className="text-[10px] text-zinc-500">{p.kindLabel}</span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">{fmtDate(p.createdAtUtc)}</p>
                      <p className="mt-2 text-sm text-zinc-300">{p.preview}</p>
                      <ModerationMediaGallery urls={p.mediaUrls} label="Görseller" />
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={anyBusy}
                          onClick={() => void approve("feedPost", p.publicId)}
                          className="rounded-xl bg-pf-orange px-3 py-1.5 text-xs font-bold text-black disabled:opacity-50"
                        >
                          Onayla
                        </button>
                        <button
                          type="button"
                          disabled={anyBusy}
                          onClick={() => setRejectDlg({ mode: "single", payload: { kind: "feedPost", publicId: p.publicId } })}
                          className="rounded-xl border border-red-400/40 px-3 py-1.5 text-xs font-semibold text-red-200 disabled:opacity-50"
                        >
                          Reddet
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </SectionCard>

      <SectionCard title={`Akış yorumları (${comments.length})`}>
        {comments.length === 0 ? (
          <EmptyState title="Yorum yok" message="Bekleyen yorum yok." />
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
              <button
                type="button"
                disabled={anyBusy}
                onClick={() => selectAllForKind("feedComment")}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-white/5 disabled:opacity-50"
              >
                Tümünü seç
              </button>
              <button
                type="button"
                disabled={anyBusy}
                onClick={() => void approveEntireSection("feedComment")}
                className="rounded-lg bg-emerald-600/90 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                Bölümdeki tümünü onayla ({comments.length})
              </button>
            </div>
            {selComments.length > 0 ? (
              <div className="mb-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={anyBusy}
                  onClick={() => void runBulkApprove("feedComment")}
                  className="rounded-lg bg-pf-orange px-3 py-1.5 text-xs font-bold text-black disabled:opacity-50"
                >
                  Seçilenleri onayla ({selComments.length})
                </button>
                <button
                  type="button"
                  disabled={anyBusy}
                  onClick={() => setRejectDlg({ mode: "bulk", kind: "feedComment", ids: selComments })}
                  className="rounded-lg border border-red-400/40 px-3 py-1.5 text-xs font-semibold text-red-200 disabled:opacity-50"
                >
                  Seçilenleri reddet
                </button>
                <button
                  type="button"
                  disabled={anyBusy}
                  onClick={() => setSelComments([])}
                  className="text-xs text-zinc-500 underline disabled:opacity-50"
                >
                  Seçimi temizle
                </button>
              </div>
            ) : null}
            <div className="space-y-3">
              {comments.map((c) => (
                <article key={c.publicId} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="flex gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 shrink-0 rounded border-white/30"
                      checked={selComments.includes(c.publicId)}
                      disabled={anyBusy}
                      onChange={() => setSelComments((s) => toggleId(s, c.publicId))}
                      aria-label="Seç"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-zinc-100">{c.authorDisplayName}</p>
                      <p className="mt-1 text-xs text-zinc-500">{fmtDate(c.createdAtUtc)}</p>
                      {c.postPreview ? (
                        <p className="mt-1 text-[11px] text-zinc-500">Gönderi: {c.postPreview}</p>
                      ) : null}
                      <p className="mt-2 text-sm text-zinc-300">{c.preview}</p>
                      <ModerationMediaGallery urls={c.postMediaUrls} label="Bağlı gönderi görselleri" />
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={anyBusy}
                          onClick={() => void approve("feedComment", c.publicId)}
                          className="rounded-xl bg-pf-orange px-3 py-1.5 text-xs font-bold text-black disabled:opacity-50"
                        >
                          Onayla
                        </button>
                        <button
                          type="button"
                          disabled={anyBusy}
                          onClick={() =>
                            setRejectDlg({ mode: "single", payload: { kind: "feedComment", publicId: c.publicId } })
                          }
                          className="rounded-xl border border-red-400/40 px-3 py-1.5 text-xs font-semibold text-red-200 disabled:opacity-50"
                        >
                          Reddet
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </SectionCard>

      <SectionCard title={`Forum konuları (${topics.length})`}>
        {topics.length === 0 ? (
          <EmptyState title="Konu yok" message="Bekleyen forum konusu yok." />
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
              <button
                type="button"
                disabled={anyBusy}
                onClick={() => selectAllForKind("forumTopic")}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-white/5 disabled:opacity-50"
              >
                Tümünü seç
              </button>
              <button
                type="button"
                disabled={anyBusy}
                onClick={() => void approveEntireSection("forumTopic")}
                className="rounded-lg bg-emerald-600/90 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                Bölümdeki tümünü onayla ({topics.length})
              </button>
            </div>
            {selTopics.length > 0 ? (
              <div className="mb-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={anyBusy}
                  onClick={() => void runBulkApprove("forumTopic")}
                  className="rounded-lg bg-pf-orange px-3 py-1.5 text-xs font-bold text-black disabled:opacity-50"
                >
                  Seçilenleri onayla ({selTopics.length})
                </button>
                <button
                  type="button"
                  disabled={anyBusy}
                  onClick={() => setRejectDlg({ mode: "bulk", kind: "forumTopic", ids: selTopics })}
                  className="rounded-lg border border-red-400/40 px-3 py-1.5 text-xs font-semibold text-red-200 disabled:opacity-50"
                >
                  Seçilenleri reddet
                </button>
                <button
                  type="button"
                  disabled={anyBusy}
                  onClick={() => setSelTopics([])}
                  className="text-xs text-zinc-500 underline disabled:opacity-50"
                >
                  Seçimi temizle
                </button>
              </div>
            ) : null}
            <div className="space-y-3">
              {topics.map((t) => (
                <article key={t.publicId} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="flex gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 shrink-0 rounded border-white/30"
                      checked={selTopics.includes(t.publicId)}
                      disabled={anyBusy}
                      onChange={() => setSelTopics((s) => toggleId(s, t.publicId))}
                      aria-label="Seç"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white">{t.title}</p>
                      <p className="text-xs text-zinc-400">{t.authorDisplayName}</p>
                      <p className="mt-1 text-xs text-zinc-500">{fmtDate(t.createdAtUtc)}</p>
                      {t.openingPreview ? (
                        <p className="mt-2 line-clamp-4 text-sm text-zinc-400">{t.openingPreview}</p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={anyBusy}
                          onClick={() => void approve("forumTopic", t.publicId)}
                          className="rounded-xl bg-pf-orange px-3 py-1.5 text-xs font-bold text-black disabled:opacity-50"
                        >
                          Onayla
                        </button>
                        <button
                          type="button"
                          disabled={anyBusy}
                          onClick={() =>
                            setRejectDlg({ mode: "single", payload: { kind: "forumTopic", publicId: t.publicId } })
                          }
                          className="rounded-xl border border-red-400/40 px-3 py-1.5 text-xs font-semibold text-red-200 disabled:opacity-50"
                        >
                          Reddet
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </SectionCard>

      <SectionCard title={`Forum yanıtları (${forumPosts.length})`}>
        {forumPosts.length === 0 ? (
          <EmptyState title="Yanıt yok" message="Bekleyen forum yanıtı yok." />
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
              <button
                type="button"
                disabled={anyBusy}
                onClick={() => selectAllForKind("forumPost")}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-white/5 disabled:opacity-50"
              >
                Tümünü seç
              </button>
              <button
                type="button"
                disabled={anyBusy}
                onClick={() => void approveEntireSection("forumPost")}
                className="rounded-lg bg-emerald-600/90 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                Bölümdeki tümünü onayla ({forumPosts.length})
              </button>
            </div>
            {selForumPosts.length > 0 ? (
              <div className="mb-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={anyBusy}
                  onClick={() => void runBulkApprove("forumPost")}
                  className="rounded-lg bg-pf-orange px-3 py-1.5 text-xs font-bold text-black disabled:opacity-50"
                >
                  Seçilenleri onayla ({selForumPosts.length})
                </button>
                <button
                  type="button"
                  disabled={anyBusy}
                  onClick={() => setRejectDlg({ mode: "bulk", kind: "forumPost", ids: selForumPosts })}
                  className="rounded-lg border border-red-400/40 px-3 py-1.5 text-xs font-semibold text-red-200 disabled:opacity-50"
                >
                  Seçilenleri reddet
                </button>
                <button
                  type="button"
                  disabled={anyBusy}
                  onClick={() => setSelForumPosts([])}
                  className="text-xs text-zinc-500 underline disabled:opacity-50"
                >
                  Seçimi temizle
                </button>
              </div>
            ) : null}
            <div className="space-y-3">
              {forumPosts.map((p) => (
                <article key={p.publicId} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="flex gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 shrink-0 rounded border-white/30"
                      checked={selForumPosts.includes(p.publicId)}
                      disabled={anyBusy}
                      onChange={() => setSelForumPosts((s) => toggleId(s, p.publicId))}
                      aria-label="Seç"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-zinc-500">Konu: {p.topicTitle}</p>
                      <p className="text-sm font-semibold text-zinc-100">{p.authorDisplayName}</p>
                      <p className="mt-1 text-xs text-zinc-500">{fmtDate(p.createdAtUtc)}</p>
                      <p className="mt-2 text-sm text-zinc-300">{p.preview}</p>
                      <ModerationMediaGallery urls={p.mediaUrls} label="Ekler" />
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={anyBusy}
                          onClick={() => void approve("forumPost", p.publicId)}
                          className="rounded-xl bg-pf-orange px-3 py-1.5 text-xs font-bold text-black disabled:opacity-50"
                        >
                          Onayla
                        </button>
                        <button
                          type="button"
                          disabled={anyBusy}
                          onClick={() =>
                            setRejectDlg({ mode: "single", payload: { kind: "forumPost", publicId: p.publicId } })
                          }
                          className="rounded-xl border border-red-400/40 px-3 py-1.5 text-xs font-semibold text-red-200 disabled:opacity-50"
                        >
                          Reddet
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </SectionCard>

      {rejectDlg ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-md overflow-auto rounded-2xl border border-white/15 bg-[#111] p-4 shadow-2xl">
            <p className="text-sm font-bold text-white">
              {rejectDlg.mode === "bulk"
                ? `Toplu reddet (${rejectDlg.ids.length} kayıt; ${Math.ceil(rejectDlg.ids.length / BULK_MAX)} istek)`
                : "Reddet — not eklenebilir"}
            </p>
            <textarea
              className="mt-3 min-h-[100px] w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100"
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Moderasyon notu (ops.)"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-xl border border-white/15 px-4 py-2 text-sm text-zinc-300"
                onClick={() => {
                  setRejectDlg(null);
                  setRejectNote("");
                }}
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={bulkBusy && rejectDlg.mode === "bulk"}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                onClick={() => void submitReject()}
              >
                {rejectDlg.mode === "bulk" ? "Toplu reddet" : "Gönder ve reddet"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
