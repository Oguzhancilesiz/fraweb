import { hasAnyNormalizedRole } from "./auth/role-matching";

/** Oturum açıkken panel kabuğu (WebUI `_PanelLayout` benzeri) gösterilecek yollar. */
const PANEL_PREFIXES = ["/ogrenci", "/koc", "/admin", "/topluluk", "/forum", "/oncesi-sonrasi", "/antrenorler", "/ayarlar"] as const;

export function isPanelPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return PANEL_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export type PanelVariant = "student" | "coach" | "admin";

/** WebUI: koç + topluluk → koç paneli; öğrenci + topluluk → öğrenci paneli. */
export function resolvePanelVariant(pathname: string | null, roles: string[] | undefined): PanelVariant {
  const isAdminContext = hasAnyNormalizedRole(roles, ["Admin", "SuperAdmin"]);
  const isCoachContext = hasAnyNormalizedRole(roles, ["Coach"]);
  if (pathname?.startsWith("/admin")) return "admin";
  if (pathname?.startsWith("/koc")) return "coach";
  if (pathname?.startsWith("/ogrenci")) return "student";
  if (isAdminContext) return "admin";
  if (isCoachContext) return "coach";
  return "student";
}
