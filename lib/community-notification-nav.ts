import { normalizeLegacyRelativeUrl } from "@/lib/app-path-normalize";

/** Bildirim `url` alanını Next.js topluluk rotalarına çevirir (eski WebUI kayıtları dahil). */
export function canonicalGuidKey(s: string): string {
  return s.replace(/-/g, "").toLowerCase();
}

export function resolveNotificationHref(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const u = raw.trim();
  if (!u) return null;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;

  const profileCompat = normalizeLegacyRelativeUrl(u);
  if (profileCompat) return profileCompat;

  const legacyHome = u.match(/^\/Community\/Home\/Index#post-([0-9a-f-]+)$/i);
  if (legacyHome) return `/topluluk?focusPost=${legacyHome[1]}`;

  const legacyExplore = u.match(/^\/Community\/BeforeAfter\/Explore#post-([0-9a-f-]+)$/i);
  if (legacyExplore) return `/oncesi-sonrasi?focusPost=${legacyExplore[1]}`;

  const legacyForumTopic = u.match(/^\/Community\/Forum\/Topic\/([0-9a-f-]+)$/i);
  if (legacyForumTopic) return `/forum/konu/${legacyForumTopic[1]}`;

  if (u === "/Community/Forum") return "/forum";

  return u;
}

/** `window.location` veya bildirim href’inden odak parametreleri. */
export function parseFeedFocusFromHref(href: string): { focusPost?: string; focusComment?: string } {
  if (!href.trim()) return {};
  try {
    const abs = href.startsWith("http") ? href : `https://local.invalid${href.startsWith("/") ? href : `/${href}`}`;
    const u = new URL(abs);
    const fp = u.searchParams.get("focusPost")?.trim();
    const fc = u.searchParams.get("focusComment")?.trim();
    const out: { focusPost?: string; focusComment?: string } = {};
    if (fp) out.focusPost = fp;
    if (fc) out.focusComment = fc;
    if (!fp && u.hash) {
      const m = /^#post-([0-9a-f-]+)$/i.exec(u.hash);
      if (m) out.focusPost = m[1];
    }
    return out;
  } catch {
    return {};
  }
}
