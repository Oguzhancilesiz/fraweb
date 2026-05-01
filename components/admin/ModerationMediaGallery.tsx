"use client";

import { resolveMediaUrl } from "@/lib/media";

type ModerationMediaGalleryProps = {
  urls: string[] | undefined;
  label?: string;
  className?: string;
};

/** API’den gelen `/storage/...` yolları için public API tabanlı önizleme. */
export function ModerationMediaGallery({ urls, label, className }: ModerationMediaGalleryProps) {
  if (!urls?.length) return null;
  return (
    <div className={className ?? "mt-2"}>
      {label ? <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</p> : null}
      <div className="flex flex-wrap gap-2">
        {urls.map((u, i) => {
          const src = resolveMediaUrl(u);
          if (!src) return null;
          return (
            <a
              key={`${u}-${i}`}
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-xl border border-white/10 bg-black/30"
            >
              <img
                src={src}
                alt="Ek görsel"
                className="max-h-48 max-w-[min(100%,220px)] object-contain"
                loading="lazy"
              />
            </a>
          );
        })}
      </div>
    </div>
  );
}
