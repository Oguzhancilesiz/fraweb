"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api/client";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/components/dashboard/DashboardUI";
import { usePanelTheme } from "@/contexts/PanelThemeContext";
import { routes } from "@/lib/site";
import { canonicalGuidKey, parseFeedFocusFromHref } from "@/lib/community-notification-nav";
import type { CommunityFeedPostJson } from "./community-feed-types";
import { CommunityFeedPostCard } from "./CommunityFeedPostCard";

export function BeforeAfterExploreClient() {
  const router = useRouter();
  const { theme, enabled } = usePanelTheme();
  const L = enabled && theme === "light";
  const { token, ready } = useAuth();
  const [posts, setPosts] = useState<CommunityFeedPostJson[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const baScrollDone = useRef(false);

  const load = useCallback(async () => {
    if (!token) return;
    const r = await apiFetch<CommunityFeedPostJson[]>("/api/v1/community/before-after/explore?take=40", { accessToken: token });
    if (!r.ok) {
      setErr(r.message);
      setPosts([]);
      return;
    }
    setErr(null);
    setPosts(Array.isArray(r.data) ? r.data : []);
  }, [token]);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace(`${routes.login}?returnUrl=${encodeURIComponent(routes.beforeAfter)}`);
      return;
    }
    void load();
  }, [ready, token, router, load]);

  useEffect(() => {
    const { focusPost } = parseFeedFocusFromHref(`${window.location.pathname}${window.location.search}${window.location.hash}`);
    if (!focusPost || baScrollDone.current || posts.length === 0) return;
    const hit = posts.find((p) => canonicalGuidKey(p.publicId) === canonicalGuidKey(focusPost));
    if (!hit) return;
    baScrollDone.current = true;
    const h = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.getElementById(`ba-post-${hit.publicId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
    return () => window.cancelAnimationFrame(h);
  }, [posts]);

  if (!ready || !token) {
    return (
      <div className={cn("mx-auto max-w-5xl px-4 py-16 text-center text-sm", L ? "text-stone-600" : "text-zinc-500")}>
        Yükleniyor…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 lg:px-6">
      <PageHeader
        eyebrow="Güvenli alan"
        title="Dönüşüm hikayeleri"
        lead="Üyelerin değişim paylaşımları burada görsel, açıklama ve yorum akışıyla görünür."
      />
      {err ? <p className={cn("mb-6 text-sm", L ? "text-red-800" : "text-red-300")}>{err}</p> : null}
      <div className={cn("mt-4 flex flex-wrap items-center gap-3 text-xs", L ? "text-stone-700" : "text-zinc-500")}>
        <span>Dönüşümünü paylaşmak ister misin?</span>
        <Link href={routes.beforeAfterMine} className={cn("font-semibold hover:underline", L ? "text-orange-950" : "text-pf-orange-bright")}>
          Değişimim sayfasına git
        </Link>
      </div>
      <ul className="mt-8 space-y-5">
        {posts.length === 0 && !err ? (
          <li className={cn("text-center text-sm", L ? "text-stone-600" : "text-zinc-500")}>Henüz vitrin gönderisi yok.</li>
        ) : null}
        {posts.map((p) => (
          <li key={p.publicId} id={`ba-post-${p.publicId}`}>
            <CommunityFeedPostCard
              post={p}
              token={token}
              onPostChange={(next) => {
                setPosts((prev) => prev.map((x) => (x.publicId === next.publicId ? next : x)));
              }}
            />
          </li>
        ))}
      </ul>
      <p className={cn("mt-8 text-center text-sm", L ? "text-stone-600" : "text-zinc-500")}>
        <Link
          href={routes.community}
          className={cn("font-semibold underline-offset-2 hover:underline", L ? "text-orange-950" : "text-pf-orange-bright")}
        >
          Topluluk akışı
        </Link>
      </p>
    </div>
  );
}
