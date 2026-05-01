"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api/client";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/components/dashboard/DashboardUI";
import { usePanelTheme } from "@/contexts/PanelThemeContext";
import { routes } from "@/lib/site";
import type { CommunityFeedPostJson } from "./community-feed-types";
import { feedPostModerationSortKey } from "./community-feed-types";
import { CommunityFeedPostCard } from "./CommunityFeedPostCard";

type CommentRow = {
  commentPublicId?: string;
  postPublicId?: string;
  commentBodyPreview: string;
  postAuthorDisplayName: string;
  postBodyPreview: string;
  createdAtUtc: string;
};

type ForumTopic = {
  publicId: string;
  title: string;
  createdAtUtc: string;
};

type MineJson = {
  myFeedPosts: CommunityFeedPostJson[];
  myFavoritedFeedPosts?: CommunityFeedPostJson[];
  myCommentsOnOthersFeedPosts: CommentRow[];
  myForumTopics: ForumTopic[];
};

export function CommunityMineOverviewClient() {
  const router = useRouter();
  const { theme, enabled } = usePanelTheme();
  const L = enabled && theme === "light";
  const { token, ready } = useAuth();
  const [data, setData] = useState<MineJson | null>(null);
  const [myPosts, setMyPosts] = useState<CommunityFeedPostJson[]>([]);
  const [favoritedPosts, setFavoritedPosts] = useState<CommunityFeedPostJson[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace(`${routes.login}?returnUrl=${encodeURIComponent(routes.communityMine)}`);
      return;
    }
    let c = false;
    void (async () => {
      setLoading(true);
      const r = await apiFetch<MineJson>("/api/v1/community/feed/mine", { accessToken: token });
      if (c) return;
      if (!r.ok) {
        setErr(r.message);
        setData(null);
        setFavoritedPosts([]);
      } else {
        setErr(null);
        setData(r.data);
        const mine = r.data.myFeedPosts;
        setMyPosts(Array.isArray(mine) ? mine : []);
        const fav = r.data.myFavoritedFeedPosts;
        setFavoritedPosts(Array.isArray(fav) ? fav : []);
      }
      setLoading(false);
    })();
    return () => {
      c = true;
    };
  }, [ready, token, router]);

  const sortedMyPosts = useMemo(() => {
    const arr = [...myPosts];
    arr.sort((a, b) => {
      const d = feedPostModerationSortKey(a.moderationStatus) - feedPostModerationSortKey(b.moderationStatus);
      if (d !== 0) return d;
      return new Date(b.createdAtUtc).getTime() - new Date(a.createdAtUtc).getTime();
    });
    return arr;
  }, [myPosts]);

  if (!ready || loading) {
    return (
      <div className={cn("py-16 text-center text-sm", L ? "text-stone-600" : "text-zinc-500")}>Yükleniyor…</div>
    );
  }

  if (err || !data || !token) {
    return (
      <div className="py-10">
        <p className={cn("text-sm", L ? "text-red-800" : "text-red-300")}>{err ?? "Yüklenemedi."}</p>
      </div>
    );
  }

  const comments = data.myCommentsOnOthersFeedPosts ?? [];
  const topics = data.myForumTopics ?? [];

  return (
    <div className="py-2 lg:py-4">
      <PageHeader
        eyebrow="Topluluk"
        title="Paylaşımlarım"
        lead="Akış gönderileriniz önce yönetici onayına düşer; onay bekleyenleri bu sayfada “Onay bekliyor” olarak görürsünüz. Onaylandıktan sonra herkesin akışında listelenir. Kayıtlı gönderiler, yorumlar ve forum konularınız aşağıdadır."
      />

      <section className="mt-8">
        <h2 className={cn("font-display text-lg font-bold", L ? "text-stone-900" : "text-white")}>Kaydettiklerim ({favoritedPosts.length})</h2>
        <p className={cn("mt-1 max-w-2xl text-xs", L ? "text-stone-700" : "text-zinc-500")}>
          Akışta &quot;Kaydet&quot; ile işaretlediğin gönderiler burada listelenir. Kaydı kaldırınca bu listeden düşer.
        </p>
        {favoritedPosts.length === 0 ? (
          <p className={cn("mt-3 text-sm", L ? "text-stone-600" : "text-zinc-500")}>
            Henüz kayıtlı gönderi yok. Akışta bir gönderide «Kaydet» düğmesine basabilirsin.
          </p>
        ) : (
          <ul className="mt-4 space-y-5">
            {favoritedPosts.map((p) => (
              <li key={p.publicId}>
                <CommunityFeedPostCard
                  post={p}
                  token={token}
                  onPostChange={(next) => {
                    setFavoritedPosts((prev) => {
                      if (!next.favoritedByMe) return prev.filter((x) => x.publicId !== next.publicId);
                      return prev.map((x) => (x.publicId === next.publicId ? next : x));
                    });
                  }}
                />
              </li>
            ))}
          </ul>
        )}
        {favoritedPosts.length > 0 ? (
          <p className={cn("mt-4 text-xs", L ? "text-stone-600" : "text-zinc-600")}>
            Tüm akışa dönmek için{" "}
            <Link
              href={routes.community}
              className={cn("font-semibold hover:underline", L ? "text-orange-950" : "text-pf-orange-bright")}
            >
              Topluluk akışı
            </Link>
            .
          </p>
        ) : null}
      </section>

      <section className="mt-10">
        <h2 className={cn("font-display text-lg font-bold", L ? "text-stone-900" : "text-white")}>Akış gönderilerim ({myPosts.length})</h2>
        <p className={cn("mt-1 max-w-2xl text-xs", L ? "text-stone-700" : "text-zinc-500")}>
          Onay bekleyen gönderiler listede üstte; yayına alınınca akışta herkese açılır. Her kartta beğeni, kaydet ve yorumlar aynı şekilde çalışır.
        </p>
        {myPosts.length === 0 ? (
          <p className={cn("mt-3 text-sm", L ? "text-stone-600" : "text-zinc-500")}>Henüz gönderi yok.</p>
        ) : (
          <ul className="mt-4 space-y-5">
            {sortedMyPosts.map((p) => (
              <li key={p.publicId}>
                <CommunityFeedPostCard
                  post={p}
                  token={token}
                  onPostChange={(next) => {
                    setMyPosts((prev) => prev.map((x) => (x.publicId === next.publicId ? next : x)));
                    setFavoritedPosts((prev) => {
                      if (!next.favoritedByMe) return prev.filter((x) => x.publicId !== next.publicId);
                      if (prev.some((x) => x.publicId === next.publicId)) {
                        return prev.map((x) => (x.publicId === next.publicId ? next : x));
                      }
                      return [next, ...prev];
                    });
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className={cn("font-display text-lg font-bold", L ? "text-stone-900" : "text-white")}>Yorumlarım ({comments.length})</h2>
        <ul className="mt-3 space-y-3">
          {comments.length === 0 ? (
            <li className={cn("text-sm", L ? "text-stone-600" : "text-zinc-500")}>Kayıt yok.</li>
          ) : (
            comments.map((c, i) => (
              <li
                key={`${c.createdAtUtc}-${i}`}
                className={cn(
                  "rounded-xl border p-4 text-sm",
                  L ? "border-orange-200/88 bg-white/96 shadow-sm" : "border-white/10 bg-pf-card/40",
                )}
              >
                <p className={cn("text-xs", L ? "text-stone-600" : "text-zinc-500")}>{new Date(c.createdAtUtc).toLocaleString("tr-TR")}</p>
                <p className={cn(L ? "text-stone-800" : "text-zinc-300")}>
                  <span className={cn("font-semibold", L ? "text-stone-900" : "text-white")}>{c.postAuthorDisplayName}</span> gönderisine:{" "}
                  {c.commentBodyPreview}
                </p>
                <p className={cn("mt-1 line-clamp-2 text-xs", L ? "text-stone-600" : "text-zinc-500")}>{c.postBodyPreview}</p>
                {c.postPublicId ? (
                  <Link
                    href={`${routes.community}?focusPost=${encodeURIComponent(c.postPublicId)}${c.commentPublicId ? `&focusComment=${encodeURIComponent(c.commentPublicId)}` : ""}`}
                    className={cn("mt-2 inline-block text-xs font-semibold hover:underline", L ? "text-orange-950" : "text-pf-orange-bright")}
                  >
                    Gönderide aç
                  </Link>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className={cn("font-display text-lg font-bold", L ? "text-stone-900" : "text-white")}>Forum konularım ({topics.length})</h2>
        <ul className="mt-3 space-y-2">
          {topics.length === 0 ? (
            <li className={cn("text-sm", L ? "text-stone-600" : "text-zinc-500")}>Konu yok.</li>
          ) : (
            topics.map((t) => (
              <li key={t.publicId}>
                <Link
                  href={routes.forumTopic(t.publicId)}
                  className={cn("text-sm hover:underline", L ? "font-semibold text-orange-950" : "text-pf-orange-bright")}
                >
                  {t.title}
                </Link>
                <span className={cn("ml-2 text-xs", L ? "text-stone-600" : "text-zinc-500")}>
                  {new Date(t.createdAtUtc).toLocaleDateString("tr-TR")}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
