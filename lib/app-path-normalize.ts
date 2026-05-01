import { routes } from "./site";

/**
 * WebUI MVC `ProfileSettings` rotası `/ProfileSettings`; App Router karşılığı `/ayarlar`.
 * Yer imi, e-posta, `returnUrl` veya bildirim URL'leri buraya düşünce Next’te 404 olmaması için normalize edilir.
 */
export function normalizeLegacyRelativeUrl(input: string): string | null {
  if (!input.startsWith("/") || input.startsWith("//")) return null;
  try {
    const u = new URL(input, "https://local.invalid");
    const path = u.pathname.replace(/\\/g, "/");
    if (!/^\/profilesettings(\/|$)/i.test(path)) return null;
    u.pathname = routes.profileSettings;
    return `${u.pathname}${u.search}${u.hash}`;
  } catch {
    return null;
  }
}
