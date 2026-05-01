"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { primaryDashboardPath } from "@/lib/auth/paths";
import { getPublicApiBaseUrl } from "@/lib/api/config";
import { PageHeader } from "@/components/PageHeader";
import { routes } from "@/lib/site";
import type { LiveChatOlderMessagesPageJson, StudentLiveChatThreadJson } from "@/lib/api/types-dashboard";
import { LiveChatThreadLayout, OLDER_PAGE_SIZE, type LiveChatMessageRowJson } from "@/components/chat/LiveChatThreadLayout";
import { DashboardShell, EmptyState, ErrorState, LoadingState, SectionCard } from "@/components/dashboard/DashboardUI";

function sortMessages(rows: LiveChatMessageRowJson[]) {
  return rows.slice().sort((a, b) => new Date(a.createdAtUtc).getTime() - new Date(b.createdAtUtc).getTime() || a.id - b.id);
}

function quotaSummaryNode(t: StudentLiveChatThreadJson) {
  const mq = t.studentMessagesQuota;
  const miq = t.studentImagesQuota;
  const msgLeft = mq === -1 ? "Sınırsız" : `${Math.max(0, mq - t.studentMessagesUsed)}/${mq} kalan`;
  const imgLeft = miq <= 0 ? "tanımsız" : `${Math.max(0, miq - t.studentImagesUsed)}/${miq} kalan`;
  return (
    <span>
      Mesaj: <span className="text-zinc-200">{msgLeft}</span> · Görsel: <span className="text-zinc-200">{imgLeft}</span>
    </span>
  );
}

export function StudentLiveChatClient() {
  const router = useRouter();
  const { token, ready, user } = useAuth();
  const [thread, setThread] = useState<StudentLiveChatThreadJson | null>(null);
  const [messages, setMessages] = useState<LiveChatMessageRowJson[]>([]);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const loadThread = useCallback(async () => {
    if (!token) return;
    const r = await apiFetch<StudentLiveChatThreadJson | null>("/api/v1/student/live-chat/thread", { accessToken: token });
    if (!r.ok) {
      setErr(r.message);
      setThread(null);
      setMessages([]);
      return;
    }
    setErr(null);
    setThread(r.data);
    if (r.data?.messages) {
      setMessages(sortMessages(r.data.messages as LiveChatMessageRowJson[]));
      setHasMoreOlder(r.data.hasMoreOlderMessages ?? false);
    } else {
      setMessages([]);
      setHasMoreOlder(false);
    }
  }, [token]);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace(`${routes.login}?returnUrl=${encodeURIComponent(routes.studentLiveChat)}`);
      return;
    }
    if (!user?.roles?.includes("Student")) {
      router.replace(primaryDashboardPath(user?.roles ?? []) ?? routes.home);
      return;
    }
    let cancel = false;
    void (async () => {
      setLoading(true);
      await loadThread();
      if (!cancel) setLoading(false);
    })();
    return () => {
      cancel = true;
    };
  }, [ready, token, user, router, loadThread]);

  const fetchOlderPage = useCallback(
    async (beforeId: number) => {
      if (!token) return null;
      const r = await apiFetch<LiveChatOlderMessagesPageJson>(
        `/api/v1/student/live-chat/messages/before?beforeId=${beforeId}&take=${OLDER_PAGE_SIZE}`,
        { accessToken: token },
      );
      if (!r.ok) return null;
      return { messages: sortMessages(r.data.messages as LiveChatMessageRowJson[]), hasMore: r.data.hasMore };
    },
    [token],
  );

  const onSend = useCallback(
    async (text: string, files: File[]) => {
      if (!token) return { ok: false, error: "Oturum kapalı." };
      const fd = new FormData();
      if (text.trim()) fd.append("bodyText", text.trim());
      for (const f of files) fd.append("files", f);
      const res = await fetch(`${getPublicApiBaseUrl()}/api/v1/student/live-chat/messages`, {
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
      const sync = await apiFetch<StudentLiveChatThreadJson | null>("/api/v1/student/live-chat/thread", { accessToken: token });
      if (sync.ok && sync.data) {
        const d = sync.data;
        setThread((prev) =>
          prev
            ? {
                ...prev,
                studentMessagesUsed: d.studentMessagesUsed,
                studentImagesUsed: d.studentImagesUsed,
                studentMaySend: d.studentMaySend,
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
    [token],
  );

  const buildAttachmentUrl = useCallback((attachmentId: number) => `${getPublicApiBaseUrl()}/api/v1/student/live-chat/attachments/${attachmentId}`, []);

  const prepend = useCallback((older: LiveChatMessageRowJson[]) => {
    setMessages((prev) => [...older, ...prev]);
  }, []);

  if (!ready || loading) return <LoadingState label="Canlı sohbet hazırlanıyor..." />;
  if (err) {
    return <ErrorState message={err} />;
  }

  if (!thread) {
    return (
      <DashboardShell className="py-2">
        <PageHeader
          eyebrow="Öğrenci paneli"
          title="Canlı sohbet"
          lead="Aktif paketin ve canlı sohbet hakkın olduğunda koçunla buradan yazışırsın."
        />
        <SectionCard>
          <EmptyState title="Aktif sohbet bulunamadı" message="Canlı sohbet hakkı olan aktif paketin olduğunda bu alanda konuşma başlatabilirsin." />
        </SectionCard>
      </DashboardShell>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-2 pb-2 lg:gap-4">
      <div className="shrink-0 lg:hidden">
        <div className="rounded-xl border border-white/10 bg-pf-raised/50 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-pf-orange-bright">Öğrenci paneli</p>
          <h2 className="font-display text-base font-bold text-white">Canlı sohbet</h2>
          <p className="mt-1 line-clamp-2 text-xs text-zinc-400">
            Sohbetin ortasındaki alanı kaydırarak geçmişe gidin; en üstte &quot;Geçmiş mesajları yükle&quot; de kullanılabilir. Aşağıdan metin veya görsel gönderin.
          </p>
        </div>
      </div>
      <div className="hidden shrink-0 lg:block">
        <PageHeader
          eyebrow="Öğrenci paneli"
          title="Canlı sohbet"
          lead="Koçunla WhatsApp benzeri akış: yukarı kaydırarak geçmiş mesajları yükleyebilir, metin ve görsel gönderebilirsin."
        />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <LiveChatThreadLayout
          key={thread.studentPackageId}
          variant="student"
          peerName={thread.coachDisplayName || "Koç"}
          peerSubtitle="Koçun · Canlı sohbet"
          quotaSummary={quotaSummaryNode(thread)}
          messages={messages}
          hasMoreOlder={hasMoreOlder}
          onHasMoreOlderChange={setHasMoreOlder}
          onPrependMessages={prepend}
          fetchOlderPage={fetchOlderPage}
          chatEnabled={thread.chatEnabled}
          disabledReason={thread.disabledReason}
          maySend={thread.studentMaySend}
          onSend={onSend}
          buildAttachmentUrl={buildAttachmentUrl}
          accessToken={token}
        />
      </div>
    </div>
  );
}
