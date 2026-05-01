/** Kimlik rollerini güvenli şekilde karşılaştırır (trim + büyük/küçük harf duyarsız). */

export function normalizeRoles(roles: string[] | undefined | null): string[] {
  return (roles ?? []).map((r) => String(r).trim()).filter(Boolean);
}

export function hasAnyNormalizedRole(roles: string[] | undefined | null, targets: string[]): boolean {
  const set = new Set(normalizeRoles(roles).map((r) => r.toLowerCase()));
  return targets.some((t) => set.has(t.trim().toLowerCase()));
}
