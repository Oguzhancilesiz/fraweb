"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api/client";
import { routes } from "@/lib/site";
import { resolveMediaUrl } from "@/lib/media";
import { CommunityFeedPostCard } from "@/components/community/CommunityFeedPostCard";
import { IconHeart, feedPillLikeOn, feedPillNeutral } from "@/components/community/feed-action-ui";
import type { CoachCommunityProfileJson } from "./coach-public-types";

export function CoachPublicProfileClient({ coachUserId }: { coachUserId: string }) {
  const router = useRouter();
  const { token, ready } = useAuth();
  const [profile, setProfile] = useState<CoachCommunityProfileJson | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [likeBusy, setLikeBusy] = useState(false);
  const [postsOpen, setPostsOpen] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setErr(null);
    const r = await apiFetch<CoachCommunityProfileJson>(`/api/v1/community/coaches/${coachUserId}`, { accessToken: token });
    setLoading(false);
    if (!r.ok) {
      setErr(r.message);
      setProfile(null);
      return;
    }
    setProfile(r.data);
  }, [token, coachUserId]);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace(`${routes.login}?returnUrl=${encodeURIComponent(routes.coachCommunityProfile(coachUserId))}`);
      return;
    }
    void load();
  }, [ready, token, router, coachUserId, load]);

  async function toggleCoachLike() {
    if (!token || !profile || likeBusy) return;
    setLikeBusy(true);
    const r = await apiFetch<{ ok?: boolean; likedByMe?: boolean; likeCount?: number }>(
      `/api/v1/community/coaches/${coachUserId}/like`,
      { method: "POST", accessToken: token, body: "{}" },
    );
    setLikeBusy(false);
    if (!r.ok) return;
    const liked = Boolean(r.data?.likedByMe);
    const cnt = typeof r.data?.likeCount === "number" ? r.data.likeCount : profile.likeCount;
    setProfile((p) => (p ? { ...p, likedByMe: liked, likeCount: cnt } : p));
  }

  if (!ready || !token) {
    return <div className="py-16 text-center text-sm text-zinc-500">Yükleniyor…</div>;
  }

  if (loading) {
    return <div className="py-16 text-center text-sm text-zinc-500">Profil yükleniyor…</div>;
  }

  if (err || !profile) {
    return (
      <div className="py-10">
        <p className="text-sm text-red-300">{err ?? "Antrenör bulunamadı."}</p>
        <Link href={routes.coaches} className="mt-4 inline-block text-sm font-semibold text-pf-orange-bright hover:underline">
          Antrenör listesine dön
        </Link>
      </div>
    );
  }

  const photo = resolveMediaUrl(profile.photoUrl);

  return (
    <div className="py-2">
      <nav className="mb-4 text-xs text-zinc-500">
        <Link href={routes.coaches} className="font-semibold text-pf-orange-bright hover:underline">
          Antrenörler
        </Link>
        <span className="mx-1.5 text-zinc-600">/</span>
        <span className="line-clamp-1 text-zinc-400" title={profile.displayName}>
          {profile.displayName}
        </span>
      </nav>

      <header className="overflow-hidden rounded-2xl border border-white/10 bg-pf-raised/45">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:gap-6 sm:p-6">
          <div className="mx-auto flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/10 text-3xl font-bold text-pf-orange-bright ring-2 ring-white/10 sm:mx-0 sm:h-36 sm:w-36">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" className="h-full w-full object-cover" />
            ) : (
              (profile.displayName || "?")[0]
            )}
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h1 className="font-display text-2xl font-bold text-white md:text-3xl">{profile.displayName}</h1>
            {profile.viewerIsSelf ? (
              <p className="mt-1 text-xs font-semibold text-pf-orange-bright">Bu profil sana ait</p>
            ) : null}
            {profile.bio ? (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">{profile.bio}</p>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">Henüz biyografi eklenmemiş.</p>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <button
                type="button"
                disabled={likeBusy}
                onClick={() => void toggleCoachLike()}
                className={profile.likedByMe ? feedPillLikeOn : feedPillNeutral}
                aria-pressed={profile.likedByMe}
              >
                <IconHeart filled={profile.likedByMe} />
                <span>{profile.likedByMe ? "Beğendin" : "Beğen"}</span>
                <span className="tabular-nums opacity-90">{profile.likeCount}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="mt-8">
        <button
          type="button"
          onClick={() => setPostsOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-pf-void/30 px-4 py-3 text-left"
          aria-expanded={postsOpen}
        >
          <h2 className="font-display text-lg font-bold text-white">Topluluk paylaşımları ({profile.feedPosts.length})</h2>
          <span className="text-xs font-semibold text-zinc-400">{postsOpen ? "Gizle" : "Göster"}</span>
        </button>
        {postsOpen ? (
          <div className="mt-4 space-y-5">
            {profile.feedPosts.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/15 px-4 py-8 text-center text-sm text-zinc-500">Henüz listede paylaşım yok.</p>
            ) : (
              profile.feedPosts.map((p) => (
                <CommunityFeedPostCard
                  key={p.publicId}
                  post={p}
                  token={token}
                  onPostChange={(_next) => {
                    void load();
                  }}
                />
              ))
            )}
          </div>
        ) : null}
      </section>

      {profile.forumTopics.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-lg font-bold text-white">Forum konuları ({profile.forumTopics.length})</h2>
          <ul className="mt-3 space-y-2">
            {profile.forumTopics.map((t) => (
              <li key={t.publicId}>
                <Link href={routes.forumTopic(t.publicId)} className="text-sm font-semibold text-pf-orange-bright hover:underline">
                  {t.title}
                </Link>
                <span className="ml-2 text-xs text-zinc-500">{t.commentCount} yanıt</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {profile.forumReplies.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-lg font-bold text-white">Forum yanıtları ({profile.forumReplies.length})</h2>
          <ul className="mt-3 space-y-3">
            {profile.forumReplies.map((r) => (
              <li key={`${r.postPublicId}-${r.createdAtUtc}`} className="rounded-xl border border-white/10 bg-pf-card/35 p-3 text-sm">
                <p className="text-xs text-zinc-500">{new Date(r.createdAtUtc).toLocaleString("tr-TR")}</p>
                <p className="mt-1 font-semibold text-white">{r.topicTitle}</p>
                <p className="mt-1 line-clamp-2 text-zinc-400">{r.bodyPreview}</p>
                <Link href={routes.forumTopic(r.topicPublicId)} className="mt-2 inline-block text-xs font-bold text-pf-orange-bright hover:underline">
                  Konuya git
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
