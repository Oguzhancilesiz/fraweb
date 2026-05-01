"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/components/dashboard/DashboardUI";
import { useAuth } from "@/contexts/AuthContext";
import { usePanelTheme } from "@/contexts/PanelThemeContext";
import { apiFetch } from "@/lib/api/client";
import { canonicalGuidKey } from "@/lib/community-notification-nav";
import { resolveMediaUrl } from "@/lib/media";
import { routes } from "@/lib/site";
import { CommunityFeedLikersModal } from "./CommunityFeedLikersModal";
import type { ForumTopicDetailJson } from "./forum-types";
import { ForumCommentNode } from "./ForumCommentNode";
import {
  IconHeart,
  feedPillLikeOn,
  feedPillLikeOnLight,
  feedPillNeutral,
  feedPillNeutralLight,
} from "./feed-action-ui";

function relTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

type LikersState = { url: string; title: string };

export function ForumTopicDetailClient({ topicPublicId }: { topicPublicId: string }) {
  const router = useRouter();
  const { theme, enabled } = usePanelTheme();
  const L = enabled && theme === "light";
  const pn = L ? feedPillNeutralLight : feedPillNeutral;
  const pillLikeOn = L ? feedPillLikeOnLight : feedPillLikeOn;
  const { token, ready } = useAuth();
  const [topic, setTopic] = useState<ForumTopicDetailJson | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [topicLikeBusy, setTopicLikeBusy] = useState(false);
  const [likers, setLikers] = useState<LikersState | null>(null);
  const [rootBody, setRootBody] = useState("");
  const [rootBusy, setRootBusy] = useState(false);
  const [rootErr, setRootErr] = useState<string | null>(null);
  const forumAnchorDone = useRef<string | null>(null);

  const loadTopic = useCallback(async () => {
    if (!token) return;
    const r = await apiFetch<ForumTopicDetailJson>(`/api/v1/community/forum/topics/${topicPublicId}`, { accessToken: token });
    if (!r.ok) {
      setErr(r.message);
      setTopic(null);
      return;
    }
    setErr(null);
    setTopic(r.data);
  }, [token, topicPublicId]);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace(`${routes.login}?returnUrl=${encodeURIComponent(routes.forumTopic(topicPublicId))}`);
      return;
    }
    setTopic(null);
    setErr(null);
    void loadTopic();
  }, [ready, token, router, topicPublicId, loadTopic]);

  useEffect(() => {
    forumAnchorDone.current = null;
  }, [topicPublicId]);

  useEffect(() => {
    if (!topic) return;
    const sp = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    const fp = sp.get("focusPost")?.trim();
    if (!fp || forumAnchorDone.current === fp) return;
    const h = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        let el: HTMLElement | null = document.getElementById(`forum-post-${fp}`);
        if (!el) {
          for (const node of document.querySelectorAll<HTMLElement>("[id^=\"forum-post-\"]")) {
            const rest = node.id.slice("forum-post-".length);
            if (canonicalGuidKey(rest) === canonicalGuidKey(fp)) {
              el = node;
              break;
            }
          }
        }
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-pf-orange/45");
        window.setTimeout(() => el?.classList.remove("ring-2", "ring-pf-orange/45"), 2200);
        forumAnchorDone.current = fp;
      });
    });
    return () => window.cancelAnimationFrame(h);
  }, [topic, topicPublicId]);

  async function toggleTopicLike() {
    if (!token || !topic || topicLikeBusy) return;
    setTopicLikeBusy(true);
    const r = await apiFetch<{ ok: boolean; likedByMe: boolean; likeCount: number }>(
      `/api/v1/community/forum/topics/${topicPublicId}/like`,
      { method: "POST", accessToken: token, body: "{}" },
    );
    setTopicLikeBusy(false);
    if (!r.ok) return;
    setTopic((t) => (t ? { ...t, topicLikedByMe: r.data.likedByMe, topicLikeCount: r.data.likeCount } : t));
  }

  async function submitRootReply(e: React.FormEvent) {
    e.preventDefault();
    const body = rootBody.trim();
    if (!body || rootBusy || !token) return;
    setRootBusy(true);
    setRootErr(null);
    const fd = new FormData();
    fd.append("Body", body);
    const r = await apiFetch<{ message?: string }>(`/api/v1/community/forum/topics/${topicPublicId}/replies`, {
      method: "POST",
      accessToken: token,
      body: fd,
    });
    setRootBusy(false);
    if (!r.ok) {
      setRootErr(r.message);
      return;
    }
    setRootBody("");
    setRootErr(null);
    await loadTopic();
  }

  if (!ready || !token) {
    return (
      <div className={cn("py-16 text-center text-sm", L ? "text-stone-600" : "text-zinc-500")}>Yükleniyor…</div>
    );
  }

  const awaitingTopic = !topic && !err;

  if (awaitingTopic) {
    return (
      <div className={cn("py-16 text-center text-sm", L ? "text-stone-600" : "text-zinc-500")}>Konu yükleniyor…</div>
    );
  }

  if (err || !topic) {
    return (
      <div className="py-10">
        <p className={cn("text-sm", L ? "text-red-800" : "text-red-300")}>{err ?? "Konu bulunamadı."}</p>
        <Link
          href={routes.forum}
          className={cn("mt-4 inline-block text-sm font-semibold hover:underline", L ? "text-orange-950" : "text-pf-orange-bright")}
        >
          Foruma dön
        </Link>
      </div>
    );
  }

  const comments = topic.comments ?? [];
  const authorPhoto = resolveMediaUrl(topic.authorPhotoUrl);

  return (
    <div className="py-2">
      <nav className={cn("mb-4 text-xs", L ? "text-stone-600" : "text-zinc-500")}>
        <Link href={routes.forum} className={cn("font-semibold hover:underline", L ? "text-orange-950" : "text-pf-orange-bright")}>
          Forum
        </Link>
        <span className={cn("mx-1.5", L ? "text-stone-500" : "text-zinc-600")}>/</span>
        <span className={cn("line-clamp-1", L ? "text-stone-700" : "text-zinc-400")} title={topic.title}>
          {topic.title}
        </span>
      </nav>

      <article
        className={cn(
          "overflow-hidden rounded-2xl border",
          L ? "border-orange-200/88 bg-white shadow-[0_14px_40px_-20px_rgba(249,115,22,0.18)]" : "border-white/10 bg-pf-raised/40",
        )}
      >
        <header className={cn("flex gap-3 border-b p-4", L ? "border-orange-200/72" : "border-white/10")}>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-pf-orange/20 text-base font-bold text-pf-orange-bright">
            {authorPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={authorPhoto} alt="" className="h-full w-full object-cover" />
            ) : (
              (topic.authorDisplayName || "?")[0]
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className={cn("font-display text-xl font-bold leading-snug md:text-2xl", L ? "text-stone-900" : "text-white")}>
              {topic.title}
            </h1>
            <p className={cn("mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs", L ? "text-stone-600" : "text-zinc-500")}>
              <span className={cn("font-semibold", L ? "text-stone-800" : "text-zinc-300")}>{topic.authorDisplayName}</span>
              <span>·</span>
              <span>{relTime(topic.createdAtUtc)}</span>
              {topic.topicLikeCount > 0 ? (
                <>
                  <span>·</span>
                  <button
                    type="button"
                    className={cn("hover:underline", L ? "font-semibold text-orange-950" : "text-pf-orange-bright")}
                    onClick={() => setLikers({ url: `/api/v1/community/forum/topics/${topicPublicId}/likers`, title: "Konuyu beğenenler" })}
                  >
                    {topic.topicLikeCount} beğeni
                  </button>
                </>
              ) : null}
            </p>
          </div>
        </header>

        <div className={cn("border-b px-4 py-3", L ? "border-orange-200/70" : "border-white/10")}>
          <p className={cn("whitespace-pre-wrap text-sm leading-relaxed", L ? "text-stone-700" : "text-zinc-300")}>{topic.openingBody}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 sm:px-4">
          <button
            type="button"
            disabled={topicLikeBusy}
            onClick={() => void toggleTopicLike()}
            className={topic.topicLikedByMe ? pillLikeOn : pn}
            aria-pressed={topic.topicLikedByMe}
          >
            <IconHeart filled={topic.topicLikedByMe} />
            <span>{topic.topicLikedByMe ? "Beğendin" : "Beğen"}</span>
            <span className="tabular-nums opacity-85">{topic.topicLikeCount}</span>
          </button>
        </div>

        <section className={cn("border-t px-3 py-3 sm:px-4", L ? "border-orange-200/72 bg-orange-50/60" : "border-white/10 bg-pf-void/15")}>
          <h2 className={cn("text-xs font-bold uppercase tracking-wide", L ? "text-stone-600" : "text-zinc-500")}>Yanıtlar ({comments.length})</h2>
          <form
            onSubmit={(ev) => void submitRootReply(ev)}
            className={cn("mt-3 space-y-2 rounded-xl border p-3", L ? "border-orange-950/29 bg-white/96" : "border-white/10 bg-pf-void/25")}
          >
            <label className={cn("text-[11px] font-bold", L ? "text-stone-700" : "text-zinc-500")} htmlFor="forum-root-reply">
              Yanıt yaz
            </label>
            <textarea
              id="forum-root-reply"
              rows={3}
              maxLength={8000}
              value={rootBody}
              onChange={(e) => setRootBody(e.target.value)}
              placeholder="Görüşünü paylaş…"
              className={cn(
                "w-full resize-y rounded-lg border px-3 py-2 text-sm placeholder:text-zinc-600",
                L ? "border-orange-950/29 bg-white text-stone-900 placeholder:text-stone-500/78" : "border-white/10 bg-pf-void/60 text-white",
              )}
            />
            {rootErr ? <p className={cn("text-xs", L ? "text-amber-900" : "text-amber-200/90")}>{rootErr}</p> : null}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={rootBusy || !rootBody.trim()}
                className="rounded-lg bg-pf-orange px-4 py-2 text-xs font-bold text-black disabled:opacity-50"
              >
                {rootBusy ? "Gönderiliyor…" : "Yanıtı gönder"}
              </button>
            </div>
          </form>
          <div className="mt-3 max-h-[min(56vh,26rem)] overflow-y-auto overscroll-y-contain pr-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
            {comments.length === 0 ? (
              <p className={cn("py-6 text-center text-sm", L ? "text-stone-600" : "text-zinc-500")}>Henüz yanıt yok. İlk yanıtı sen yaz.</p>
            ) : (
              <ul className="space-y-2">
                {comments.map((c) => (
                  <ForumCommentNode
                    key={c.publicId}
                    topicPublicId={topicPublicId}
                    node={c}
                    depth={0}
                    token={token}
                    rootComments={comments}
                    onRootCommentsChange={(next) => setTopic((t) => (t ? { ...t, comments: next } : t))}
                    onOpenForumPostLikers={(id) => setLikers({ url: `/api/v1/community/forum/posts/${id}/likers`, title: "Yanıtı beğenenler" })}
                    onReplied={loadTopic}
                  />
                ))}
              </ul>
            )}
          </div>
        </section>
      </article>

      {likers ? <CommunityFeedLikersModal token={token} title={likers.title} url={likers.url} onClose={() => setLikers(null)} /> : null}
    </div>
  );
}
