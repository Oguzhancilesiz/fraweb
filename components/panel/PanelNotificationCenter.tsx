"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { usePanelTheme } from "@/contexts/PanelThemeContext";
import { cn } from "@/components/dashboard/DashboardUI";
import { apiFetch } from "@/lib/api/client";
import { resolveNotificationHref } from "@/lib/community-notification-nav";
import { routes } from "@/lib/site";

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

type CoachInboxRow = {
  studentPackageId: number;
  studentDisplayName: string;
  unreadCount: number;
};

type StudentThreadJson = {
  messages?: Array<{ id: number; senderIsCoach: boolean }>;
};

type ToastItem = {
  id: number;
  title: string;
  body: string;
  href: string;
};

function isExternalHref(href: string) {
  return href.startsWith("http://") || href.startsWith("https://");
}

export function PanelNotificationCenter({
  variant,
  pathname,
  onChatUnreadChange,
}: {
  variant: "coach" | "student" | "admin";
  pathname: string;
  onChatUnreadChange?: (count: number) => void;
}) {
  const { token } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<NotificationSnapshot | null>(null);
  const [chatUnread, setChatUnread] = useState(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const prevNotifUnread = useRef<number | null>(null);
  const prevCoachMsgId = useRef<number | null>(null);
  const toastSeq = useRef(1);

  const pushToast = useCallback((title: string, body: string, href: string) => {
    const id = toastSeq.current++;
    setToasts((prev) => [...prev, { id, title, body, href }].slice(-3));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const markRead = useCallback(
    async (id: number) => {
      if (!token) return;
      const r = await apiFetch<{ ok: boolean }>("/api/v1/community/notifications/mark-read", {
        method: "POST",
        accessToken: token,
        body: JSON.stringify({ id }),
      });
      if (r.ok) {
        setSnapshot((prev) => {
          if (!prev) return prev;
          const nextItems = prev.items.map((n) => (n.id === id ? { ...n, isRead: true } : n));
          const unreadCount = nextItems.filter((n) => !n.isRead).length;
          return { items: nextItems, unreadCount };
        });
      }
    },
    [token],
  );

  const poll = useCallback(async () => {
    if (!token) return;
    const notifRes = await apiFetch<NotificationSnapshot>("/api/v1/community/notifications?take=20", { accessToken: token });
    if (notifRes.ok) {
      setSnapshot(notifRes.data);
      const unread = notifRes.data.unreadCount ?? 0;
      if (prevNotifUnread.current != null && unread > prevNotifUnread.current) {
        const newest = (notifRes.data.items ?? []).find((n) => !n.isRead);
        if (newest) {
          const href = resolveNotificationHref(newest.url) ?? routes.community;
          pushToast(newest.title || "Yeni bildirim", newest.message || "Toplulukta yeni bir bildirim var.", href);
        }
      }
      prevNotifUnread.current = unread;
    }

    if (variant === "coach") {
      const inboxRes = await apiFetch<CoachInboxRow[]>("/api/v1/coach/live-chat/inbox", { accessToken: token });
      if (inboxRes.ok) {
        const rows = Array.isArray(inboxRes.data) ? inboxRes.data : [];
        const unread = rows.reduce((acc, r) => acc + Math.max(0, r.unreadCount || 0), 0);
        if (chatUnread !== unread && unread > chatUnread) {
          const hit = rows.find((r) => r.unreadCount > 0);
          if (hit && !pathname.startsWith(routes.coachLiveChat)) {
            pushToast("Yeni canlı sohbet mesajı", `${hit.studentDisplayName} yeni mesaj gönderdi.`, `${routes.coachLiveChat}/${hit.studentPackageId}`);
          }
        }
        setChatUnread(unread);
      }
    } else if (variant === "student") {
      const threadRes = await apiFetch<StudentThreadJson | null>("/api/v1/student/live-chat/thread", { accessToken: token });
      if (threadRes.ok && threadRes.data?.messages?.length) {
        const latestCoachMsg = [...threadRes.data.messages]
          .filter((m) => m.senderIsCoach)
          .sort((a, b) => b.id - a.id)[0];
        if (latestCoachMsg) {
          if (prevCoachMsgId.current != null && latestCoachMsg.id > prevCoachMsgId.current && pathname !== routes.studentLiveChat) {
            setChatUnread((c) => c + 1);
            pushToast("Koçtan yeni mesaj", "Canlı sohbette yeni mesajın var.", routes.studentLiveChat);
          }
          prevCoachMsgId.current = latestCoachMsg.id;
        }
      }
      if (pathname === routes.studentLiveChat && chatUnread > 0) {
        setChatUnread(0);
      }
    } else {
      setChatUnread(0);
    }
  }, [token, variant, pathname, pushToast, chatUnread]);

  useEffect(() => {
    onChatUnreadChange?.(chatUnread);
  }, [chatUnread, onChatUnreadChange]);

  useEffect(() => {
    if (!token) return;
    void poll();
    const timer = setInterval(() => {
      void poll();
    }, 10000);
    return () => clearInterval(timer);
  }, [token, poll]);

  const unread = snapshot?.unreadCount ?? 0;
  const unreadTotal = unread + chatUnread;
  const notificationItems = useMemo(() => snapshot?.items ?? [], [snapshot]);
  const { theme, enabled } = usePanelTheme();
  const panelLight = enabled && theme === "light";

  return (
    <>
      <div className="relative">
        <button
          type="button"
          aria-label="Bildirimler"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "relative inline-flex h-9 w-9 items-center justify-center rounded-xl border transition",
            panelLight
              ? "border-orange-900/19 text-orange-950 hover:bg-orange-950/[0.04]"
              : "border-white/15 text-zinc-300 hover:bg-white/5",
          )}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M15 18H9m9-6a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
          </svg>
          {unreadTotal > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex min-w-[1rem] justify-center rounded-full bg-pf-orange-bright px-1 text-[10px] font-bold text-black">
              {unreadTotal > 99 ? "99+" : unreadTotal}
            </span>
          ) : null}
        </button>
        {open ? (
          <div
            className={cn(
              "absolute right-0 z-50 mt-2 w-[min(92vw,22rem)] rounded-2xl border p-2 shadow-2xl",
              panelLight
                ? "border-orange-950/13 bg-orange-50/97 backdrop-blur-md"
                : "border-white/10 bg-[#111111]",
            )}
          >
            <div className="mb-2 flex items-center justify-between px-2">
              <p className={cn("text-xs font-semibold", panelLight ? "text-stone-900" : "text-zinc-100")}>Bildirimler</p>
              {chatUnread > 0 ? (
                <span className={cn("text-[11px]", panelLight ? "text-orange-950 font-semibold" : "text-pf-orange-bright")}>
                  Sohbet: {chatUnread}
                </span>
              ) : null}
            </div>
            <ul className="max-h-[22rem] space-y-1 overflow-y-auto">
              {notificationItems.length === 0 ? (
                <li className={cn("rounded-xl px-3 py-6 text-center text-xs", panelLight ? "text-stone-600" : "text-zinc-500")}>Yeni bildirim yok.</li>
              ) : null}
              {notificationItems.map((n) => {
                const href = resolveNotificationHref(n.url) ?? routes.community;
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!n.isRead) await markRead(n.id);
                        setOpen(false);
                        if (isExternalHref(href)) window.location.href = href;
                        else router.push(href);
                      }}
                      className={cn(
                        "w-full rounded-xl border border-transparent px-3 py-2 text-left transition",
                        panelLight
                          ? "hover:border-orange-800/27 hover:bg-white/71"
                          : "hover:border-white/10 hover:bg-white/5",
                      )}
                    >
                      <p
                        className={cn(
                          "text-xs font-semibold",
                          n.isRead
                            ? panelLight
                              ? "text-stone-600"
                              : "text-zinc-300"
                            : panelLight
                              ? "text-stone-900"
                              : "text-white",
                        )}
                      >
                        {n.title}
                      </p>
                      <p className={cn("mt-0.5 line-clamp-2 text-[11px]", panelLight ? "text-stone-600" : "text-zinc-500")}>{n.message}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="pointer-events-none fixed inset-x-0 top-3 z-[80] flex flex-col items-center gap-2 px-3">
        {toasts.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              if (isExternalHref(t.href)) window.location.href = t.href;
              else router.push(t.href);
              setToasts((prev) => prev.filter((x) => x.id !== t.id));
            }}
            className={cn(
              "pointer-events-auto w-full max-w-md rounded-2xl border px-4 py-3 text-left shadow-2xl backdrop-blur",
              panelLight ? "border-orange-950/16 bg-orange-50/93" : "border-white/15 bg-[#111111]/95",
            )}
          >
            <p className={cn("text-xs font-semibold", panelLight ? "text-orange-950" : "text-pf-orange-bright")}>{t.title}</p>
            <p className={cn("mt-0.5 text-xs", panelLight ? "text-stone-800" : "text-zinc-300")}>{t.body}</p>
          </button>
        ))}
      </div>
    </>
  );
}
