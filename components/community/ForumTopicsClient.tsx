"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/lib/site";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api/client";
import { PageHeader } from "@/components/PageHeader";
import { usePanelTheme } from "@/contexts/PanelThemeContext";
import { cn } from "@/components/dashboard/DashboardUI";
import { resolveMediaUrl } from "@/lib/media";
import type { ForumTopicListItemJson } from "./forum-types";
import { IconChatBubble, IconHeart, feedPillNeutral, feedPillNeutralLight, feedPillSecondary, feedPillSecondaryLight } from "./feed-action-ui";

function formatWhen(iso: string) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = diffMs / 36e5;
    if (diffH < 24) return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    if (diffH < 48) return "Dün";
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  } catch {
    return iso;
  }
}

export function ForumTopicsClient() {
  const router = useRouter();
  const { theme, enabled } = usePanelTheme();
  const L = enabled && theme === "light";
  const pn = L ? feedPillNeutralLight : feedPillNeutral;
  const ps = L ? feedPillSecondaryLight : feedPillSecondary;
  const { token, ready } = useAuth();
  const [topics, setTopics] = useState<ForumTopicListItemJson[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [opening, setOpening] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    const r = await apiFetch<ForumTopicListItemJson[]>("/api/v1/community/forum/topics?take=80", { accessToken: token });
    if (!r.ok) {
      setErr(r.message);
      setTopics([]);
      return;
    }
    setErr(null);
    setTopics(Array.isArray(r.data) ? r.data : []);
  }, [token]);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace(`${routes.login}?returnUrl=${encodeURIComponent(routes.forum)}`);
      return;
    }
    void load();
  }, [ready, token, router, load]);

  async function createTopic(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setErr(null);
    const r = await apiFetch<{ message?: string; topicPublicId?: string }>("/api/v1/community/forum/topics", {
      method: "POST",
      accessToken: token,
      body: JSON.stringify({ title: title.trim(), openingBody: opening.trim() }),
    });
    setBusy(false);
    if (!r.ok) {
      setErr(r.message);
      return;
    }
    setTitle("");
    setOpening("");
    setComposeOpen(false);
    await load();
    const id = r.data && typeof r.data === "object" && r.data.topicPublicId ? String(r.data.topicPublicId) : null;
    if (id) router.push(routes.forumTopic(id));
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
        title="Forum"
        lead="Konulara tıklayarak içeriği okuyun, yanıtlayın ve beğenin. Yeni konu açmak için aşağıdaki düğmeyi kullanın."
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className={cn("text-xs", L ? "text-stone-600" : "text-zinc-500")}>{topics.length} konu</p>
        <button
          type="button"
          onClick={() => setComposeOpen((o) => !o)}
          className={composeOpen ? ps : pn}
          aria-expanded={composeOpen}
        >
          {composeOpen ? "Formu kapat" : "+ Yeni konu aç"}
        </button>
      </div>

      {composeOpen ? (
        <form
          onSubmit={createTopic}
          className={cn(
            "mb-8 space-y-3 rounded-2xl border p-4 shadow-lg sm:p-5",
            L ? "border-orange-200/92 bg-white/97 shadow-[0_14px_44px_-24px_rgba(249,115,22,0.22)]" : "border-white/10 bg-pf-raised/50",
          )}
        >
          {err ? <p className={cn("text-sm", L ? "text-red-800" : "text-red-300")}>{err}</p> : null}
          <div>
            <label className={cn("text-xs font-bold", L ? "text-stone-800" : "text-pf-mist")} htmlFor="ft">
              Başlık
            </label>
            <input
              id="ft"
              required
              maxLength={256}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={cn(
                "mt-1 w-full rounded-xl border px-3 py-2.5 text-sm placeholder:text-zinc-600",
                L ? "border-orange-950/29 bg-white text-stone-900 placeholder:text-stone-500/79" : "border-white/10 bg-pf-void text-white",
              )}
              placeholder="Kısa ve net bir başlık"
            />
          </div>
          <div>
            <label className={cn("text-xs font-bold", L ? "text-stone-800" : "text-pf-mist")} htmlFor="fb">
              Açılış metni
            </label>
            <textarea
              id="fb"
              required
              rows={5}
              maxLength={8000}
              value={opening}
              onChange={(e) => setOpening(e.target.value)}
              className={cn(
                "mt-1 w-full rounded-xl border px-3 py-2.5 text-sm placeholder:text-zinc-600",
                L ? "border-orange-950/29 bg-white text-stone-900 placeholder:text-stone-500/79" : "border-white/10 bg-pf-void text-white",
              )}
              placeholder="Konunu detaylandır…"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={busy} className="rounded-xl bg-pf-orange px-5 py-2 text-sm font-bold text-black disabled:opacity-50">
              {busy ? "Kaydediliyor…" : "Konu aç"}
            </button>
            <button
              type="button"
              onClick={() => setComposeOpen(false)}
              className={cn(
                "rounded-xl border px-4 py-2 text-xs font-semibold",
                L
                  ? "border-orange-950/22 text-stone-700 hover:border-orange-800/53 hover:bg-orange-50 hover:text-orange-950"
                  : "border-white/15 text-zinc-400 hover:text-white",
              )}
            >
              Vazgeç
            </button>
          </div>
        </form>
      ) : err && topics.length === 0 ? (
        <p className={cn("mb-6 text-sm", L ? "text-red-800" : "text-red-300")}>{err}</p>
      ) : null}

      {err && topics.length > 0 ? (
        <p
          className={cn(
            "mb-4 rounded-xl border px-3 py-2 text-sm",
            L ? "border-red-400/75 bg-red-50 text-red-900" : "border-red-500/20 bg-red-500/10 text-red-200",
          )}
        >
          {err}
        </p>
      ) : null}

      <div className="space-y-3">
        {topics.length === 0 && !err ? (
          <div
            className={cn(
              "rounded-2xl border border-dashed px-6 py-14 text-center",
              L ? "border-orange-300/93 bg-orange-50/93" : "border-white/15 bg-pf-void/30",
            )}
          >
            <p className={cn("text-sm", L ? "text-stone-600" : "text-zinc-500")}>Henüz konu yok. İlk konuyu sen aç.</p>
            <button
              type="button"
              onClick={() => setComposeOpen(true)}
              className={cn("mt-4 text-sm font-bold hover:underline", L ? "text-orange-950" : "text-pf-orange-bright")}
            >
              Yeni konu aç
            </button>
          </div>
        ) : null}

        {topics.map((x) => {
          const avatar = resolveMediaUrl(x.authorPhotoUrl);
          const last = x.lastActivityUtc || x.createdAtUtc;
          const created = x.createdAtUtc;
          return (
            <Link
              key={x.publicId}
              href={routes.forumTopic(x.publicId)}
              className={cn(
                "group flex gap-3 rounded-2xl border p-3 transition sm:gap-4 sm:p-4",
                L
                  ? "border-orange-200/92 bg-white/98 shadow-[0_8px_28px_-18px_rgba(249,115,22,0.16)] hover:border-orange-800/34 hover:bg-orange-50/95"
                  : "border-white/10 bg-pf-raised/35 hover:border-pf-orange/30 hover:bg-pf-raised/55",
              )}
            >
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold text-pf-orange-bright ring-1 sm:h-12 sm:w-12",
                  L ? "bg-orange-100 ring-orange-950/16 group-hover:ring-orange-800/52" : "bg-white/10 ring-white/10 group-hover:ring-pf-orange/30",
                )}
              >
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  (x.authorDisplayName || "?")[0]
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2
                  className={cn(
                    "text-[15px] font-bold leading-snug sm:text-base",
                    L ? "text-stone-900 group-hover:text-orange-950" : "text-white group-hover:text-pf-orange-bright",
                  )}
                >
                  {x.title}
                </h2>
                <div className={cn("mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs", L ? "text-stone-600" : "text-zinc-500")}>
                  <span className={cn("font-semibold", L ? "text-stone-800" : "text-zinc-300")}>{x.authorDisplayName}</span>
                  {created ? (
                    <>
                      <span className={cn("hidden sm:inline", L ? "text-stone-500" : "text-zinc-600")}>·</span>
                      <span title="Oluşturulma">{formatWhen(created)}</span>
                    </>
                  ) : null}
                  <span className={cn(L ? "text-stone-500" : "text-zinc-600")}>·</span>
                  <span className="inline-flex items-center gap-1" title="Yanıt sayısı">
                    <IconChatBubble className="h-3.5 w-3.5 opacity-70" />
                    {x.commentCount} yanıt
                  </span>
                  <span className={cn(L ? "text-stone-500" : "text-zinc-600")}>·</span>
                  <span className="inline-flex items-center gap-1" title="Beğeni">
                    <IconHeart filled={false} className="h-3.5 w-3.5 opacity-70" />
                    {x.likeCount}
                  </span>
                  {last && created && last !== created ? (
                    <>
                      <span className={cn(L ? "text-stone-500" : "text-zinc-600")}>·</span>
                      <span className={cn(L ? "text-stone-500" : "text-zinc-600")}>Son hareket {formatWhen(last)}</span>
                    </>
                  ) : null}
                </div>
              </div>
              <div
                className={cn(
                  "hidden shrink-0 self-center transition sm:block",
                  L ? "text-stone-500 group-hover:text-orange-950" : "text-zinc-600 group-hover:text-pf-orange-bright",
                )}
                aria-hidden="true"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
