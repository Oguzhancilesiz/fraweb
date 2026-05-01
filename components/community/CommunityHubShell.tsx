"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api/client";
import { COMMUNITY_FEED_RELOAD_EVENT } from "@/lib/community-hub-events";
import { routes } from "@/lib/site";
import { usePanelTheme } from "@/contexts/PanelThemeContext";
import { cn } from "@/components/dashboard/DashboardUI";
import { resolveNotificationHref } from "@/lib/community-notification-nav";
import { CommunityHubComposeForm } from "./CommunityHubComposeForm";

export type CommunityHubTab = "feed" | "forum" | "coaches" | "mine";

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  url?: string | null;
  isRead: boolean;
  createdAtUtc: string;
};

type NotificationSnapshot = {
  items: NotificationItem[];
  unreadCount: number;
};

const tabs: { id: CommunityHubTab; href: string; label: string }[] = [
  { id: "feed", href: routes.community, label: "Akış" },
  { id: "forum", href: routes.forum, label: "Forum" },
  { id: "coaches", href: routes.coaches, label: "Antrenörler" },
  { id: "mine", href: routes.communityMine, label: "Paylaşımlarım" },
];

function formatNotifTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export function CommunityHubShell({ activeTab, children }: { activeTab: CommunityHubTab; children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, enabled } = usePanelTheme();
  const L = enabled && theme === "light";
  const { token, ready } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<NotificationSnapshot | null>(null);
  const [notifBusy, setNotifBusy] = useState(false);
  const [composeDockOpen, setComposeDockOpen] = useState(false);
  const [composeNotice, setComposeNotice] = useState<string | null>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const [dockPad, setDockPad] = useState(56);

  const loadNotifications = useCallback(async () => {
    if (!token) return;
    const r = await apiFetch<NotificationSnapshot>("/api/v1/community/notifications?take=50", { accessToken: token });
    if (r.ok) setSnapshot(r.data);
  }, [token]);

  useEffect(() => {
    if (!ready || !token) return;
    void loadNotifications();
  }, [ready, token, loadNotifications]);

  useEffect(() => {
    if (activeTab !== "feed") setComposeDockOpen(false);
  }, [activeTab]);

  useEffect(() => {
    if (!composeNotice) return;
    const id = window.setTimeout(() => setComposeNotice(null), 8000);
    return () => window.clearTimeout(id);
  }, [composeNotice]);

  useEffect(() => {
    if (!token) setComposeDockOpen(false);
  }, [token]);

  useLayoutEffect(() => {
    const el = dockRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setDockPad(Math.ceil(el.getBoundingClientRect().height));
    });
    ro.observe(el);
    setDockPad(Math.ceil(el.getBoundingClientRect().height));
    return () => ro.disconnect();
  }, [composeDockOpen, notifOpen, ready, token, activeTab]);

  useEffect(() => {
    if (activeTab !== "feed") return;
    function fromHash() {
      if (typeof window === "undefined") return;
      if (window.location.hash !== "#compose") return;
      setComposeDockOpen(true);
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [activeTab, pathname]);

  async function markRead(id: number) {
    if (!token) return;
    setNotifBusy(true);
    const r = await apiFetch<{ ok: boolean }>("/api/v1/community/notifications/mark-read", {
      method: "POST",
      accessToken: token,
      body: JSON.stringify({ id }),
    });
    setNotifBusy(false);
    if (r.ok) void loadNotifications();
  }

  async function markAllRead() {
    if (!token) return;
    setNotifBusy(true);
    const r = await apiFetch<{ ok: boolean }>("/api/v1/community/notifications/mark-all-read", {
      method: "POST",
      accessToken: token,
    });
    setNotifBusy(false);
    if (r.ok) void loadNotifications();
  }

  const unread = snapshot?.unreadCount ?? 0;

  const showComposeDock = ready && token && activeTab === "feed";

  function broadcastFeedReload(successMessage?: string) {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event(COMMUNITY_FEED_RELOAD_EVENT));
    if (successMessage?.trim()) setComposeNotice(successMessage.trim());
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-3 sm:px-4 lg:px-6">
      <div
        ref={dockRef}
        className={cn(
          "fixed left-0 right-0 top-14 z-[25] border-b backdrop-blur-md lg:left-[280px]",
          L
            ? "border-orange-200/70 bg-orange-50/95 shadow-[0_10px_34px_-14px_rgba(249,115,22,0.18)]"
            : "border-white/10 bg-[#090909]/95 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.75)]",
        )}
      >
        <div className="mx-auto w-full max-w-4xl px-3 py-2.5 sm:px-4 lg:px-6">
          <div
            className={cn(
              "rounded-2xl border px-2.5 py-2 sm:px-3",
              L ? "border-orange-200/80 bg-white/95 shadow-sm" : "border-white/10 bg-[#111111]/85",
            )}
          >
          <div className={cn("flex items-center justify-between gap-2 border-b pb-2", L ? "border-orange-200/72" : "border-white/10")}>
            <p className={cn("text-[11px] font-bold uppercase tracking-[0.18em]", L ? "text-orange-800" : "text-pf-orange-bright")}>Topluluk</p>
            {ready && token ? (
              <div className="relative flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNotifOpen((o) => !o);
                    if (!notifOpen) void loadNotifications();
                  }}
                  className={cn(
                    "relative inline-flex h-8 w-8 items-center justify-center rounded-lg border transition",
                    L
                      ? "border-orange-950/15 bg-white text-stone-700 hover:border-orange-800/35 hover:text-orange-950"
                      : "border-white/10 bg-pf-raised/50 text-zinc-300 hover:border-pf-orange/40 hover:text-white",
                  )}
                  aria-expanded={notifOpen}
                  title="Bildirimler"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M15 18H9m9-6a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
                  </svg>
                  {unread > 0 ? (
                    <span className="absolute -right-1 -top-1 inline-flex min-w-[1rem] justify-center rounded-full bg-pf-orange px-1 text-[10px] font-bold text-black">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  ) : null}
                </button>
                {activeTab === "feed" ? (
                  <button
                    type="button"
                    onClick={() => setComposeDockOpen((o) => !o)}
                    aria-expanded={composeDockOpen}
                    className={cn(
                      "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-semibold transition",
                      L
                        ? "border-orange-800/54 bg-orange-50 text-orange-950 hover:border-orange-950/65 hover:bg-orange-100"
                        : "border-pf-orange/35 bg-pf-orange/10 text-pf-orange-bright hover:border-pf-orange/60 hover:bg-pf-orange/20",
                    )}
                    title="Gönderi paylaş"
                    aria-label="Gönderi paylaş"
                  >
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                    Paylaş
                  </button>
                ) : (
                  <Link
                    href={`${routes.community}#compose`}
                    className={cn(
                      "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-semibold transition",
                      L
                        ? "border-orange-800/54 bg-orange-50 text-orange-950 hover:border-orange-950/65 hover:bg-orange-100"
                        : "border-pf-orange/35 bg-pf-orange/10 text-pf-orange-bright hover:border-pf-orange/60 hover:bg-pf-orange/20",
                    )}
                    title="Gönderi paylaş"
                    aria-label="Gönderi paylaş"
                  >
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                    Paylaş
                  </Link>
                )}
                {notifOpen ? (
                  <>
                    <button type="button" className="fixed inset-0 z-40 cursor-default bg-black/40 lg:hidden" aria-label="Kapat" onClick={() => setNotifOpen(false)} />
                    <div
                      className={cn(
                        "absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] rounded-2xl border shadow-xl",
                        L ? "border-orange-200/80 bg-white" : "border-white/10 bg-pf-raised",
                      )}
                    >
                      <div className={cn("flex items-center justify-between border-b px-3 py-2", L ? "border-orange-200/70" : "border-white/10")}>
                        <span className={cn("text-xs font-bold", L ? "text-stone-900" : "text-white")}>Bildirimler</span>
                        <button
                          type="button"
                          disabled={notifBusy || !snapshot?.items.some((i) => !i.isRead)}
                          onClick={() => void markAllRead()}
                          className={cn("text-[10px] font-semibold disabled:opacity-40", L ? "text-orange-900 hover:underline" : "text-pf-orange-bright")}
                        >
                          Tümünü okundu
                        </button>
                      </div>
                      <ul className="max-h-[min(70vh,24rem)] overflow-y-auto p-2">
                        {!snapshot?.items.length ? (
                          <li className={cn("px-2 py-6 text-center text-xs", L ? "text-stone-600" : "text-zinc-500")}>Bildirim yok.</li>
                        ) : (
                          snapshot.items.map((n) => {
                            const raw = n.url?.trim() ?? "";
                            const resolved = raw ? resolveNotificationHref(raw) : null;
                            const external = resolved?.startsWith("http://") || resolved?.startsWith("https://");
                            const markAndClose = () => {
                              if (!n.isRead) void markRead(n.id);
                              setNotifOpen(false);
                            };
                            return (
                              <li
                                key={n.id}
                                className={cn(
                                  "mb-1 rounded-xl border border-transparent",
                                  L ? "hover:border-orange-200/90 hover:bg-orange-50/92" : "hover:border-white/10 hover:bg-pf-void/40",
                                )}
                              >
                                {resolved && !external ? (
                                  <Link
                                    href={resolved}
                                    className="block px-2 py-2 text-left"
                                    onClick={() => {
                                      markAndClose();
                                    }}
                                  >
                                    <NotifRow n={n} />
                                  </Link>
                                ) : resolved && external ? (
                                  <a
                                    href={resolved}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block px-2 py-2 text-left"
                                    onClick={() => {
                                      markAndClose();
                                    }}
                                  >
                                    <NotifRow n={n} />
                                  </a>
                                ) : (
                                  <button
                                    type="button"
                                    className="w-full px-2 py-2 text-left"
                                    onClick={() => {
                                      if (!n.isRead) void markRead(n.id);
                                    }}
                                  >
                                    <NotifRow n={n} />
                                  </button>
                                )}
                              </li>
                            );
                          })
                        )}
                      </ul>
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="pt-2">
            <nav className="flex gap-1.5 overflow-x-auto pb-1" aria-label="Topluluk">
              {tabs.map((t) => {
                const active = t.id === activeTab;
                return (
                  <Link
                    key={t.id}
                    href={t.href}
                    className={
                      active
                        ? "whitespace-nowrap rounded-full bg-gradient-to-r from-pf-orange-bright to-[#ec4899] px-3 py-1.5 text-xs font-bold text-black"
                        : L
                          ? "whitespace-nowrap rounded-full border border-orange-800/24 bg-white/90 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:border-orange-800/45 hover:bg-orange-50 hover:text-orange-950"
                          : "whitespace-nowrap rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-400 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
                    }
                  >
                    {t.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          </div>
        </div>
        {showComposeDock && composeDockOpen && token ? (
          <CommunityHubComposeForm
            token={token}
            onClose={() => setComposeDockOpen(false)}
            onPosted={broadcastFeedReload}
          />
        ) : null}
      </div>
      {composeNotice ? (
        <div className="pointer-events-none fixed left-1/2 top-[4.75rem] z-[60] w-[min(100%-1.5rem,28rem)] -translate-x-1/2 px-0">
          <div
            className={cn(
              "pointer-events-auto rounded-2xl border px-4 py-3 text-center text-xs shadow-xl backdrop-blur-md",
              L ? "border-amber-800/35 bg-amber-50/98 text-amber-950" : "border-amber-500/35 bg-[#111]/95 text-amber-50",
            )}
          >
            {composeNotice}
          </div>
        </div>
      ) : null}
      <div className="pb-8" style={{ paddingTop: dockPad }}>
        {children}
      </div>
    </div>
  );
}

function NotifRow({ n }: { n: NotificationItem }) {
  const { theme, enabled } = usePanelTheme();
  const L = enabled && theme === "light";
  return (
    <>
      <p
        className={cn(
          "text-xs font-semibold",
          n.isRead ? (L ? "text-stone-600" : "text-zinc-400") : L ? "text-stone-900" : "text-white",
        )}
      >
        {n.title}
      </p>
      <p className={cn("mt-0.5 line-clamp-2 text-[11px]", L ? "text-stone-600" : "text-zinc-500")}>{n.message}</p>
      <p className={cn("mt-1 text-[10px]", L ? "text-stone-500" : "text-zinc-600")}>{formatNotifTime(n.createdAtUtc)}</p>
    </>
  );
}
