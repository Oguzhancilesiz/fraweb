import { getPublicApiBaseUrl } from "@/lib/api/config";

/**
 * MuscleWiki API görselleri çoğunlukla köke göreli döner (`/stream/images/bodymaps/...`).
 * Bunları yerel backend ile birleştirmek 404 üretir; görseller api.musclewiki.com üzerindedir.
 */
function muscleWikiApiOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_MUSCLEWIKI_API_URL?.trim();
  if (raw) return raw.replace(/\/+$/, "");
  return "https://api.musclewiki.com";
}

/** API’den gelen göreli veya mutlak medya yolunu tarayıcıda kullanılabilir URL’ye çevirir. */
export function resolveMediaUrl(path: string | null | undefined): string | null {
  const p = path?.trim();
  if (!p) return null;
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  if (p.startsWith("//")) return `https:${p}`;
  if (p.startsWith("/uploads/") || p.startsWith("/storage/")) {
    return `${getPublicApiBaseUrl()}${p}`;
  }
  if (p.startsWith("/")) {
    return `${muscleWikiApiOrigin()}${p}`;
  }
  const base = getPublicApiBaseUrl();
  return `${base}${p.startsWith("/") ? "" : "/"}${p}`;
}
