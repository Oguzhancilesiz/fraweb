import { routes } from "@/lib/site";
import { hasAnyNormalizedRole } from "./role-matching";

/** Koç paneli ve koç API uçları (WebUI `Areas/Coach` ile aynı rol seti). */
export function canAccessCoachArea(roles: string[] | undefined): boolean {
  return hasAnyNormalizedRole(roles, ["Coach", "Admin", "SuperAdmin"]);
}

export function canAccessAdminArea(roles: string[] | undefined): boolean {
  return hasAnyNormalizedRole(roles, ["Admin", "SuperAdmin"]);
}

/** JWT rollerine göre ilk açılış sayfası. */
export function pickPostLoginPath(roles: string[]): string {
  if (hasAnyNormalizedRole(roles, ["SuperAdmin", "Admin"])) return routes.admin;
  if (hasAnyNormalizedRole(roles, ["Coach"])) return routes.coach;
  if (hasAnyNormalizedRole(roles, ["Student"])) return routes.student;
  return routes.home;
}

export function primaryDashboardPath(roles: string[]): string | null {
  if (hasAnyNormalizedRole(roles, ["SuperAdmin", "Admin"])) return routes.admin;
  if (hasAnyNormalizedRole(roles, ["Coach"])) return routes.coach;
  if (hasAnyNormalizedRole(roles, ["Student"])) return routes.student;
  return null;
}

/**
 * Giriş sonrası yönlendirme: `returnUrl` genelde önceliklidir; ancak yönetici
 * hesabı “koç alanına gir” akışıyla `/giris?returnUrl=/koc` gelirse burada
 * admin paneline gitmesi gerekir (aksi halde süper admin yine koça düşer).
 */
export function resolvePostLoginDestination(roles: string[], returnUrl: string | null): string {
  const fallback = pickPostLoginPath(roles);
  if (!returnUrl) return fallback;
  if (canAccessAdminArea(roles) && (returnUrl === "/koc" || returnUrl.startsWith("/koc/"))) {
    return fallback;
  }
  return returnUrl;
}
