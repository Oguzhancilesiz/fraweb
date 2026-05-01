"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const AUTO_MS = 4500;

type Props = {
  urls: string[];
  altPrefix: string;
  /** Tek görselde otomatik geçiş kapalı. */
  autoPlay?: boolean;
};

export function CommunityFeedImageCarousel({ urls, altPrefix, autoPlay = true }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const n = urls.length;
  const runAuto = autoPlay && n > 1 && !paused;

  const go = useCallback(
    (dir: 1 | -1) => {
      setIndex((i) => (i + dir + n) % n);
    },
    [n],
  );

  useEffect(() => {
    if (!runAuto) return;
    const t = window.setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      setIndex((i) => (i + 1) % n);
    }, AUTO_MS);
    return () => window.clearInterval(t);
  }, [runAuto, n]);

  useEffect(() => {
    setIndex((i) => Math.min(i, Math.max(0, n - 1)));
  }, [n]);

  if (!n) return null;

  return (
    <div
      ref={wrapRef}
      className="relative min-w-0 overflow-hidden rounded-xl border border-white/10 bg-pf-void"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => window.setTimeout(() => setPaused(false), 2000)}
    >
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {urls.map((u, i) => (
          <div key={`${i}-${u}`} className="w-full shrink-0">
            <div className="relative aspect-[4/3] w-full bg-pf-void">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt={`${altPrefix} ${i + 1}`} className="h-full w-full object-contain" loading={i === 0 ? "eager" : "lazy"} />
            </div>
          </div>
        ))}
      </div>
      {n > 1 ? (
        <>
          <div className="pointer-events-none absolute inset-x-0 bottom-1.5 flex justify-center gap-1">
            {urls.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Görsel ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`pointer-events-auto h-1.5 rounded-full transition-all ${
                  i === index ? "w-5 bg-pf-orange" : "w-1.5 bg-white/35 hover:bg-white/55"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label="Önceki görsel"
            onClick={() => go(-1)}
            className="absolute left-1 top-1/2 z-[1] -translate-y-1/2 rounded-full border border-white/15 bg-black/45 px-2 py-2 text-xs text-white backdrop-blur-sm hover:bg-black/60"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Sonraki görsel"
            onClick={() => go(1)}
            className="absolute right-1 top-1/2 z-[1] -translate-y-1/2 rounded-full border border-white/15 bg-black/45 px-2 py-2 text-xs text-white backdrop-blur-sm hover:bg-black/60"
          >
            ›
          </button>
        </>
      ) : null}
    </div>
  );
}
