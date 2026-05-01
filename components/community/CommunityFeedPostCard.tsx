"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { resolveMediaUrl } from "@/lib/media";
import type { CommunityFeedPostJson, CommunityFeedPostMediaJson, SocialCommentNodeJson } from "./community-feed-types";
import { MODERATION_APPROVED, MODERATION_PENDING, MODERATION_REJECTED } from "./community-feed-types";
import { MAX_FEED_COMMENT_BODY } from "./community-feed-types";
import { CommunityFeedImageCarousel } from "./CommunityFeedImageCarousel";
import { CommunityFeedMedia } from "./CommunityFeedMedia";
import { CommunityFeedLikersModal } from "./CommunityFeedLikersModal";
import {
  IconBookmark,
  IconChatBubble,
  IconHeart,
  IconUsers,
  feedPillCommentsOn,
  feedPillCommentsOnLight,
  feedPillLikeOn,
  feedPillLikeOnLight,
  feedPillNeutral,
  feedPillNeutralLight,
  feedPillSaveOn,
  feedPillSaveOnLight,
  feedPillSecondary,
  feedPillSecondaryLight,
} from "./feed-action-ui";
import { usePanelTheme } from "@/contexts/PanelThemeContext";
import { cn } from "@/components/dashboard/DashboardUI";
import { FeedCommentNode } from "./FeedCommentNode";
import { mapCommentTree, mergeReplyIntoTree, prependRootComments } from "./feed-comment-tree";

const EMPTY_MEDIA: CommunityFeedPostMediaJson = {
  hasMedia: false,
  isBeforeAfterSplitLayout: false,
  beforeGallery: [],
  afterGallery: [],
  unifiedGallery: [],
};

const kindLabels: Record<number, string> = {
  0: "Genel",
  1: "Öğün",
  2: "Antrenman",
  3: "Soru",
  4: "Öncesi–sonrası",
};

function relTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function kindNum(k: number | string): number {
  if (typeof k === "number" && !Number.isNaN(k)) return k;
  const byName: Record<string, number> = {
    General: 0,
    MealShare: 1,
    ActivityLog: 2,
    Question: 3,
    BeforeAfter: 4,
  };
  const s = String(k);
  if (s in byName) return byName[s]!;
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? 0 : n;
}

type LikersTarget = { kind: "post" } | { kind: "comment"; commentPublicId: string };

type Props = {
  post: CommunityFeedPostJson;
  token: string;
  onPostChange: (next: CommunityFeedPostJson) => void;
  /** Bildirimden gelen odak: yorumlar açılır ve ilgili yoruma kaydırılır. */
  highlightCommentPublicId?: string | null;
};

export function CommunityFeedPostCard({ post, token, onPostChange, highlightCommentPublicId }: Props) {
  const { theme, enabled } = usePanelTheme();
  const L = enabled && theme === "light";

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [rootComment, setRootComment] = useState("");
  const [rootBusy, setRootBusy] = useState(false);
  const [postLikeBusy, setPostLikeBusy] = useState(false);
  const [favBusy, setFavBusy] = useState(false);
  const [olderBusy, setOlderBusy] = useState(false);
  const olderFetchLock = useRef(false);
  const [likers, setLikers] = useState<LikersTarget | null>(null);

  useEffect(() => {
    if (!highlightCommentPublicId) return;
    setCommentsOpen(true);
  }, [highlightCommentPublicId]);

  useEffect(() => {
    if (!highlightCommentPublicId || !commentsOpen) return;
    const id = `feed-comment-${highlightCommentPublicId}`;
    const run = () => {
      const el = document.getElementById(id);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-pf-orange/50");
      window.setTimeout(() => el.classList.remove("ring-2", "ring-pf-orange/50"), 2200);
    };
    const h = window.requestAnimationFrame(() => window.requestAnimationFrame(run));
    return () => window.cancelAnimationFrame(h);
  }, [highlightCommentPublicId, commentsOpen, post.comments]);

  const authorPhoto = resolveMediaUrl(post.authorPhotoUrl);
  const kn = kindNum(post.kind);
  const removed = Boolean(post.removedFromCommunityAtUtc);
  const mod = Number(post.moderationStatus);

  const moderationRibbon =
    removed || mod === MODERATION_APPROVED ? null : mod === MODERATION_PENDING ? (
      <div
        className={cn(
          "border-b px-3 py-2.5 sm:px-4",
          L
            ? "border-amber-300/78 bg-gradient-to-r from-amber-50 via-amber-50/93 to-orange-50/71"
            : "border-amber-500/35 bg-gradient-to-r from-amber-500/12 to-amber-600/5",
        )}
      >
        <p className={cn("text-xs font-semibold", L ? "text-amber-950" : "text-amber-100")}>Yönetici onayı bekleniyor</p>
        <p className={cn("mt-1 text-[11px] leading-relaxed", L ? "text-amber-950/93" : "text-amber-100/85")}>
          Bu paylaşım onaylandığında akışta ve Topluluk&apos;ta herkese görünür. Durumu{" "}
          <span className={cn("font-semibold", L ? "text-amber-950" : "text-amber-50")}>Paylaşımlarım</span> üzerinden takip edebilirsin.
        </p>
      </div>
    ) : mod === MODERATION_REJECTED ? (
      <div
        className={cn(
          "border-b px-3 py-2.5 sm:px-4",
          L ? "border-red-400/73 bg-red-50" : "border-red-500/35 bg-red-500/10",
        )}
      >
        <p className={cn("text-xs font-semibold", L ? "text-red-950" : "text-red-100")}>Reddedildi</p>
        {post.moderationNote?.trim() ? (
          <p className={cn("mt-1 text-[11px] leading-relaxed", L ? "text-red-900" : "text-red-100/90")}>{post.moderationNote.trim()}</p>
        ) : (
          <p className={cn("mt-1 text-[11px]", L ? "text-red-800" : "text-red-200/85")}>Bu içerik site kurallarına uygun bulunmadı.</p>
        )}
      </div>
    ) : null;

  function push(next: CommunityFeedPostJson) {
    onPostChange(next);
  }

  async function togglePostLike() {
    if (postLikeBusy || removed) return;
    setPostLikeBusy(true);
    const r = await apiFetch<{ ok: boolean; likedByMe: boolean; likeCount: number }>(
      `/api/v1/community/feed/posts/${post.publicId}/like`,
      { method: "POST", accessToken: token },
    );
    setPostLikeBusy(false);
    if (!r.ok) return;
    push({ ...post, likedByMe: r.data.likedByMe, likeCount: r.data.likeCount });
  }

  async function toggleFavorite() {
    if (favBusy || removed) return;
    setFavBusy(true);
    const r = await apiFetch<{ ok: boolean; favoritedByMe: boolean }>(`/api/v1/community/feed/posts/${post.publicId}/favorite`, {
      method: "POST",
      accessToken: token,
    });
    setFavBusy(false);
    if (!r.ok) return;
    push({ ...post, favoritedByMe: r.data.favoritedByMe });
  }

  function onPatchComment(commentPublicId: string, patch: Partial<SocialCommentNodeJson>) {
    push({ ...post, comments: mapCommentTree(post.comments, commentPublicId, patch) });
  }

  function onMergeReply(parentCommentPublicId: string, node: SocialCommentNodeJson, postTotalCommentCount: number) {
    push({
      ...post,
      comments: mergeReplyIntoTree(post.comments, parentCommentPublicId, node),
      totalCommentCount: postTotalCommentCount,
      loadedCommentNodeCount: post.loadedCommentNodeCount + 1,
    });
  }

  async function submitRootComment(e: React.FormEvent) {
    e.preventDefault();
    const body = rootComment.trim();
    if (!body || rootBusy || removed) return;
    setRootBusy(true);
    const r = await apiFetch<{
      ok: boolean;
      node: SocialCommentNodeJson;
      postTotalCommentCount: number;
    }>("/api/v1/community/feed/comments", {
      method: "POST",
      accessToken: token,
      body: JSON.stringify({
        postPublicId: post.publicId,
        parentCommentPublicId: null,
        body,
      }),
    });
    setRootBusy(false);
    if (!r.ok) return;
    push({
      ...post,
      comments: [...post.comments, r.data.node],
      totalCommentCount: r.data.postTotalCommentCount,
      loadedCommentNodeCount: post.loadedCommentNodeCount + 1,
    });
    setRootComment("");
    setCommentsOpen(true);
  }

  async function loadOlderComments() {
    if (!post.commentsCursorBeforeUtc || olderBusy || removed || olderFetchLock.current) return;
    olderFetchLock.current = true;
    setOlderBusy(true);
    try {
      const q = new URLSearchParams({
        beforeUtc: post.commentsCursorBeforeUtc,
        take: "10",
      });
      const r = await apiFetch<{
        roots: SocialCommentNodeJson[];
        hasMore: boolean;
        nextBeforeUtc: string | null;
      }>(`/api/v1/community/feed/posts/${post.publicId}/older-comments?${q.toString()}`, { accessToken: token });
      if (!r.ok) return;
      const roots = r.data.roots ?? [];
      let next = prependRootComments(post, roots);
      next = {
        ...next,
        hasMoreComments: r.data.hasMore,
        commentsCursorBeforeUtc: r.data.nextBeforeUtc ?? null,
      };
      push(next);
    } finally {
      olderFetchLock.current = false;
      setOlderBusy(false);
    }
  }

  const likersUrl =
    likers?.kind === "post"
      ? `/api/v1/community/feed/posts/${post.publicId}/likers`
      : likers?.kind === "comment"
        ? `/api/v1/community/feed/comments/${likers.commentPublicId}/likers`
        : "";

  const pn = L ? feedPillNeutralLight : feedPillNeutral;
  const pillLikeOn = L ? feedPillLikeOnLight : feedPillLikeOn;
  const pillCommentsOn = L ? feedPillCommentsOnLight : feedPillCommentsOn;
  const pillSaveOn = L ? feedPillSaveOnLight : feedPillSaveOn;
  const pillSecondary = L ? feedPillSecondaryLight : feedPillSecondary;

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border",
        L
          ? "border-orange-200/85 bg-white shadow-[0_14px_40px_-16px_rgba(249,115,22,0.18)]"
          : "border-white/10 bg-pf-raised/40",
      )}
    >
      {moderationRibbon}
      <header className={cn("flex gap-3 border-b p-3", L ? "border-orange-200/72" : "border-white/10")}>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-pf-orange/20 text-sm font-bold text-pf-orange-bright">
          {authorPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={authorPhoto} alt="" className="h-full w-full object-cover" />
          ) : (
            (post.authorDisplayName || "?")[0]
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn("truncate text-sm font-bold", L ? "text-stone-900" : "text-white")}>{post.authorDisplayName}</p>
          <p className={cn("mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs", L ? "text-stone-600" : "text-zinc-500")}>
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-bold",
                L ? "bg-orange-100 text-orange-950" : "bg-pf-void text-pf-green-bright",
              )}
            >
              {kindLabels[kn] ?? `Tür ${kn}`}
            </span>
            {!removed && mod === MODERATION_PENDING ? (
              <span
                className={cn(
                  "rounded border px-1.5 py-0.5 text-[10px] font-bold",
                  L ? "border-amber-700/53 bg-amber-100 text-amber-950" : "border-amber-500/40 bg-amber-500/15 text-amber-100",
                )}
              >
                Onay bekliyor
              </span>
            ) : null}
            {!removed && mod === MODERATION_REJECTED ? (
              <span
                className={cn(
                  "rounded border px-1.5 py-0.5 text-[10px] font-bold",
                  L ? "border-red-700/62 bg-red-100 text-red-950" : "border-red-500/40 bg-red-500/10 text-red-100",
                )}
              >
                Reddedildi
              </span>
            ) : null}
            <span>{relTime(post.createdAtUtc)}</span>
            {removed ? (
              <span className={cn(L ? "font-semibold text-red-700" : "text-red-400")}>Topluluktan kaldırıldı</span>
            ) : null}
          </p>
        </div>
      </header>

      {post.heading ? (
        <h3 className={cn("px-3 pt-3 text-sm font-semibold", L ? "text-stone-900" : "text-white")}>{post.heading}</h3>
      ) : null}
      {post.periodLabel ? (
        <p className={cn("px-3 pt-1 text-xs", L ? "font-semibold text-orange-900" : "text-pf-orange-bright")}>{post.periodLabel}</p>
      ) : null}
      <div className="min-w-0 px-3 pb-1 pt-2">
        <p className={cn("whitespace-pre-wrap text-sm", L ? "text-stone-700" : "text-zinc-300")}>{post.body}</p>
        <CommunityFeedMedia media={post.media ?? EMPTY_MEDIA} altBase={post.heading || post.authorDisplayName} />
        {post.attachments?.length && !post.media?.hasMedia ? (
          <div className="mt-2 min-w-0">
            <CommunityFeedImageCarousel
              urls={post.attachments.map((a) => resolveMediaUrl(a.url)).filter(Boolean) as string[]}
              altPrefix={post.heading || post.authorDisplayName || "Görsel"}
            />
          </div>
        ) : null}
      </div>

      {!removed ? (
        <div
          className={cn(
            "border-t px-2 pb-2.5 pt-2 sm:px-3",
            L
              ? "border-orange-200/72 bg-gradient-to-b from-orange-50/93 to-orange-50/71"
              : "border-white/10 bg-gradient-to-b from-pf-void/40 to-pf-void/75",
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={postLikeBusy}
              onClick={() => void togglePostLike()}
              className={post.likedByMe ? pillLikeOn : pn}
              aria-pressed={post.likedByMe}
            >
              <IconHeart filled={post.likedByMe} />
              <span>{post.likedByMe ? "Beğendin" : "Beğen"}</span>
              <span className="tabular-nums opacity-85">{post.likeCount}</span>
            </button>
            <button
              type="button"
              onClick={() => setCommentsOpen((o) => !o)}
              className={commentsOpen ? pillCommentsOn : pn}
              aria-expanded={commentsOpen}
            >
              <IconChatBubble />
              <span>Yorumlar</span>
              <span className="tabular-nums opacity-85">{post.totalCommentCount}</span>
            </button>
            <button
              type="button"
              disabled={favBusy}
              onClick={() => void toggleFavorite()}
              className={post.favoritedByMe ? pillSaveOn : pn}
              aria-pressed={post.favoritedByMe}
            >
              <IconBookmark filled={post.favoritedByMe} />
              <span>{post.favoritedByMe ? "Kayıtlı" : "Kaydet"}</span>
            </button>
            {post.likeCount > 0 ? (
              <button type="button" onClick={() => setLikers({ kind: "post" })} className={pillSecondary} title="Beğenenleri listele">
                <IconUsers />
                <span>Beğenenler</span>
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {!removed && commentsOpen ? (
        <div className={cn("border-t px-2 py-2 sm:px-3", L ? "border-orange-200/74 bg-orange-50/55" : "border-white/10 bg-pf-void/20")}>
          <div
            className="max-h-[min(52vh,22rem)] overflow-y-auto overscroll-y-contain pr-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]"
            onScroll={(e) => {
              const el = e.currentTarget;
              if (el.scrollTop > 80) return;
              if (!post.hasMoreComments || olderBusy || !post.commentsCursorBeforeUtc) return;
              void loadOlderComments();
            }}
          >
            {post.hasMoreComments ? (
              <button
                type="button"
                disabled={olderBusy || !post.commentsCursorBeforeUtc}
                onClick={() => void loadOlderComments()}
                className={cn(
                  "mb-2 w-full rounded-lg border py-2 text-[11px] font-semibold disabled:opacity-40",
                  L
                    ? "border-orange-950/22 text-stone-600 hover:border-orange-800/72 hover:bg-white hover:text-orange-950"
                    : "border-white/10 text-zinc-400 hover:border-pf-orange/30 hover:text-pf-orange-bright",
                )}
              >
                {olderBusy ? "Yükleniyor…" : "Önceki yorumları yükle (veya yukarı kaydır)"}
              </button>
            ) : null}
            <ul className="space-y-2 pb-1">
              {post.comments.map((c) => (
                <FeedCommentNode
                  key={c.publicId}
                  node={c}
                  depth={0}
                  postPublicId={post.publicId}
                  token={token}
                  onPatchComment={onPatchComment}
                  onMergeReply={onMergeReply}
                  onOpenCommentLikers={(id) => setLikers({ kind: "comment", commentPublicId: id })}
                />
              ))}
            </ul>
          </div>
          <form
            onSubmit={(e) => void submitRootComment(e)}
            className={cn("mt-2 space-y-2 border-t pt-2", L ? "border-orange-200/70" : "border-white/10")}
          >
            <textarea
              value={rootComment}
              onChange={(e) => setRootComment(e.target.value)}
              rows={2}
              maxLength={MAX_FEED_COMMENT_BODY}
              placeholder="Yorum yaz…"
              className={cn(
                "w-full rounded-xl border px-3 py-2 text-sm",
                L ? "border-orange-950/27 bg-white text-stone-900 placeholder:text-stone-500/75" : "border-white/10 bg-pf-void",
              )}
            />
            <button
              type="submit"
              disabled={rootBusy || !rootComment.trim()}
              className="rounded-xl border border-pf-orange/40 bg-pf-orange px-4 py-2 text-xs font-bold text-black shadow-sm hover:bg-pf-orange-bright disabled:opacity-50"
            >
              {rootBusy ? "…" : "Yorum gönder"}
            </button>
          </form>
        </div>
      ) : null}

      {likers && likersUrl ? (
        <CommunityFeedLikersModal
          token={token}
          title={likers.kind === "post" ? "Gönderiyi beğenenler" : "Yorumu beğenenler"}
          url={likersUrl}
          onClose={() => setLikers(null)}
        />
      ) : null}
    </article>
  );
}
