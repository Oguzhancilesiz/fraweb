"use client";

import { useEffect, useState } from "react";
import { usePanelTheme } from "@/contexts/PanelThemeContext";
import { cn } from "@/components/dashboard/DashboardUI";
import { getPublicApiBaseUrl } from "@/lib/api/config";
import { FEED_KIND_OPTIONS } from "./community-feed-types";

type Props = {
  token: string;
  onClose: () => void;
  /** Başarı yanıtındaki API mesajı (örn. onay süreci) */
  onPosted: (successMessage?: string) => void;
};

export function CommunityHubComposeForm({ token, onClose, onPosted }: Props) {
  const { theme, enabled } = usePanelTheme();
  const L = enabled && theme === "light";

  useEffect(() => {
    (document.getElementById("hub-feed-body") as HTMLTextAreaElement | null)?.focus({ preventScroll: true });
  }, []);

  const [composeKind, setComposeKind] = useState(0);
  const [compose, setCompose] = useState("");
  const [composeFiles, setComposeFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submitPost(e: React.FormEvent) {
    e.preventDefault();
    if (!compose.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("Kind", String(composeKind));
      fd.append("Body", compose.trim());
      for (const f of composeFiles) fd.append("images", f);

      const base = getPublicApiBaseUrl();
      const res = await fetch(`${base}/api/v1/community/feed`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const text = await res.text();
      if (!res.ok) {
        try {
          const j = JSON.parse(text) as { detail?: string; message?: string; title?: string };
          setErr(j.detail || j.message || j.title || "Gönderi kaydedilemedi.");
        } catch {
          setErr(text || "Gönderi kaydedilemedi.");
        }
        return;
      }
      let successMessage: string | undefined;
      try {
        const j = JSON.parse(text) as { message?: string };
        if (typeof j.message === "string" && j.message.trim()) successMessage = j.message.trim();
      } catch {
        /* boş gövde */
      }
      setCompose("");
      setComposeFiles([]);
      onPosted(successMessage);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void submitPost(e)}
      className={cn("space-y-3 border-t px-4 py-4 lg:px-6", L ? "border-orange-200/75 bg-orange-50/93" : "border-white/10 bg-pf-raised/95")}
    >
      {err ? <p className={cn("text-sm", L ? "text-red-800" : "text-red-300")}>{err}</p> : null}
      <div>
        <label className={cn("text-xs font-bold", L ? "text-stone-800" : "text-pf-mist")} htmlFor="hub-feed-kind">
          Tür
        </label>
        <select
          id="hub-feed-kind"
          value={composeKind}
          onChange={(e) => setComposeKind(Number(e.target.value))}
          className={cn(
            "mt-1 w-full rounded-xl border px-3 py-2 text-sm",
            L ? "border-orange-950/27 bg-white text-stone-900" : "border-white/10 bg-pf-void",
          )}
        >
          {FEED_KIND_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={cn("text-xs font-bold", L ? "text-stone-800" : "text-pf-mist")} htmlFor="hub-feed-body">
          Metin
        </label>
        <textarea
          id="hub-feed-body"
          rows={4}
          value={compose}
          onChange={(e) => setCompose(e.target.value)}
          className={cn(
            "mt-1 w-full rounded-xl border px-3 py-2 text-sm",
            L ? "border-orange-950/27 bg-white text-stone-900 placeholder:text-stone-500/75" : "border-white/10 bg-pf-void",
          )}
          maxLength={8000}
          placeholder="Ne paylaşmak istersin?"
        />
      </div>
      <div>
        <label className={cn("text-xs font-bold", L ? "text-stone-800" : "text-pf-mist")} htmlFor="hub-feed-images">
          Görseller (çoklu seçim)
        </label>
        <input
          id="hub-feed-images"
          type="file"
          accept="image/*"
          multiple
          className={cn(
            "mt-1 block w-full text-xs file:mr-3 file:rounded-full file:border-0 file:bg-pf-orange file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-black",
            L ? "text-stone-700" : "text-zinc-400",
          )}
          onChange={(e) => setComposeFiles(e.target.files ? Array.from(e.target.files) : [])}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={busy || !compose.trim()}
          className="rounded-full bg-pf-orange px-5 py-2 text-sm font-bold text-black disabled:opacity-50"
        >
          {busy ? "Gönderiliyor…" : "Paylaş"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className={cn(
            "rounded-full border px-4 py-2 text-xs font-semibold",
            L
              ? "border-orange-950/22 text-stone-700 hover:border-orange-800/52 hover:bg-white hover:text-orange-950"
              : "border-white/15 text-zinc-400 hover:border-white/25 hover:text-white",
          )}
        >
          Vazgeç
        </button>
      </div>
    </form>
  );
}
