"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api/client";
import type { CoachDirectoryEntryJson } from "@/lib/api/types-dashboard";
import { PageHeader } from "@/components/PageHeader";
import { routes } from "@/lib/site";
import { resolveMediaUrl } from "@/lib/media";
import { CommunityFeedPostCard } from "@/components/community/CommunityFeedPostCard";
import { IconHeart, feedPillLikeOn, feedPillNeutral } from "@/components/community/feed-action-ui";
import type { CoachCommunityProfileJson } from "./coach-public-types";

export function CoachesDirectoryClient() {
  const router = useRouter();
  const { token, ready, user } = useAuth();
  const [rows, setRows] = useState<CoachDirectoryEntryJson[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});
  const [profileByCoach, setProfileByCoach] = useState<Record<string, CoachCommunityProfileJson>>({});
  const [profileLoading, setProfileLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace(`${routes.login}?returnUrl=${encodeURIComponent(routes.coaches)}`);
      return;
    }
    const roles = user?.roles ?? [];
    const allowed = roles.some((r) => r === "Student" || r === "Coach");
    if (!allowed) {
      setErr("Bu liste yalnızca öğrenci veya antrenör rolüyle görüntülenebilir.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      const r = await apiFetch<CoachDirectoryEntryJson[]>("/api/v1/community/coaches", { accessToken: token });
      if (cancelled) return;
      if (!r.ok) {
        setErr(r.message);
        setRows([]);
      } else {
        setRows(Array.isArray(r.data) ? r.data : []);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, token, user, router]);

  async function ensureProfileLoaded(coachUserId: string, force = false) {
    if (!token) return;
    if (!force && (profileByCoach[coachUserId] || profileLoading[coachUserId])) return;
    setProfileLoading((m) => ({ ...m, [coachUserId]: true }));
    const r = await apiFetch<CoachCommunityProfileJson>(`/api/v1/community/coaches/${coachUserId}`, { accessToken: token });
    setProfileLoading((m) => ({ ...m, [coachUserId]: false }));
    if (r.ok) setProfileByCoach((m) => ({ ...m, [coachUserId]: r.data }));
  }

  async function toggleCoachDirectoryLike(coachUserId: string) {
    if (!token) return;
    const r = await apiFetch<{ likedByMe?: boolean; likeCount?: number }>(`/api/v1/community/coaches/${coachUserId}/like`, {
      method: "POST",
      accessToken: token,
      body: "{}",
    });
    if (!r.ok) return;
    setRows((prev) =>
      prev.map((x) =>
        x.coachUserId === coachUserId
          ? {
              ...x,
              likedByMe: Boolean(r.data?.likedByMe),
              likeCount: typeof r.data?.likeCount === "number" ? r.data.likeCount : x.likeCount,
            }
          : x,
      ),
    );
  }

  function togglePostsRow(coachUserId: string) {
    setExpandedPosts((m) => {
      const next = !m[coachUserId];
      if (next) void ensureProfileLoaded(coachUserId);
      return { ...m, [coachUserId]: next };
    });
  }

  if (!ready || loading) {
    return <div className="py-16 text-center text-sm text-zinc-500">Yükleniyor…</div>;
  }

  return (
    <div className="py-2">
      <PageHeader
        eyebrow="Topluluk"
        title="Antrenörler"
        lead="Onaylı antrenörlerin profillerine gidin, topluluktaki paylaşımlarını görün ve beğenin. Akış ve forumda antrenör içerikleri önceliklendirilir."
      />
      {err ? (
        <p className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{err}</p>
      ) : null}
      <ul className="mt-6 space-y-5">
        {rows.length === 0 && !err ? (
          <li className="rounded-2xl border border-white/10 bg-pf-card/40 p-6 text-center text-sm text-zinc-500">
            Henüz listelenecek antrenör yok.
          </li>
        ) : (
          rows.map((c) => {
            const avatar = resolveMediaUrl(c.photoUrl);
            const prof = profileByCoach[c.coachUserId];
            const postsOpen = !!expandedPosts[c.coachUserId];
            const profBusy = !!profileLoading[c.coachUserId];
            const previewPosts = prof?.feedPosts?.slice(0, 3) ?? [];

            return (
              <li key={c.coachUserId} className="overflow-hidden rounded-2xl border border-white/10 bg-pf-card/45 shadow-lg">
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:gap-5 sm:p-5">
                  <div className="mx-auto flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/10 text-2xl font-bold text-pf-orange-bright ring-1 ring-white/10 sm:mx-0">
                    {avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      (c.displayName || "?")[0]
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h2 className="font-display text-xl font-bold text-white">{c.displayName}</h2>
                        <p className="mt-1 text-xs text-zinc-500">
                          <span className="tabular-nums">{c.likeCount}</span> topluluk beğenisi
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void toggleCoachDirectoryLike(c.coachUserId)}
                        className={c.likedByMe ? feedPillLikeOn : feedPillNeutral}
                        aria-pressed={c.likedByMe}
                      >
                        <IconHeart filled={c.likedByMe} />
                        <span className="hidden sm:inline">{c.likedByMe ? "Beğendin" : "Beğen"}</span>
                      </button>
                    </div>
                    {c.bioPreview ? (
                      <p className="mt-3 text-sm leading-relaxed text-zinc-300">{c.bioPreview}</p>
                    ) : (
                      <p className="mt-3 text-sm text-zinc-500">Kısa tanıtım henüz eklenmemiş.</p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href={routes.coachCommunityProfile(c.coachUserId)}
                        className="rounded-xl bg-pf-orange px-4 py-2 text-xs font-bold text-black transition hover:brightness-110"
                      >
                        Profil ve tüm paylaşımlar
                      </Link>
                      <button
                        type="button"
                        onClick={() => togglePostsRow(c.coachUserId)}
                        className="rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:border-pf-orange/40 hover:text-white"
                        aria-expanded={postsOpen}
                      >
                        {postsOpen ? "Paylaşımları gizle" : "Paylaşımları göster"}
                      </button>
                    </div>
                  </div>
                </div>
                {postsOpen ? (
                  <div className="border-t border-white/10 bg-pf-void/25 px-3 py-4 sm:px-5">
                    {profBusy && !prof ? (
                      <p className="text-center text-sm text-zinc-500">Paylaşımlar yükleniyor…</p>
                    ) : prof && previewPosts.length > 0 ? (
                      <div className="space-y-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Son paylaşımlar (özet)</p>
                        {token
                          ? previewPosts.map((p) => (
                              <CommunityFeedPostCard
                                key={p.publicId}
                                post={p}
                                token={token}
                                onPostChange={(_next) => {
                                  void ensureProfileLoaded(c.coachUserId, true);
                                }}
                              />
                            ))
                          : null}
                        {prof.feedPosts.length > 3 ? (
                          <p className="text-center text-xs text-zinc-500">
                            +{prof.feedPosts.length - 3} gönderi daha var.{" "}
                            <Link href={routes.coachCommunityProfile(c.coachUserId)} className="font-bold text-pf-orange-bright hover:underline">
                              Profilde gör
                            </Link>
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-center text-sm text-zinc-500">Henüz toplulukta paylaşım yok veya liste boş.</p>
                    )}
                  </div>
                ) : null}
              </li>
            );
          })
        )}
      </ul>
      <p className="mt-8 text-center text-xs text-zinc-500">
        <Link href={routes.student} className="text-pf-orange-bright hover:underline">
          Öğrenci paneli
        </Link>
        {" · "}
        <Link href={routes.coach} className="text-pf-orange-bright hover:underline">
          Antrenör paneli
        </Link>
      </p>
    </div>
  );
}
