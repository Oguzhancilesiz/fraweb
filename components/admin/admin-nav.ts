import { routes } from "@/lib/site";

/** `PanelShell` ile aynı şekil — admin kenar çubuğu ve mobil “tüm menü” için tek kaynak. */
export type AdminNavItem = {
  href: string;
  label: string;
  exact?: boolean;
  activeIgnoreSearch?: boolean;
  suppressActive?: boolean;
};

/** WebUI `_PanelLayout` yönetim sırasına yakın. */
export const adminNavOperasyon: AdminNavItem[] = [
  { href: routes.admin, label: "Özet", exact: true },
  { href: routes.adminUsers, label: "Kullanıcılar" },
  { href: routes.adminPackages, label: "Paketler (katalog)" },
  { href: routes.adminStudentPackages, label: "Öğrenci paketleri" },
  { href: routes.adminPayments, label: "Ödemeler" },
  { href: routes.adminPurchaseIntents, label: "Ödeme niyetleri" },
  { href: routes.adminActivationCodes, label: "Aktivasyon kodları" },
];

export const adminNavTopluluk: AdminNavItem[] = [
  { href: routes.adminCommunityInsights, label: "Topluluk özeti", exact: true },
  { href: routes.adminEmailCenter, label: "E-posta merkezi", exact: true },
  { href: routes.adminModeration, label: "İçerik onayı", exact: true },
  { href: routes.adminModerationArchive, label: "İçerik geçmişi", exact: true },
];

export const adminNavSistem: AdminNavItem[] = [
  { href: routes.profileSettings, label: "Hesabım", exact: true },
  { href: routes.adminSiteSettings, label: "Site ayarları", exact: true },
  { href: routes.adminDemoFeedback, label: "Demo bildirimleri", exact: true },
  { href: routes.adminAuditLogs, label: "Denetim (audit)", exact: true },
  { href: routes.adminSecurity, label: "Canlı güvenlik", exact: true },
  { href: routes.adminMuscleWiki, label: "MuscleWiki", exact: true },
];
