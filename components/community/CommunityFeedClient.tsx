"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api/client";
import { COMMUNITY_FEED_RELOAD_EVENT } from "@/lib/community-hub-events";
import { PageHeader } from "@/components/PageHeader";
import { routes } from "@/lib/site";
import { usePanelTheme } from "@/contexts/PanelThemeContext";
import { cn } from "@/components/dashboard/DashboardUI";
import { canonicalGuidKey, parseFeedFocusFromHref } from "@/lib/community-notification-nav";
import type { CommunityFeedPageJson, CommunityFeedPostJson } from "./community-feed-types";
import { CommunityFeedPostCard } from "./CommunityFeedPostCard";

const KIND_FILTERS: { label: string; value: string }[] = [
  { label: "Tümü", value: "" },
  { label: "Genel", value: "General" },
  { label: "Öğün", value: "MealShare" },
  { label: "Antrenman", value: "ActivityLog" },
  { label: "Soru", value: "Question" },
  { label: "Öncesi–sonrası", value: "BeforeAfter" },
];

const PAGE_SIZE = 24;

export function CommunityFeedClient() {
  const router = useRouter();
  const { theme, enabled } = usePanelTheme();
  const L = enabled && theme === "light";
  const { token, ready } = useAuth();
  const [posts, setPosts] = useState<CommunityFeedPostJson[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [kindFilter, setKindFilter] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [nextBeforeUtc, setNextBeforeUtc] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadMoreLock = useRef(false);
  const focusScrolledRef = useRef(false);
  const [urlFocus, setUrlFocus] = useState<{ post?: string; comment?: string }>({});

  const fetchPage = useCallback(
    async (beforeUtc: string | null) => {
      if (!token) return null;
      const q = new URLSearchParams({ take: String(PAGE_SIZE) });
      if (kindFilter) q.set("kind", kindFilter);
      if (beforeUtc) q.set("beforeUtc", beforeUtc);
      return apiFetch<CommunityFeedPageJson>(`/api/v1/community/feed?${q.toString()}`, { accessToken: token });
    },
    [token, kindFilter],
  );

  const load = useCallback(async () => {
    if (!token) return;
    setErr(null);
    loadMoreLock.current = true;
    const r = await fetchPage(null);
    loadMoreLock.current = false;
    if (!r) {
      setPosts([]);
      setHasMore(false);
      setNextBeforeUtc(null);
      return;
    }
    if (!r.ok) {
      setErr(r.message);
      setPosts([]);
      setHasMore(false);
      setNextBeforeUtc(null);
      return;
    }
    const page = r.data;
    setPosts(Array.isArray(page?.items) ? page.items : []);
    setHasMore(Boolean(page?.hasMore));
    setNextBeforeUtc(page?.nextBeforeUtc ?? null);
  }, [token, fetchPage]);

  const loadMore = useCallback(async () => {
    if (!token || loadingMore || loadMoreLock.current || !hasMore || !nextBeforeUtc) return;
    loadMoreLock.current = true;
    setLoadingMore(true);
    const r = await fetchPage(nextBeforeUtc);
    loadMoreLock.current = false;
    setLoadingMore(false);
    if (!r || !r.ok) return;
    const page = r.data;
    const batch = Array.isArray(page?.items) ? page.items : [];
    setPosts((prev) => [...prev, ...batch]);
    setHasMore(Boolean(page?.hasMore));
    setNextBeforeUtc(page?.nextBeforeUtc ?? null);
  }, [token, loadingMore, hasMore, nextBeforeUtc, fetchPage]);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace(`${routes.login}?returnUrl=${encodeURIComponent(routes.community)}`);
      return;
    }
    void load();
  }, [ready, token, router, load]);

  useEffect(() => {
    const f = parseFeedFocusFromHref(`${window.location.pathname}${window.location.search}${window.location.hash}`);
    if (f.focusPost || f.focusComment) setUrlFocus({ post: f.focusPost, comment: f.focusComment });
  }, []);

  useEffect(() => {
    const fp = urlFocus.post;
    if (!fp) return;
    const hit = posts.some((p) => canonicalGuidKey(p.publicId) === canonicalGuidKey(fp));
    if (hit || !hasMore || loadingMore || loadMoreLock.current) return;
    void loadMore();
  }, [urlFocus.post, posts, hasMore, loadingMore, loadMore]);

  useEffect(() => {
    const fp = urlFocus.post;
    if (!fp || focusScrolledRef.current) return;
    const post = posts.find((p) => canonicalGuidKey(p.publicId) === canonicalGuidKey(fp));
    if (!post) return;
    focusScrolledRef.current = true;
    const id = `feed-post-${post.publicId}`;
    const h = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    return () => window.cancelAnimationFrame(h);
  }, [urlFocus.post, urlFocus.comment, posts]);

  useEffect(() => {
    const onReload = () => void load();
    window.addEventListener(COMMUNITY_FEED_RELOAD_EVENT, onReload);
    return () => window.removeEventListener(COMMUNITY_FEED_RELOAD_EVENT, onReload);
  }, [load]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((x) => x.isIntersecting)) void loadMore();
      },
      { root: null, rootMargin: "320px 0px", threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore, posts.length, hasMore]);

  function patchPost(publicId: string, next: CommunityFeedPostJson) {
    setPosts((ps) => ps.map((p) => (p.publicId === publicId ? next : p)));
  }

  if (!ready || !token) {
    return (
      <div className={cn("py-16 text-center text-sm", L ? "text-stone-600" : "text-zinc-500")}>Yükleniyor…</div>
    );
  }

  return (
    <div className="py-2">
      <PageHeader
        eyebrow="Topluluk"
        title="Akış"
        lead="Aşağı kaydırdıkça daha fazla gönderi yüklenir. Paylaşım için üstteki «Gönderi» düğmesini kullanın."
      />

      <div className="mb-6 flex flex-wrap gap-1.5">
        {KIND_FILTERS.map((f) => {
          const active = kindFilter === f.value;
          return (
            <button
              key={f.label}
              type="button"
              onClick={() => setKindFilter(f.value)}
              className={
                active
                  ? "rounded-full bg-gradient-to-r from-pf-orange-bright to-[#ec4899] px-3 py-1 text-[11px] font-bold text-black"
                  : L
                    ? "rounded-full border border-orange-950/28 bg-white/95 px-3 py-1 text-[11px] font-semibold text-stone-700 shadow-sm hover:border-orange-800/52 hover:bg-orange-50 hover:text-orange-950"
                    : "rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold text-zinc-500 hover:border-white/20 hover:text-zinc-300"
              }
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {err ? <p className={cn("mb-4 text-sm", L ? "text-red-800" : "text-red-300")}>{err}</p> : null}

      <ul className="space-y-5">
        {posts.length === 0 && !err ? (
          <li
            className={cn(
              "rounded-xl border p-8 text-center text-sm",
              L
                ? "border-orange-200/85 bg-white/93 text-stone-600 shadow-sm"
                : "border-white/10 text-zinc-500",
            )}
          >
            Henüz gönderi yok.
          </li>
        ) : null}
        {posts.map((p) => (
          <li key={p.publicId} id={`feed-post-${p.publicId}`}>
            <CommunityFeedPostCard
              post={p}
              token={token}
              onPostChange={(next) => patchPost(p.publicId, next)}
              highlightCommentPublicId={
                urlFocus.comment && urlFocus.post && canonicalGuidKey(urlFocus.post) === canonicalGuidKey(p.publicId)
                  ? urlFocus.comment
                  : null
              }
            />
          </li>
        ))}
      </ul>

      <div ref={sentinelRef} className="h-4 w-full shrink-0" aria-hidden="true" />
      {loadingMore ? (
        <p className={cn("mt-3 text-center text-xs", L ? "text-stone-600" : "text-zinc-500")}>Daha fazla yükleniyor…</p>
      ) : null}
      {!hasMore && posts.length > 0 ? (
        <p className={cn("mt-4 text-center text-xs", L ? "text-stone-600" : "text-zinc-600")}>Tüm gönderiler yüklendi.</p>
      ) : null}

      <p className={cn("mt-10 text-center text-xs", L ? "text-stone-600" : "text-zinc-500")}>
        <Link href={routes.beforeAfterExplore} className={cn("font-semibold underline-offset-2 hover:underline", L ? "text-orange-950" : "text-pf-orange-bright")}>
          Öncesi–sonrası vitrin
        </Link>
        {" · "}
        <Link href={routes.forum} className={cn("font-semibold underline-offset-2 hover:underline", L ? "text-orange-950" : "text-pf-orange-bright")}>
          Forum
        </Link>
      </p>
    </div>
  );
}
