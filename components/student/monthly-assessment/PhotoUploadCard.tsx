"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { getPublicApiBaseUrl } from "@/lib/api/config";

type Props = {
  slotIndex: number;
  title: string;
  body: string;
  checklistLabel: string;
  existingFileName?: string | null;
  /** Sunucudaki görseli indirmek için (JWT ile `/api/v1/media/assessment-photos/{id}`). */
  existingPublicId?: string | null;
  accessToken?: string | null;
  markedForRemove: boolean;
  onToggleRemove: (remove: boolean) => void;
  newFile: File | null;
  onPickFile: (f: File | null) => void;
  satisfied: boolean;
};

export function PhotoUploadCard({
  slotIndex,
  title,
  body,
  checklistLabel,
  existingFileName,
  existingPublicId,
  accessToken,
  markedForRemove,
  onToggleRemove,
  newFile,
  onPickFile,
  satisfied,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [existingBlobUrl, setExistingBlobUrl] = useState<string | null>(null);
  const [existingLoading, setExistingLoading] = useState(false);
  const [existingLoadErr, setExistingLoadErr] = useState(false);
  const existingBlobRef = useRef<string | null>(null);

  useEffect(() => {
    if (!newFile) {
      setPreviewUrl(null);
      return;
    }
    const u = URL.createObjectURL(newFile);
    setPreviewUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [newFile]);

  useEffect(() => {
    if (existingBlobRef.current) {
      URL.revokeObjectURL(existingBlobRef.current);
      existingBlobRef.current = null;
    }
    setExistingBlobUrl(null);
    setExistingLoadErr(false);
    setExistingLoading(false);

    if (!accessToken || !existingPublicId || markedForRemove || newFile) {
      return;
    }

    let cancelled = false;
    setExistingLoading(true);
    const url = `${getPublicApiBaseUrl()}/api/v1/media/assessment-photos/${encodeURIComponent(existingPublicId)}`;
    void (async () => {
      try {
        const r = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}`, Accept: "image/*,*/*" } });
        if (!r.ok || cancelled) throw new Error("fetch");
        const blob = await r.blob();
        if (cancelled) return;
        const obj = URL.createObjectURL(blob);
        existingBlobRef.current = obj;
        setExistingBlobUrl(obj);
        setExistingLoadErr(false);
      } catch {
        if (!cancelled) setExistingLoadErr(true);
      } finally {
        if (!cancelled) setExistingLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (existingBlobRef.current) {
        URL.revokeObjectURL(existingBlobRef.current);
        existingBlobRef.current = null;
      }
    };
  }, [accessToken, existingPublicId, markedForRemove, newFile]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files?.[0];
      if (f && f.type.startsWith("image/")) onPickFile(f);
    },
    [onPickFile],
  );

  return (
    <div
      className={`rounded-2xl border p-4 transition-colors ${
        satisfied ? "border-emerald-500/25 bg-emerald-500/5" : "border-white/10 bg-pf-void/20"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-white">
            {slotIndex + 1}. {title}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">{body}</p>
          <p className="mt-1 text-[11px] text-zinc-500">{checklistLabel}</p>
        </div>
        {satisfied ? (
          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-200">
            Hazır
          </span>
        ) : (
          <span className="rounded-full border border-amber-500/35 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-100">Eksik</span>
        )}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,140px)_1fr]">
        <div
          className="flex aspect-[3/4] max-h-44 items-center justify-center rounded-xl border border-dashed border-white/20 bg-black/30"
          aria-hidden
        >
          <svg viewBox="0 0 80 120" className="h-full max-h-40 w-auto text-white/20" fill="none" stroke="currentColor" strokeWidth="1.2">
            <ellipse cx="40" cy="22" rx="14" ry="16" />
            <path d="M40 38v35M22 58h36M28 73 L40 52 52 73" />
            <path d="M32 73v38M48 73v38M36 111h8" />
          </svg>
        </div>

        <div className="flex min-h-[140px] flex-col gap-2">
          {previewUrl ? (
            <div className="relative overflow-hidden rounded-xl border border-white/15">
              <img src={previewUrl} alt="" className="max-h-48 w-full object-contain" />
              <p className="border-t border-white/10 bg-black/40 px-2 py-1 text-[11px] text-zinc-300">Yeni seçilen görsel</p>
            </div>
          ) : existingBlobUrl && !markedForRemove ? (
            <div className="relative overflow-hidden rounded-xl border border-white/15">
              <img src={existingBlobUrl} alt={`Kayıtlı: ${existingFileName ?? "ilerleme"}`} className="max-h-48 w-full object-contain bg-black/20" />
              {existingFileName ? (
                <p className="border-t border-white/10 bg-black/50 px-2 py-1 text-[11px] text-zinc-300">
                  Kayıtlı: <span className="text-zinc-100">{existingFileName}</span>
                </p>
              ) : null}
            </div>
          ) : existingPublicId && !markedForRemove && !newFile && (existingLoading || existingLoadErr) ? (
            <div className="rounded-lg border border-white/10 bg-pf-void/50 px-3 py-3 text-xs text-zinc-400">
              {existingLoading ? <p className="text-zinc-300">Kayıtlı görsel yükleniyor…</p> : null}
              {existingLoadErr ? (
                <p className="text-amber-200/90">
                  Önizleme açılamadı. Dosya: <span className="text-white">{existingFileName ?? "—"}</span>
                </p>
              ) : null}
            </div>
          ) : existingFileName && !existingPublicId && !markedForRemove && !newFile ? (
            <p className="rounded-lg border border-white/10 bg-pf-void/50 px-3 py-2 text-xs text-zinc-300">
              Kayıtlı görsel: <span className="text-white">{existingFileName}</span>
            </p>
          ) : null}

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`flex flex-1 flex-col justify-center rounded-xl border border-dashed px-3 py-4 text-center transition-colors ${
              dragOver ? "border-pf-orange-bright/60 bg-pf-orange/10" : "border-white/15 bg-pf-void/30"
            }`}
          >
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                onPickFile(f);
              }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-sm font-medium text-pf-orange-bright hover:underline"
            >
              Fotoğraf seç veya sürükleyip bırak
            </button>
            <p className="mt-1 text-[11px] text-zinc-500">Mobilde kamera ile de çekebilirsin.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-zinc-200 hover:border-pf-orange/40"
            >
              Değiştir
            </button>
            {(newFile || (existingFileName && !markedForRemove)) ? (
              <button
                type="button"
                onClick={() => {
                  onPickFile(null);
                  if (existingFileName) onToggleRemove(true);
                }}
                className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-200 hover:bg-red-500/10"
              >
                Kaldır
              </button>
            ) : null}
            {existingFileName ? (
              <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-400">
                <input
                  type="checkbox"
                  checked={markedForRemove}
                  onChange={(e) => {
                    onToggleRemove(e.target.checked);
                    if (!e.target.checked) onPickFile(null);
                  }}
                />
                Kayıtlı görseli sil
              </label>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
