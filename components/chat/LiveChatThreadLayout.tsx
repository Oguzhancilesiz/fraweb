"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";

const MAX_BODY_CHARS = 4000;
const MAX_IMAGES_PER_MESSAGE = 3;
const OLDER_PAGE_SIZE = 40;

export type LiveChatMessageRowJson = {
  id: number;
  senderIsCoach: boolean;
  bodyText?: string | null;
  createdAtUtc: string;
  attachments: Array<{ id: number; fileName?: string; contentType?: string }>;
};

export type LiveChatOlderPageJson = {
  messages: LiveChatMessageRowJson[];
  hasMore: boolean;
};

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0]!.slice(0, 2).toUpperCase();
  return (p[0]![0]! + p[p.length - 1]![0]!).toUpperCase();
}

function fmtTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

/** Balon içi — mobilde daha sade. */
function fmtTimeShort(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function isImageType(ct: string | undefined) {
  if (!ct) return false;
  return ct.startsWith("image/");
}

function ChatImageThumb({
  url,
  alt,
  accessToken,
}: {
  url: string;
  alt: string;
  accessToken: string | null;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let obj: string | null = null;
    void (async () => {
      try {
        const headers: Record<string, string> = { Accept: "image/*,*/*" };
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
        const r = await fetch(url, { headers });
        if (!r.ok || cancelled) throw new Error("fetch");
        const b = await r.blob();
        if (cancelled) return;
        obj = URL.createObjectURL(b);
        setBlobUrl(obj);
        setErr(false);
      } catch {
        if (!cancelled) setErr(true);
      }
    })();
    return () => {
      cancelled = true;
      if (obj) URL.revokeObjectURL(obj);
    };
  }, [url, accessToken]);

  if (err) return <p className="text-[11px] text-red-300">Önizleme açılamadı</p>;
  if (!blobUrl) return <p className="text-[11px] text-zinc-500">Yükleniyor…</p>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={blobUrl} alt={alt} className="mt-1 max-h-48 max-w-full rounded-lg object-contain" />;
}

export type LiveChatThreadLayoutProps = {
  variant: "student" | "coach";
  peerName: string;
  peerSubtitle: string;
  /** Mesaj / görsel kotası (öğrenci tarafı) veya kısa durum metni */
  quotaSummary?: ReactNode;
  messages: LiveChatMessageRowJson[];
  hasMoreOlder: boolean;
  onHasMoreOlderChange: (v: boolean) => void;
  onPrependMessages: (older: LiveChatMessageRowJson[]) => void;
  fetchOlderPage: (beforeId: number) => Promise<LiveChatOlderPageJson | null>;
  chatEnabled: boolean;
  disabledReason?: string | null;
  maySend: boolean;
  onSend: (text: string, files: File[]) => Promise<{ ok: boolean; error?: string; appendedMessage?: LiveChatMessageRowJson }>;
  buildAttachmentUrl: (attachmentId: number) => string;
  accessToken: string | null;
  backLink?: { href: string; label: string };
};

export function LiveChatThreadLayout({
  variant,
  peerName,
  peerSubtitle,
  quotaSummary,
  messages,
  hasMoreOlder,
  onHasMoreOlderChange,
  onPrependMessages,
  fetchOlderPage,
  chatEnabled,
  disabledReason,
  maySend,
  onSend,
  buildAttachmentUrl,
  accessToken,
  backLink,
}: LiveChatThreadLayoutProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevFirstId = useRef<number | null>(null);
  const prevLastId = useRef<number | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadOlderCooldown = useRef(0);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const didSnapToLatest = useRef(false);

  const isPeerMessage = useCallback((m: LiveChatMessageRowJson) => (variant === "student" ? m.senderIsCoach : !m.senderIsCoach), [variant]);
  const peerBubbleLabel = variant === "student" ? "Koç" : "Öğrenci";
  const selfBubbleLabel = "Sen";

  /** İlk açılışta en alta kaydır; böylece üst gözlemcisi yanlışlıkla geçmiş yüklemez. */
  useLayoutEffect(() => {
    if (messages.length === 0) return;
    if (didSnapToLatest.current) return;
    didSnapToLatest.current = true;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  useLayoutEffect(() => {
    if (messages.length === 0) return;
    const firstId = messages[0]!.id;
    if (prevFirstId.current !== null && firstId < prevFirstId.current) {
      const el = scrollRef.current;
      if (el) {
        const prevH = el.scrollHeight;
        const prevTop = el.scrollTop;
        requestAnimationFrame(() => {
          const el2 = scrollRef.current;
          if (!el2) return;
          el2.scrollTop = el2.scrollHeight - prevH + prevTop;
        });
      }
    }
    prevFirstId.current = firstId;
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) return;
    const lastId = messages[messages.length - 1]!.id;
    if (prevLastId.current !== null && lastId > prevLastId.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevLastId.current = lastId;
  }, [messages]);

  const tryLoadOlder = useCallback(async () => {
    if (!hasMoreOlder || loadingOlder || messages.length === 0) return;
    if (Date.now() - loadOlderCooldown.current < 600) return;
    const beforeId = messages[0]!.id;
    setLoadingOlder(true);
    loadOlderCooldown.current = Date.now();
    try {
      const page = await fetchOlderPage(beforeId);
      if (page && page.messages.length > 0) {
        onPrependMessages(page.messages);
        onHasMoreOlderChange(page.hasMore);
      } else if (page) {
        onHasMoreOlderChange(page.hasMore);
      }
    } finally {
      setLoadingOlder(false);
    }
  }, [hasMoreOlder, loadingOlder, messages, fetchOlderPage, onPrependMessages, onHasMoreOlderChange]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop < 140) void tryLoadOlder();
  }, [tryLoadOlder]);

  /** Mobilde kaydırma bazen `scroll` olayını seyrek verir; üst gözlemcisi geçmiş yüklemeyi güçlendirir. */
  useEffect(() => {
    const root = scrollRef.current;
    const target = topSentinelRef.current;
    if (!root || !target || !hasMoreOlder) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) void tryLoadOlder();
      },
      { root, rootMargin: "100px 0px 0px 0px", threshold: 0 },
    );
    io.observe(target);
    return () => io.disconnect();
  }, [hasMoreOlder, tryLoadOlder, messages.length]);

  const send = async () => {
    const t = text.trim();
    if (!t && files.length === 0) return;
    setSending(true);
    setSendErr(null);
    const r = await onSend(t, files);
    setSending(false);
    if (!r.ok) {
      setSendErr(r.error ?? "Gönderilemedi.");
      return;
    }
    setText("");
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onPickFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const next = [...files];
    for (let i = 0; i < list.length && next.length < MAX_IMAGES_PER_MESSAGE; i++) {
      next.push(list[i]!);
    }
    setFiles(next);
  };

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#0c1017] to-[#070b12] shadow-[0_20px_40px_-20px_rgba(0,0,0,0.8)] sm:rounded-3xl">
      <header className="flex shrink-0 items-center gap-2 border-b border-white/10 bg-[#111827]/85 px-2.5 py-2 backdrop-blur sm:gap-3 sm:px-4 sm:py-3">
        {backLink ? (
          <Link
            href={backLink.href}
            className="shrink-0 rounded-lg px-1.5 py-1 text-[11px] font-medium text-emerald-200/90 hover:bg-white/5 hover:underline sm:px-0 sm:py-0 sm:text-sm"
          >
            {backLink.label}
          </Link>
        ) : null}
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-pf-orange/40 bg-gradient-to-br from-pf-orange/90 to-[#ec4899]/80 text-xs font-bold text-black shadow-[0_0_24px_rgba(249,115,22,0.35)] sm:h-11 sm:w-11 sm:text-sm"
          aria-hidden
        >
          {initials(peerName)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-sm font-semibold text-white sm:text-base md:text-lg">{peerName}</h1>
          <p className="truncate text-[11px] text-emerald-100/80 sm:text-xs">{peerSubtitle}</p>
          {quotaSummary ? (
            <div className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-zinc-400 sm:mt-1 sm:text-[11px] sm:line-clamp-none">{quotaSummary}</div>
          ) : null}
        </div>
      </header>

      {!chatEnabled && disabledReason ? (
        <div className="shrink-0 border-b border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">{disabledReason}</div>
      ) : null}

      <div
        ref={scrollRef}
        onScroll={onScroll}
        role="log"
        aria-label="Sohbet mesajları — geçmiş için yukarı kaydırın"
        className="chat-scrollbar relative min-h-0 flex-1 touch-pan-y space-y-3 overflow-y-auto overflow-x-hidden overscroll-y-contain bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.08),transparent_35%),linear-gradient(180deg,#090f18,#070b12)] px-2 py-2 [-webkit-overflow-scrolling:touch] sm:space-y-2.5 sm:px-4 sm:py-3"
      >
        <div ref={topSentinelRef} className="pointer-events-none h-px w-full shrink-0" aria-hidden />

        {loadingOlder ? (
          <p className="py-2 text-center text-xs text-zinc-400">Geçmiş mesajlar yükleniyor…</p>
        ) : hasMoreOlder ? (
          <div className="space-y-2 px-0.5">
            <p className="text-center text-[11px] leading-relaxed text-zinc-500 sm:text-xs">
              <span className="sm:hidden">Bu alanı yukarı kaydırın; en üste gelince geçmiş mesajlar yüklenir.</span>
              <span className="hidden sm:inline">Daha eski mesajlar için yukarı kaydırın veya aşağıdaki düğmeye basın.</span>
            </p>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => void tryLoadOlder()}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-zinc-200 hover:bg-white/10 active:bg-white/15 sm:text-xs"
              >
                Geçmiş mesajları yükle
              </button>
            </div>
          </div>
        ) : messages.length > 0 ? (
          <p className="py-1 text-center text-[11px] text-zinc-600 sm:text-xs">Sohbetin başı</p>
        ) : null}

        {messages.map((m) => {
          const peer = isPeerMessage(m);
          const align = peer ? "mr-auto items-start" : "ml-auto items-end";
          const bubble = peer
            ? "rounded-2xl rounded-bl-md border border-white/10 bg-[#1f2937]/90 text-zinc-100"
            : "rounded-2xl rounded-br-md border border-pf-orange/30 bg-gradient-to-br from-[#f97316]/85 to-[#ec4899]/70 text-white shadow-[0_12px_24px_-14px_rgba(236,72,153,0.65)]";

          return (
            <article
              key={m.id}
              className={`flex max-w-[min(100%,20rem)] flex-col sm:max-w-[min(100%,28rem)] ${align}`}
            >
              <span
                className={`mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-zinc-500 ${peer ? "text-left" : "text-right text-emerald-200/70"}`}
              >
                {peer ? peerBubbleLabel : selfBubbleLabel}
              </span>
              <div className={`px-3 py-2.5 text-[15px] leading-snug shadow-sm sm:text-sm sm:leading-normal ${bubble}`}>
                <p className="text-[10px] text-white/70 sm:text-white/65" title={fmtTime(m.createdAtUtc)}>
                  {fmtTimeShort(m.createdAtUtc)}
                </p>
                {m.bodyText?.trim() ? <p className="mt-1 whitespace-pre-wrap break-words">{m.bodyText}</p> : null}
                {m.attachments?.length ? (
                  <ul className="mt-2 space-y-2">
                    {m.attachments.map((a) => {
                      const url = buildAttachmentUrl(a.id);
                      return (
                        <li key={a.id} className="text-xs">
                          {isImageType(a.contentType) && accessToken ? (
                            <ChatImageThumb url={url} alt={a.fileName || "görsel"} accessToken={accessToken} />
                          ) : (
                            <a
                              href={url}
                              className="text-emerald-200 underline"
                              onClick={(e) => {
                                e.preventDefault();
                                if (!accessToken) return;
                                void (async () => {
                                  const r = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
                                  if (!r.ok) return;
                                  const blob = await r.blob();
                                  const obj = URL.createObjectURL(blob);
                                  const dl = document.createElement("a");
                                  dl.href = obj;
                                  dl.download = a.fileName || "ek";
                                  dl.click();
                                  URL.revokeObjectURL(obj);
                                })();
                              }}
                            >
                              {a.fileName || `Ek #${a.id}`}
                            </a>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
                {!m.bodyText?.trim() && !m.attachments?.length ? <p className="text-zinc-400">(Boş)</p> : null}
              </div>
            </article>
          );
        })}

        {messages.length === 0 && !loadingOlder ? (
          <p className="px-2 py-8 text-center text-sm leading-relaxed text-zinc-500">
            Henüz mesaj yok. Aşağıdaki alandan yazarak veya görsel ekleyerek sohbeti başlatabilirsin.
          </p>
        ) : null}
        <div ref={bottomRef} />
      </div>

      <footer className="shrink-0 border-t border-white/10 bg-[#0f172a]/90 p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] backdrop-blur sm:p-3 sm:pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
        {sendErr ? <p className="mb-2 text-xs text-red-300">{sendErr}</p> : null}
        {files.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-2 text-[11px] text-zinc-300">
            {files.map((f, i) => (
              <span key={`${f.name}-${i}`} className="rounded-md bg-black/30 px-2 py-1">
                {f.name}
                <button
                  type="button"
                  className="ml-2 text-pf-orange-bright"
                  onClick={() => setFiles((x) => x.filter((_, j) => j !== i))}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}
        <div className="flex items-end gap-1.5 rounded-2xl border border-white/10 bg-[#111827]/80 p-1.5 sm:gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => {
              onPickFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={!maySend || sending || !chatEnabled}
            onClick={() => fileInputRef.current?.click()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg leading-none text-zinc-200 hover:bg-white/10 disabled:opacity-40"
            title={`Görsel ekle (en fazla ${MAX_IMAGES_PER_MESSAGE})`}
            aria-label="Görsel ekle"
          >
            +
          </button>
          <textarea
            rows={1}
            maxLength={MAX_BODY_CHARS}
            placeholder={maySend && chatEnabled ? "Mesaj yaz…" : "Gönderim kapalı"}
            disabled={!maySend || sending || !chatEnabled}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            className="max-h-28 min-h-[44px] flex-1 resize-none rounded-2xl border border-white/10 bg-[#0b1220] px-3 py-2.5 text-[15px] text-white placeholder:text-zinc-500 disabled:opacity-50 sm:max-h-32 sm:resize-y sm:text-sm"
          />
          <button
            type="button"
            disabled={!maySend || sending || !chatEnabled || (!text.trim() && files.length === 0)}
            onClick={() => void send()}
            className="flex h-11 min-w-[4.25rem] shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-pf-orange-bright to-[#ec4899] px-3 text-sm font-bold text-black disabled:opacity-40 sm:min-w-0 sm:px-5"
          >
            {sending ? "…" : "Gönder"}
          </button>
        </div>
        <p className="mt-1 hidden text-[10px] text-zinc-500 sm:block">
          Enter gönderir · Shift+Enter satır · Görsel: en fazla {MAX_IMAGES_PER_MESSAGE} adet (JPEG/PNG/WebP)
        </p>
        <p className="mt-1 text-[10px] text-zinc-500 sm:hidden">Enter: gönder · Shift+Enter: yeni satır · En fazla {MAX_IMAGES_PER_MESSAGE} görsel</p>
      </footer>
    </div>
  );
}

export { OLDER_PAGE_SIZE };
