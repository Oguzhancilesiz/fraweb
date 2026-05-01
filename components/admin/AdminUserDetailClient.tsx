"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api/client";
import { routes } from "@/lib/site";
import {
  Badge,
  DashboardShell,
  ErrorState,
  LoadingState,
  PageHeader,
  SectionCard,
} from "@/components/dashboard/DashboardUI";
import { fmtDate } from "./AdminShared";

type UserDetail = {
  id: string;
  email: string;
  userName?: string | null;
  fullName: string;
  phoneNumber?: string | null;
  emailConfirmed: boolean;
  isActive: boolean;
  lockoutEnabled: boolean;
  lockoutEnd?: string | null;
  accessFailedCount: number;
  twoFactorEnabled: boolean;
  lastLoginAtUtc?: string | null;
  communityPostingSuspended: boolean;
  communityCommentingSuspended: boolean;
  roles: string[];
};

type OverviewRow = {
  publicId?: string;
  preview?: string;
  bodyPreview?: string;
  title?: string;
  kindLabel?: string;
  moderationLabel?: string;
  createdAtUtc?: string;
  deletedAtUtc?: string | null;
  postPreview?: string;
  commentPreview?: string;
  topicTitle?: string;
};

export function AdminUserDetailClient({ userId }: { userId: string }) {
  const router = useRouter();
  const { ready, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [overview, setOverview] = useState<Record<string, unknown> | null>(null);
  const [posting, setPosting] = useState(false);
  const [contentBusy, setContentBusy] = useState<string | null>(null);
  const [restrictionDraft, setRestrictionDraft] = useState<{ postingSuspended: boolean; commentingSuspended: boolean } | null>(
    null,
  );

  const reload = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const ud = await apiFetch<UserDetail>(`/api/v1/admin/users/${userId}`, { accessToken: token });
    const ov = await apiFetch<Record<string, unknown>>(`/api/v1/admin/community/content/users/${userId}/overview`, {
      accessToken: token,
    });
    setLoading(false);
    if (!ud.ok) {
      setError(ud.message);
      setDetail(null);
      setOverview(null);
      return;
    }
    if (!ud.data) {
      setError("Kullanıcı bulunamadı.");
      setDetail(null);
      setOverview(null);
      return;
    }
    setError(null);
    setDetail(ud.data);
    setRestrictionDraft({
      postingSuspended: ud.data.communityPostingSuspended,
      commentingSuspended: ud.data.communityCommentingSuspended,
    });

    if (ov.ok && ov.data) setOverview(ov.data);
    else setOverview(null);
  }, [token, userId]);

  useEffect(() => {
    if (!ready || !token) return;
    void reload();
  }, [ready, token, reload]);

  async function saveRestrictions() {
    if (!token || !restrictionDraft) return;
    setPosting(true);
    const r = await apiFetch(`/api/v1/admin/community/content/users/${userId}/restrictions`, {
      method: "PUT",
      accessToken: token,
      body: JSON.stringify({
        postingSuspended: restrictionDraft.postingSuspended,
        commentingSuspended: restrictionDraft.commentingSuspended,
      }),
    });
    setPosting(false);
    if (!r.ok) alert(r.message);
    else await reload();
  }

  async function lock() {
    if (!token) return;
    if (!confirm("Hesabı kilitle (ban)?")) return;
    const r = await apiFetch(`/api/v1/admin/security/users/${userId}/lock`, { method: "POST", accessToken: token });
    if (!r.ok) alert(r.message);
    else await reload();
  }

  async function unlock() {
    if (!token) return;
    if (!confirm("Kilidi kaldır?")) return;
    const r = await apiFetch(`/api/v1/admin/security/users/${userId}/unlock`, { method: "POST", accessToken: token });
    if (!r.ok) alert(r.message);
    else await reload();
  }

  async function communityContentOp(
    segment: "feed-posts" | "feed-comments" | "forum-topics" | "forum-posts",
    publicId: string,
    action: "soft-delete" | "restore",
  ) {
    if (!token) return;
    const okMsg =
      action === "soft-delete"
        ? "Bu içerik kaldırılsın mı? (soft delete — bağlı yorumlar da etkilenebilir.)"
        : "İçerik geri yüklensin mi?";
    if (!confirm(okMsg)) return;
    const key = `${segment}:${publicId}:${action}`;
    setContentBusy(key);
    const r = await apiFetch(`/api/v1/admin/community/content/${segment}/${publicId}/${action}`, {
      method: "POST",
      accessToken: token,
    });
    setContentBusy(null);
    if (!r.ok) alert(r.message);
    else await reload();
  }

  if (!ready || !token || loading) return <LoadingState label="Profil yükleniyor..." />;
  if (error || !detail) return <ErrorState message={error ?? "Bulunamadı"} />;
  const ro = restrictionDraft ?? {
    postingSuspended: detail.communityPostingSuspended,
    commentingSuspended: detail.communityCommentingSuspended,
  };

  const feedPosts = (overview?.feedPosts as OverviewRow[]) ?? [];
  const feedComments = (overview?.feedComments as OverviewRow[]) ?? [];
  const forumTopics = (overview?.forumTopics as OverviewRow[]) ?? [];
  const forumPosts = (overview?.forumPosts as OverviewRow[]) ?? [];

  function ContentActions({
    segment,
    row,
    primaryLine,
  }: {
    segment: "feed-posts" | "feed-comments" | "forum-topics" | "forum-posts";
    row: OverviewRow;
    primaryLine: string;
  }) {
    const pid = row.publicId;
    if (!pid) return null;
    const deleted = Boolean(row.deletedAtUtc);
    const busy = contentBusy?.startsWith(`${segment}:${pid}:`) ?? false;
    return (
      <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2">
        <p className="text-sm text-zinc-200">{primaryLine}</p>
        <p className="mt-1 text-[11px] text-zinc-500">
          {row.moderationLabel ?? "—"} · {fmtDate(row.createdAtUtc)}
          {deleted ? <span className="ml-2 text-amber-400">kaldırılmış</span> : null}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {!deleted ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void communityContentOp(segment, pid, "soft-delete")}
              className="rounded-lg border border-red-400/40 px-2 py-1 text-[11px] font-semibold text-red-200 hover:bg-red-500/10 disabled:opacity-50"
            >
              Kaldır
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => void communityContentOp(segment, pid, "restore")}
              className="rounded-lg border border-emerald-400/35 px-2 py-1 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/10 disabled:opacity-50"
            >
              Geri yükle
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <DashboardShell>
      <PageHeader
        eyebrow="Yönetim"
        title={detail.fullName || detail.email}
        lead={detail.email}
        actions={
          <button
            type="button"
            onClick={() => router.push(routes.adminUsers)}
            className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/5"
          >
            ← Liste
          </button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {detail.isActive ? <Badge tone="success">Aktif</Badge> : <Badge tone="neutral">Pasif</Badge>}
        {detail.roles.map((r) => (
          <Badge key={r} tone={r.includes("Admin") ? "orange" : "neutral"}>
            {r}
          </Badge>
        ))}
        {detail.lockoutEnabled ? <Badge tone="error">Kilit / ban aktif</Badge> : null}
      </div>

      <SectionCard title="Özet">
        <ul className="space-y-1 text-sm text-zinc-400">
          <li>
            GUID:{" "}
            <span id="userid" className="font-mono text-zinc-200">
              {detail.id}
            </span>
          </li>
          <li>E-posta doğrulama: {detail.emailConfirmed ? "Evet" : "Hayır"}</li>
          <li>Son giriş: {fmtDate(detail.lastLoginAtUtc)}</li>
          <li>Erişim hataları: {detail.accessFailedCount}</li>
          <li>2FA: {detail.twoFactorEnabled ? "açık" : "kapalı"}</li>
          {detail.lockoutEnd ? <li>Kilit bitiş (window): {fmtDate(detail.lockoutEnd)}</li> : null}
        </ul>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => void lock()} className="rounded-xl border border-red-400/40 px-4 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/10">
            Hesabı kilitle
          </button>
          <button
            type="button"
            onClick={() => void unlock()}
            className="rounded-xl border border-emerald-400/30 px-4 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/10"
          >
            Kilidi kaldır
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Topluluk kısıtları">
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={ro.postingSuspended}
            onChange={(e) => setRestrictionDraft((d) => ({ ...(d ?? ro), postingSuspended: e.target.checked }))}
          />{" "}
          Paylaşım askıda
        </label>
        <label className="mt-3 flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={ro.commentingSuspended}
            onChange={(e) => setRestrictionDraft((d) => ({ ...(d ?? ro), commentingSuspended: e.target.checked }))}
          />{" "}
          Yorum askıda
        </label>
        <button
          type="button"
          disabled={posting}
          onClick={() => void saveRestrictions()}
          className="mt-4 rounded-xl bg-pf-orange px-4 py-2 text-xs font-black text-black disabled:opacity-50"
        >
          Kısıtları kaydet
        </button>
      </SectionCard>

      <SectionCard title="Akış gönderileri">
        {!overview ? (
          <p className="text-sm text-zinc-500">Özet yüklenemedi.</p>
        ) : feedPosts.length === 0 ? (
          <p className="text-sm text-zinc-500">Kayıt yok.</p>
        ) : (
          <div className="space-y-2">
            {feedPosts.slice(0, 40).map((row) => (
              <ContentActions
                key={row.publicId}
                segment="feed-posts"
                row={row}
                primaryLine={`${row.kindLabel ?? "Gönderi"} — ${row.preview ?? ""}`}
              />
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Akış yorumları">
        {!overview ? (
          <p className="text-sm text-zinc-500">—</p>
        ) : feedComments.length === 0 ? (
          <p className="text-sm text-zinc-500">Kayıt yok.</p>
        ) : (
          <div className="space-y-2">
            {feedComments.slice(0, 40).map((row) => (
              <ContentActions
                key={row.publicId}
                segment="feed-comments"
                row={row}
                primaryLine={`Gönderi özeti: ${row.postPreview ?? "—"} · Yorum: ${row.commentPreview ?? row.preview ?? ""}`}
              />
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Forum konuları">
        {!overview ? (
          <p className="text-sm text-zinc-500">—</p>
        ) : forumTopics.length === 0 ? (
          <p className="text-sm text-zinc-500">Kayıt yok.</p>
        ) : (
          <div className="space-y-2">
            {forumTopics.slice(0, 40).map((row) => (
              <ContentActions
                key={row.publicId}
                segment="forum-topics"
                row={row}
                primaryLine={row.title ?? row.preview ?? "Konu"}
              />
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Forum yanıtları">
        {!overview ? (
          <p className="text-sm text-zinc-500">—</p>
        ) : forumPosts.length === 0 ? (
          <p className="text-sm text-zinc-500">Kayıt yok.</p>
        ) : (
          <div className="space-y-2">
            {forumPosts.slice(0, 40).map((row) => (
              <ContentActions
                key={row.publicId}
                segment="forum-posts"
                row={row}
                primaryLine={`${row.topicTitle ? `Konu: ${row.topicTitle} · ` : ""}${row.bodyPreview ?? row.preview ?? ""}`}
              />
            ))}
          </div>
        )}
      </SectionCard>
    </DashboardShell>
  );
}
