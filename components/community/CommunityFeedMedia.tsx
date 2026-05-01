"use client";

import { resolveMediaUrl } from "@/lib/media";
import type { CommunityFeedPostMediaJson } from "./community-feed-types";
import { CommunityFeedImageCarousel } from "./CommunityFeedImageCarousel";

export function CommunityFeedMedia({ media, altBase }: { media: CommunityFeedPostMediaJson; altBase: string }) {
  if (!media.hasMedia) return null;

  if (media.isBeforeAfterSplitLayout) {
    const before = media.beforeGallery.map((a) => resolveMediaUrl(a.url)).filter(Boolean) as string[];
    const after = media.afterGallery.map((a) => resolveMediaUrl(a.url)).filter(Boolean) as string[];
    if (!before.length && !after.length) return null;
    return (
      <div className="mt-2 grid gap-3 md:grid-cols-2">
        {before.length ? (
          <div className="min-w-0">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-zinc-500">Öncesi</p>
            <div className="mt-0.5">
              <CommunityFeedImageCarousel urls={before} altPrefix={`${altBase} öncesi`} />
            </div>
          </div>
        ) : null}
        {after.length ? (
          <div className="min-w-0">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-zinc-500">Sonrası</p>
            <div className="mt-0.5">
              <CommunityFeedImageCarousel urls={after} altPrefix={`${altBase} sonrası`} />
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  const unified = media.unifiedGallery.map((a) => resolveMediaUrl(a.url)).filter(Boolean) as string[];
  if (!unified.length) return null;
  return (
    <div className="mt-2 min-w-0">
      <CommunityFeedImageCarousel urls={unified} altPrefix={`${altBase} görsel`} />
    </div>
  );
}
