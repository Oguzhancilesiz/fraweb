"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { usePanelTheme } from "@/contexts/PanelThemeContext";
import { cn } from "@/components/dashboard/DashboardUI";
import { apiFetch } from "@/lib/api/client";
import { isPanelPath } from "@/lib/panel-paths";

type DemoFeedbackContextValue = {
  open: () => void;
  close: () => void;
  isOpen: boolean;
};

const DemoFeedbackContext = createContext<DemoFeedbackContextValue | null>(null);

function useDemoFeedback() {
  const v = useContext(DemoFeedbackContext);
  if (!v) throw new Error("useDemoFeedback yalnızca DemoFeedbackProvider içinde kullanılabilir.");
  return v;
}

function DemoFeedbackDialog() {
  const { token } = useAuth();
  const { open, close, isOpen } = useDemoFeedback();
  const pathname = usePathname();
  const [message, setMessage] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDoneMsg(null);
        setErr(null);
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  const submit = useCallback(async () => {
    setErr(null);
    setDoneMsg(null);
    const body = {
      message: message.trim(),
      pageUrl: typeof window !== "undefined" ? window.location.href : pathname ?? "",
      contactEmail: contactEmail.trim() || null,
    };
    if (body.message.length < 10) {
      setErr("Lütfen en az 10 karakter açıklayın.");
      return;
    }
    setSending(true);
    const r = await apiFetch<{ id: number }>("/api/v1/public/demo-feedback", {
      method: "POST",
      body: JSON.stringify(body),
      accessToken: token ?? undefined,
    });
    setSending(false);
    if (!r.ok) {
      setErr(r.message);
      return;
    }
    setMessage("");
    setContactEmail("");
    setDoneMsg("Teşekkürler — bildiriminiz kaydedildi.");
  }, [message, contactEmail, pathname, token]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[130] flex items-end justify-end bg-black/50 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pf-demo-feedback-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          setDoneMsg(null);
          setErr(null);
          close();
        }
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-zinc-950 p-4 shadow-2xl shadow-black/60">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <h2 id="pf-demo-feedback-title" className="text-sm font-bold text-white">
              Hata / geri bildirim
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              Gördüğünüz sorunu veya önerinizi yazın; yönetim panelinden takip edilir.
            </p>
          </div>
          <button
            type="button"
            className="rounded-full px-2 py-1 text-xs text-zinc-400 hover:bg-white/10 hover:text-white"
            onClick={() => {
              setDoneMsg(null);
              setErr(null);
              close();
            }}
          >
            Kapat
          </button>
        </div>
        <label className="mb-2 block text-xs font-medium text-zinc-300">
          Açıklama <span className="text-zinc-500">(zorunlu)</span>
          <textarea
            className="mt-1 min-h-[120px] w-full resize-y rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-sm text-zinc-100 outline-none ring-pf-orange-bright/40 focus:ring-2"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ne oldu, hangi sayfada, nasıl tekrarlanır?"
            maxLength={8000}
          />
        </label>
        <label className="mb-3 block text-xs font-medium text-zinc-300">
          İletişim e-postası <span className="text-zinc-500">(isteğe bağlı)</span>
          <input
            type="email"
            className="mt-1 w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-sm text-zinc-100 outline-none ring-pf-orange-bright/40 focus:ring-2"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="Size dönebilmek için"
            autoComplete="email"
          />
        </label>
        {err ? <p className="mb-2 text-xs text-red-400">{err}</p> : null}
        {doneMsg ? <p className="mb-2 text-xs text-emerald-400">{doneMsg}</p> : null}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/5"
            onClick={() => {
              setDoneMsg(null);
              setErr(null);
              close();
            }}
          >
            Vazgeç
          </button>
          <button
            type="button"
            disabled={sending}
            className="rounded-full bg-pf-orange-bright px-4 py-2 text-xs font-bold text-black hover:opacity-95 disabled:opacity-50"
            onClick={() => void submit()}
          >
            {sending ? "Gönderiliyor…" : "Gönder"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DemoFeedbackProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const value = useMemo<DemoFeedbackContextValue>(
    () => ({
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      isOpen,
    }),
    [isOpen],
  );

  return (
    <DemoFeedbackContext.Provider value={value}>
      {children}
      <DemoFeedbackDialog />
    </DemoFeedbackContext.Provider>
  );
}

/** Genel sitede (panel dışı) sağ altta sabit; panelde gizlenir — üst menüde `DemoFeedbackHeaderButton` kullanılır. */
export function DemoFeedbackFab() {
  const pathname = usePathname();
  const { ready } = useAuth();
  const { open, isOpen } = useDemoFeedback();

  const hideOnPath =
    pathname?.startsWith("/giris") ||
    pathname?.startsWith("/kayit") ||
    pathname?.startsWith("/auth/");

  if (!ready || hideOnPath || isPanelPath(pathname) || isOpen) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[120] flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
      <button
        type="button"
        onClick={() => open()}
        className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-zinc-900/95 text-lg shadow-lg shadow-black/40 backdrop-blur-sm transition hover:border-pf-orange-bright/60 hover:bg-zinc-800"
        aria-label="Hata veya geri bildirim bildir"
        title="Hata bildir"
      >
        <span aria-hidden>🐞</span>
      </button>
    </div>
  );
}

/** Panel üst çubuğu: bildirim ikonunun solunda, tema ile uyumlu. */
export function DemoFeedbackHeaderButton() {
  const { open } = useDemoFeedback();
  const { theme, enabled } = usePanelTheme();
  const panelLight = enabled && theme === "light";

  return (
    <button
      type="button"
      onClick={() => open()}
      className={cn(
        "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border px-2.5 text-[11px] font-semibold transition sm:px-3 sm:text-xs",
        panelLight
          ? "border-orange-900/19 text-orange-950 hover:bg-orange-950/[0.04]"
          : "border-white/15 text-zinc-200 hover:bg-white/5",
      )}
      aria-label="Hata bildir"
    >
      <span className="text-sm leading-none" aria-hidden>
        🐞
      </span>
      <span className="whitespace-nowrap">Hata bildir</span>
    </button>
  );
}
