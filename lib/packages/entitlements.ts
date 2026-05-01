/** API ile uyumlu: `PackageEntitlements.Unlimited` = -1 */
const UNLIMITED = -1;

export function formatMonthlyQa(n: number): string {
  if (n === UNLIMITED) return "Sınırsız (aylık)";
  if (n <= 0) return "Tanımlı değil";
  return `${n} / ay`;
}

export function formatLiveChatMessages(n: number): string {
  if (n === -1) return "Sınırsız mesaj (paket süresince)";
  if (n <= 0) return "Yok";
  return `${n} mesaj (paket süresince)`;
}

export function formatLiveChatImages(n: number): string {
  if (n <= 0) return "Görsel yok";
  return `${n} görsel (paket süresince)`;
}

export function formatDisplayPrice(amount: number, currency: string, displayPriceText?: string | null): string {
  if (displayPriceText?.trim()) return displayPriceText.trim();
  try {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: currency || "TRY",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}
