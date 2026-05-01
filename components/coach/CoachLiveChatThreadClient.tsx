"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api/client";
import { getPublicApiBaseUrl } from "@/lib/api/config";
import { canAccessCoachArea, primaryDashboardPath } from "@/lib/auth/paths";
import { routes } from "@/lib/site";
import type { LiveChatOlderMessagesPageJson } from "@/lib/api/types-dashboard";
import { LiveChatThreadLayout, OLDER_PAGE_SIZE, type LiveChatMessageRowJson } from "@/components/chat/LiveChatThreadLayout";
import { ErrorState, LoadingState } from "@/components/dashboard/DashboardUI";

type ThreadJson = {
  studentPackageId: number;
  studentUserId: string;
  studentDisplayName: string;
  chatEnabled: boolean;
  disabledReason?: string | null;
  coachMaySend: boolean;
  studentMaySend: boolean;
  studentMessagesUsed: number;
  studentMessagesQuota: number;
  studentImagesUsed: number;
  studentImagesQuota: number;
  hasMoreOlderMessages?: boolean;
  messages: LiveChatMessageRowJson[];
};

function sortMessages(rows: LiveChatMessageRowJson[]) {
  return rows.slice().sort((a, b) => new Date(a.createdAtUtc).getTime() - new Date(b.createdAtUtc).getTime() || a.id - b.id);
}

export function CoachLiveChatThreadClient({ packageId }: { packageId: string }) {
  const router = useRouter();
  const { token, ready, user } = useAuth();
  const [thread, setThread] = useState<ThreadJson | null>(null);
  const [messages, setMessages] = useState<LiveChatMessageRowJson[]>([]);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    const r = await apiFetch<ThreadJson>(`/api/v1/coach/live-chat/threads/${packageId}`, { accessToken: token });
    if (!r.ok) {
      setErr(r.message);
      setThread(null);
      setMessages([]);
      return;
    }
    setErr(null);
    setThread(r.data);
    setMessages(sortMessages(r.data.messages));
    setHasMoreOlder(r.data.hasMoreOlderMessages ?? false);
  }, [token, packageId]);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace(`${routes.login}?returnUrl=${encodeURIComponent(`${routes.coachLiveChat}/${packageId}`)}`);
      return;
    }
    if (!canAccessCoachArea(user?.roles)) {
      router.replace(primaryDashboardPath(user?.roles ?? []) ?? routes.home);
      return;
    }
    let c = false;
    void (async () => {
      setLoading(true);
      await load();
      if (!c) setLoading(false);
    })();
    return () => {
      c = true;
    };
  }, [ready, token, user, router, load, packageId]);

  const fetchOlderPage = useCallback(
    async (beforeId: number) => {
      if (!token) return null;
      const r = await apiFetch<LiveChatOlderMessagesPageJson>(
        `/api/v1/coach/live-chat/threads/${encodeURIComponent(packageId)}/messages/before?beforeId=${beforeId}&take=${OLDER_PAGE_SIZE}`,
        { accessToken: token },
      );
      if (!r.ok) return null;
      return { messages: sortMessages(r.data.messages as LiveChatMessageRowJson[]), hasMore: r.data.hasMore };
    },
    [token, packageId],
  );

  const onSend = useCallback(
    async (text: string, files: File[]) => {
      if (!token) return { ok: false, error: "Oturum kapalı." };
      const fd = new FormData();
      fd.set("studentPackageId", packageId);
      if (text.trim()) fd.set("bodyText", text.trim());
      for (const f of files) fd.append("files", f);
      const res = await fetch(`${getPublicApiBaseUrl()}/api/v1/coach/live-chat/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const raw = (await res.json()) as {
        success?: boolean;
        Success?: boolean;
        errorMessage?: string;
        message?: LiveChatMessageRowJson;
      };
      const ok = raw.success ?? raw.Success;
      if (!res.ok || !ok) {
        return { ok: false, error: raw.errorMessage ?? `Gönderilemedi (${res.status})` };
      }
      const appended = raw.message;
      if (appended) setMessages((prev) => [...prev, appended]);
      const sync = await apiFetch<ThreadJson>(`/api/v1/coach/live-chat/threads/${packageId}`, { accessToken: token });
      if (sync.ok && sync.data) {
        const d = sync.data;
        setThread((prev) =>
          prev
            ? {
                ...prev,
                coachMaySend: d.coachMaySend,
                studentMaySend: d.studentMaySend,
                studentMessagesUsed: d.studentMessagesUsed,
                studentImagesUsed: d.studentImagesUsed,
                studentMessagesQuota: d.studentMessagesQuota,
                studentImagesQuota: d.studentImagesQuota,
                chatEnabled: d.chatEnabled,
                disabledReason: d.disabledReason,
                hasMoreOlderMessages: d.hasMoreOlderMessages,
              }
            : d,
        );
        setHasMoreOlder(sync.data.hasMoreOlderMessages ?? false);
      }
      return { ok: true };
    },
    [token, packageId],
  );

  const buildAttachmentUrl = useCallback(
    (attachmentId: number) => `${getPublicApiBaseUrl()}/api/v1/coach/live-chat/attachments/${attachmentId}`,
    [],
  );

  const prepend = useCallback((older: LiveChatMessageRowJson[]) => {
    setMessages((prev) => [...older, ...prev]);
  }, []);

  if (!ready || loading) {
    return <LoadingState label="Sohbet yükleniyor..." />;
  }

  if (err && !thread) {
    return (
      <div className="py-10">
        <ErrorState message={err} />
        <Link href={routes.coachLiveChat} className="mt-4 inline-block text-sm text-pf-orange-bright">
          ← Gelen kutusu
        </Link>
      </div>
    );
  }

  if (!thread) return null;

  const quota =
    thread.studentMessagesQuota === -1 ? (
      <span>
        Öğrenci mesajı: sınırsız kullanım · Görsel:{" "}
        <span className="text-zinc-200">
          {thread.studentImagesQuota <= 0 ? "yok" : `${Math.max(0, thread.studentImagesQuota - thread.studentImagesUsed)}/${thread.studentImagesQuota} kalan`}
        </span>
      </span>
    ) : (
      <span>
        Öğrenci mesajı:{" "}
        <span className="text-zinc-200">
          {Math.max(0, thread.studentMessagesQuota - thread.studentMessagesUsed)}/{thread.studentMessagesQuota} kalan
        </span>{" "}
        · Görsel:{" "}
        <span className="text-zinc-200">
          {thread.studentImagesQuota <= 0 ? "yok" : `${Math.max(0, thread.studentImagesQuota - thread.studentImagesUsed)}/${thread.studentImagesQuota} kalan`}
        </span>
      </span>
    );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-2 pb-2">
      <div className="shrink-0 lg:hidden">
        <div className="rounded-xl border border-white/10 bg-pf-raised/50 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-pf-orange-bright">Koç paneli</p>
          <h2 className="font-display text-base font-bold text-white">Canlı sohbet</h2>
          <p className="mt-1 line-clamp-2 text-xs text-zinc-400">
            Mesaj listesini kaydırarak geçmişe gidin; yeşil balonlar sizin, gri balonlar öğrencinindir.
          </p>
        </div>
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <LiveChatThreadLayout
          key={packageId}
          variant="coach"
          peerName={thread.studentDisplayName}
          peerSubtitle="Öğrenci · Canlı sohbet"
          quotaSummary={quota}
          messages={messages}
          hasMoreOlder={hasMoreOlder}
          onHasMoreOlderChange={setHasMoreOlder}
          onPrependMessages={prepend}
          fetchOlderPage={fetchOlderPage}
          chatEnabled={thread.chatEnabled}
          disabledReason={thread.disabledReason}
          maySend={thread.coachMaySend}
          onSend={onSend}
          buildAttachmentUrl={buildAttachmentUrl}
          accessToken={token}
          backLink={{ href: routes.coachLiveChat, label: "← Gelen kutusu" }}
        />
      </div>
      <div className="shrink-0 pb-1 text-center">
        <Link href={`${routes.coachStudents}/${thread.studentUserId}`} className="text-xs font-medium text-pf-orange-bright hover:underline">
          Öğrenci profiline git
        </Link>
      </div>
    </div>
  );
}
