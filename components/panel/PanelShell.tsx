"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { PanelVariant } from "@/lib/panel-paths";
import { routes } from "@/lib/site";
import { cn, MobileBottomNav } from "@/components/dashboard/DashboardUI";
import { PanelThemeProvider, usePanelTheme } from "@/contexts/PanelThemeContext";
import { PanelNotificationCenter } from "./PanelNotificationCenter";
import { CoachTopBarInsights } from "./CoachTopBarInsights";
import { PanelUserMenu } from "./PanelUserMenu";
import { PanelThemeToggle } from "./PanelThemeToggle";
import { StudentPortalTour } from "./StudentPortalTour";
import { DemoFeedbackHeaderButton } from "@/components/DemoFeedback";
import { adminNavOperasyon, adminNavSistem, adminNavTopluluk } from "@/components/admin/admin-nav";

type NavItem = {
  href: string;
  label: string;
  exact?: boolean;
  hash?: string;
  /** Öğrenci paneli ilk tur (driver.js) hedefi — `Link` üzerinde id. */
  tourAnchorId?: string;
  /** `true`: sorgu dizesi yok sayılır (WebUI’deki «Öğrenciler» gibi, filtreliyken de aktif). */
  activeIgnoreSearch?: boolean;
  /** WebUI’de bu satır için `active` sınıfı yok — görsel olarak her zaman pasif. */
  suppressActive?: boolean;
};

type PanelNavAccent = "student" | "coach" | "admin";

function useHash() {
  const [hash, setHash] = useState("");
  useEffect(() => {
    const sync = () => setHash(typeof window !== "undefined" ? window.location.hash : "");
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  return hash;
}

function parseHref(href: string) {
  const [pathQuery, frag] = href.split("#");
  const [pathOnly, qs = ""] = pathQuery.split("?");
  return {
    pathOnly: pathOnly || "/",
    required: new URLSearchParams(qs),
    trailingHash: frag ?? "",
  };
}

function NavLink({
  href,
  label,
  exact,
  hash,
  tourAnchorId,
  activeIgnoreSearch,
  suppressActive,
  onNavigate,
  accent,
}: NavItem & {
  onNavigate?: () => void;
  accent?: PanelNavAccent;
}) {
  const { theme } = usePanelTheme();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const curHash = useHash();
  const { pathOnly: linkPath, required } = parseHref(href);
  const linkHref = hash ? `${linkPath}#${hash}` : href;
  const tone = accent ?? "admin";

  const pathOk = exact ? pathname === linkPath : pathname === linkPath || pathname.startsWith(`${linkPath}/`);

  const searchOk =
    activeIgnoreSearch ||
    (() => {
      let ok = true;
      required.forEach((v, k) => {
        if (searchParams.get(k) !== v) ok = false;
      });
      return ok;
    })();

  const hasItemHash = Boolean(hash);
  const active = suppressActive
    ? false
    : hasItemHash
      ? pathOk && curHash === `#${hash}` && searchOk
        : exact
        ? pathOk && curHash === "" && searchOk
        : pathOk && searchOk;

  const coralActiveDark =
    "border-l-2 border-pf-orange-bright bg-gradient-to-r from-pf-orange/[0.26] via-pink-500/15 to-transparent text-white shadow-[inset_-2px_0_32px_-14px_rgba(249,115,22,0.45)]";
  const coralActiveLight =
    "border-l-2 border-pf-orange bg-gradient-to-r from-orange-100 via-pink-50/93 to-transparent text-orange-950 shadow-[inset_-2px_0_28px_-14px_rgba(249,115,22,0.14)]";
  const activeClasses =
    tone === "student" || tone === "coach"
      ? theme === "light"
        ? coralActiveLight
        : coralActiveDark
      : "border-l-2 border-pf-purple-400 bg-gradient-to-r from-purple-950/65 via-purple-950/25 to-transparent text-white shadow-[inset_-2px_0_26px_-14px_rgba(167,139,250,0.22)]";

  const inactiveHoverLight =
    tone === "student" || tone === "coach"
      ? "hover:bg-orange-950/[0.04] hover:text-orange-950"
      : "hover:bg-purple-900/22 hover:text-stone-900";

  const inactiveHoverDark =
    tone === "student" || tone === "coach"
      ? "hover:bg-pink-500/10 hover:text-orange-50"
      : "hover:bg-purple-950/35 hover:text-zinc-100";

  const inactiveFg =
    active || suppressActive
      ? ""
      : tone === "admin"
        ? "text-zinc-400"
        : theme === "light"
          ? "text-stone-700"
          : "text-zinc-400";

  return (
    <Link
      id={tourAnchorId}
      href={linkHref}
      onClick={onNavigate}
      className={cn(
        "block rounded-lg border-l-2 px-3 py-2.5 text-sm font-medium transition",
        active
          ? activeClasses
          : cn(
              "border-transparent",
              inactiveFg,
              theme === "light" ? inactiveHoverLight : inactiveHoverDark,
            ),
      )}
    >
      {label}
    </Link>
  );
}

function NavSection({
  title,
  items,
  onNavigate,
  accent,
}: {
  title: string;
  items: NavItem[];
  onNavigate?: () => void;
  accent: PanelNavAccent;
}) {
  const { theme, enabled } = usePanelTheme();
  const coralLightTitle = (accent === "student" || accent === "coach") && enabled && theme === "light";
  const titleTone = coralLightTitle
    ? "font-black text-orange-950"
    : accent === "student" || accent === "coach"
      ? "text-transparent bg-gradient-to-r from-pf-orange-bright via-pink-400 to-purple-400 bg-clip-text"
      : "text-zinc-500";

  return (
    <div className="mb-6">
      <p className={cn("mb-2 px-3 text-[10px] font-bold uppercase tracking-wider", titleTone)}>{title}</p>
      <nav className="space-y-0.5">
        {items.map((it) => (
          <NavLink key={it.label + it.href} {...it} accent={accent} onNavigate={onNavigate} />
        ))}
      </nav>
    </div>
  );
}

type PanelShellProps = {
  variant: PanelVariant;
  children: ReactNode;
};

function NavIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

export function PanelShell({ variant, children }: PanelShellProps) {
  const themeEnabled = variant === "student" || variant === "coach";
  return (
    <PanelThemeProvider enabled={themeEnabled}>
      <PanelShellBody variant={variant}>{children}</PanelShellBody>
    </PanelThemeProvider>
  );
}

function PanelShellBody({ variant, children }: PanelShellProps) {
  const { theme } = usePanelTheme();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileMenuSheetOpen, setMobileMenuSheetOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const brand = variant === "coach" ? "Koç paneli" : variant === "admin" ? "Admin paneli" : "Öğrenci paneli";
  const showCoachInsights = variant === "coach" && pathname.startsWith("/koc");

  /** Sohbet kabı viewport yüksekliğini doldurur; kaydırma mesaj listesi içinde kalır (mobil). */
  const isLiveChatFullHeight =
    pathname === "/ogrenci/canli-sohbet" || /^\/koc\/canli-sohbet\/.+/.test(pathname);

  const openSidebarForTour = useCallback(() => setMobileOpen(true), []);

  const studentNavOperasyon: NavItem[] = [
    { href: routes.student, label: "Genel bakış", exact: true, tourAnchorId: "pf-web-tour-nav-overview" },
    { href: routes.studentProgram, label: "Programım", exact: true, tourAnchorId: "pf-web-tour-nav-program" },
    { href: routes.studentAssessments, label: "Değerlendirmeler", exact: true, tourAnchorId: "pf-web-tour-nav-assessments" },
    { href: routes.studentPackages, label: "Paketlerim", exact: true, tourAnchorId: "pf-web-tour-nav-packages" },
    { href: routes.studentLiveChat, label: "Canlı sohbet", exact: true, tourAnchorId: "pf-web-tour-nav-chat" },
  ];

  const studentNavTopluluk: NavItem[] = [
    { href: routes.community, label: "Topluluk", tourAnchorId: "pf-web-tour-nav-community" },
    { href: routes.beforeAfterMine, label: "Değişimim", exact: true, tourAnchorId: "pf-web-tour-nav-beforeafter" },
    { href: routes.beforeAfterExplore, label: "Keşfet", exact: true, tourAnchorId: "pf-web-tour-nav-explore" },
  ];

  const coachNavOperasyon: NavItem[] = [
    { href: routes.coach, label: "Özet", exact: true },
    { href: routes.coachStudents, label: "Öğrenciler", activeIgnoreSearch: true },
    { href: routes.coachStudentsReviewQueue, label: "Form incelemesi", suppressActive: true },
    { href: routes.coachPrograms, label: "Programlar" },
    { href: routes.coachProgramFeedback, label: "Durum bildirimleri", exact: true },
    { href: routes.coachLiveChat, label: "Canlı sohbet" },
    { href: routes.coachExercises, label: "Egzersizler" },
  ];

  const coachNavTopluluk: NavItem[] = [
    { href: routes.beforeAfterMine, label: "Değişimim", exact: true },
    { href: routes.beforeAfterExplore, label: "Keşfet", exact: true },
  ];

  const coachNavBaglanti: NavItem[] = [{ href: routes.community, label: "Topluluk" }];

  /** `admin-nav.ts` ile WebUI Admin menüsü hizalı. */
  const adminNavItemsOperasyon = adminNavOperasyon as NavItem[];
  const adminNavItemsTopluluk = adminNavTopluluk as NavItem[];
  const adminNavItemsSistem = adminNavSistem as NavItem[];

  const panelNavAccent: PanelNavAccent = variant === "student" ? "student" : variant === "coach" ? "coach" : "admin";

  const mobileNavItems =
    variant === "admin"
      ? [
          { href: routes.admin, label: "Özet", icon: <NavIcon path="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /> },
          { href: routes.adminUsers, label: "Kullanıcı", icon: <NavIcon path="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8m11 14v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /> },
          { href: routes.adminModeration, label: "Onay", icon: <NavIcon path="M12 2 3 6v6c0 5 3.8 9.5 9 10 5.2-.5 9-5 9-10V6l-9-4zM9 12l2 2 4-4" /> },
          { href: routes.adminPayments, label: "Ödeme", icon: <NavIcon path="M4 6h16M4 12h16M4 18h16" /> },
        ]
      : variant === "coach"
      ? [
          { href: routes.coach, label: "Genel Bakış", icon: <NavIcon path="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /> },
          { href: routes.coachPrograms, label: "Programlar", icon: <NavIcon path="M7 4h10M7 10h10M7 16h10M4 4h.01M4 10h.01M4 16h.01" /> },
          { href: routes.coachStudentsReviewQueue, label: "Değerlendirme", icon: <NavIcon path="M9 12l2 2 4-4M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" /> },
          { href: routes.coachLiveChat, label: "Sohbet", icon: <NavIcon path="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H5l-2 2v-7.5A8.5 8.5 0 1 1 21 11.5z" />, badgeCount: chatUnread },
        ]
      : [
          { href: routes.student, label: "Genel Bakış", icon: <NavIcon path="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /> },
          { href: routes.studentProgram, label: "Programım", icon: <NavIcon path="M6 20V10m6 10V4m6 16v-8M4 10h4M10 6h4M16 14h4" /> },
          { href: routes.studentAssessments, label: "Değerlendirme", icon: <NavIcon path="M9 12l2 2 4-4M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" /> },
          { href: routes.studentLiveChat, label: "Sohbet", icon: <NavIcon path="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H5l-2 2v-7.5A8.5 8.5 0 1 1 21 11.5z" />, badgeCount: chatUnread },
        ];

  return (
    <div
      data-panel-theme={theme}
      style={
        variant === "student" || variant === "coach"
          ? { colorScheme: theme === "light" ? ("light" as const) : ("dark" as const) }
          : undefined
      }
      className={cn(
        "flex h-full min-h-0 min-w-0 flex-1 transition-colors duration-300 ease-out",
        variant === "student" && "pf-panel-root-student",
        variant === "coach" && "pf-panel-root-coach",
        variant === "admin" && "bg-[#080808]",
      )}
    >
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          aria-label="Menüyü kapat"
          onClick={closeMobile}
        />
      ) : null}

      <aside
        id="panel-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[min(100%,280px)] transform border-r shadow-2xl transition-transform lg:static lg:z-0 lg:translate-x-0 lg:shadow-none",
          variant === "student" && "pf-sidebar-student",
          variant === "coach" && "pf-sidebar-coach",
          variant === "admin" && "border-white/10 bg-[#090909]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-full flex-col">
          <div
            className={cn(
              "border-b p-4",
              variant === "student" && cn(theme === "light" ? "border-orange-800/13" : "border-orange-500/20"),
              variant === "coach" && cn(theme === "light" ? "border-pink-400/29" : "border-pink-500/26"),
              variant === "admin" && "border-white/10",
            )}
          >
            <Link href={variant === "coach" ? routes.coach : variant === "admin" ? routes.admin : routes.student} className="flex items-center gap-3" onClick={closeMobile}>
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-2xl border font-display text-lg font-bold",
                  variant === "coach" &&
                    cn(
                      "border-rose-400/48 bg-gradient-to-br from-pink-500/[0.26] to-pf-orange/[0.22]",
                      theme === "light"
                        ? "text-orange-950 shadow-[0_0_20px_-6px_rgba(251,146,60,0.28)]"
                        : "text-pink-50 shadow-[0_0_24px_-6px_rgba(244,114,182,0.38)]",
                    ),
                  variant === "student" &&
                    cn(
                      "border-orange-400/45 bg-gradient-to-br from-pf-orange/30 to-pink-500/20 shadow-[0_0_22px_-6px_rgba(249,115,22,0.45)]",
                      theme === "light" ? "text-orange-950" : "text-pf-orange-bright",
                    ),
                  variant === "admin" &&
                    "border-purple-400/35 bg-purple-950/65 text-purple-200 shadow-[0_0_22px_-6px_rgba(139,92,246,0.28)]",
                )}
              >
                {variant === "coach" ? "K" : variant === "admin" ? "A" : "Ö"}
              </span>
              <span className="leading-tight">
                <span
                  className={cn(
                    "block font-display text-sm font-bold",
                    variant === "admin" ? "text-white" : theme === "light" ? "text-stone-900" : "text-white",
                  )}
                >
                  {brand}
                </span>
                <span
                  className={cn(
                    "text-xs",
                    variant === "student" && cn(theme === "light" ? "text-orange-800/76" : "text-orange-300/65"),
                    variant === "coach" && cn(theme === "light" ? "text-rose-900/73" : "text-pink-300/71"),
                    variant === "admin" && "text-zinc-500",
                  )}
                >
                  PT Fraoula
                </span>
              </span>
            </Link>
          </div>
          <div
            id={variant === "student" ? "pf-web-tour-sidebar-nav" : undefined}
            className="flex-1 overflow-y-auto p-3"
          >
            {variant === "coach" ? (
              <>
                <NavSection title="Operasyon" accent="coach" items={coachNavOperasyon} onNavigate={closeMobile} />
                <NavSection title="Topluluk" accent="coach" items={coachNavTopluluk} onNavigate={closeMobile} />
                <NavSection title="Bağlantılar" accent="coach" items={coachNavBaglanti} onNavigate={closeMobile} />
              </>
            ) : variant === "admin" ? (
              <>
                <NavSection title="İş süreçleri" accent="admin" items={adminNavItemsOperasyon} onNavigate={closeMobile} />
                <NavSection title="Topluluk & iletişim" accent="admin" items={adminNavItemsTopluluk} onNavigate={closeMobile} />
                <NavSection title="Sistem" accent="admin" items={adminNavItemsSistem} onNavigate={closeMobile} />
                <NavSection title="Bağlantılar" accent="admin" items={[{ href: routes.community, label: "Topluluk" }]} onNavigate={closeMobile} />
              </>
            ) : (
              <>
                <NavSection title="Operasyon" accent="student" items={studentNavOperasyon} onNavigate={closeMobile} />
                <NavSection title="Topluluk" accent="student" items={studentNavTopluluk} onNavigate={closeMobile} />
                <NavSection
                  title="Bağlantılar"
                  accent="student"
                  items={[{ href: routes.packages, label: "Paket mağazası", tourAnchorId: "pf-web-tour-nav-shop" }]}
                  onNavigate={closeMobile}
                />
              </>
            )}
          </div>
          <div
            className={cn(
              "border-t p-3 text-sm",
              variant === "student" && cn(theme === "light" ? "border-orange-900/13" : "border-orange-500/15"),
              variant === "coach" && cn(theme === "light" ? "border-pink-400/31" : "border-pink-500/26"),
              variant === "admin" && "border-white/10",
            )}
          >
            <Link
              href={routes.home}
              className={cn(
                "block rounded-lg px-3 py-2 transition",
                variant === "admin" && "text-zinc-400 hover:bg-white/5 hover:text-white",
                variant !== "admin" &&
                  theme === "light" &&
                  (variant === "student" || variant === "coach") &&
                  "text-stone-700 hover:bg-orange-950/[0.035] hover:text-orange-950",
                variant !== "admin" &&
                  theme !== "light" &&
                  (variant === "student" || variant === "coach") &&
                  "text-zinc-400 hover:bg-pink-500/10 hover:text-orange-50",
              )}
              onClick={closeMobile}
            >
              Ana site
            </Link>
            <button
              type="button"
              onClick={() => {
                closeMobile();
                logout();
              }}
              className={cn(
                "mt-1 w-full rounded-lg px-3 py-2 text-left transition",
                variant === "admin" && "text-zinc-400 hover:bg-white/5 hover:text-purple-300",
                variant !== "admin" &&
                  theme === "light" &&
                  (variant === "student" || variant === "coach") &&
                  "text-stone-700 hover:bg-orange-950/[0.035] hover:text-orange-950",
                variant !== "admin" &&
                  theme !== "light" &&
                  (variant === "student" || variant === "coach") &&
                  "text-zinc-400 hover:bg-pink-500/12 hover:text-pf-orange-bright",
              )}
            >
              Çıkış
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:ml-0">
        <header
          className={cn(
            "sticky top-0 z-30 shrink-0 border-b backdrop-blur-md backdrop-saturate-150",
            variant === "student" &&
              cn("pf-panel-header-student", theme === "light" ? "border-b-orange-950/13 bg-orange-50/88" : "bg-[rgba(10,9,9,0.92)]"),
            variant === "coach" &&
              cn("pf-panel-header-coach", theme === "light" ? "border-b-pink-900/17 bg-orange-50/88" : "bg-[rgba(14,11,13,0.92)]"),
            variant === "admin" && "border-white/10 bg-[#090909]/95",
          )}
        >
          <div className="flex h-14 items-center justify-between gap-3 px-4 lg:h-16">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className={cn(
                  "rounded-lg border p-2 lg:hidden",
                  variant === "student" &&
                    cn(theme === "light" ? "border-orange-300/73 text-orange-950" : "border-orange-400/35 text-orange-100/95"),
                  variant === "coach" &&
                    cn(theme === "light" ? "border-orange-300/71 text-orange-950" : "border-rose-400/38 text-orange-50/93"),
                  variant === "admin" && "border-white/15 text-zinc-300",
                )}
                aria-expanded={mobileOpen}
                aria-controls="panel-sidebar"
                onClick={() => setMobileOpen((o) => !o)}
              >
                <span className="sr-only">Menü</span>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="hidden min-w-0 sm:block">
                <p
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider",
                    (variant === "student" || variant === "coach") &&
                      cn(
                        theme === "light"
                          ? "text-orange-950"
                          : "text-transparent bg-gradient-to-r from-pf-orange-bright via-pink-400 to-purple-400 bg-clip-text",
                      ),
                    variant === "admin" && "text-pf-orange-bright",
                  )}
                >
                  {brand}
                </p>
                <p
                  className={cn(
                    "truncate text-xs",
                    variant !== "admin" && theme === "light" ? "text-stone-600" : "text-zinc-400",
                  )}
                >
                  {user?.email}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <PanelThemeToggle />
              <DemoFeedbackHeaderButton />
              <PanelNotificationCenter variant={variant} pathname={pathname} onChatUnreadChange={setChatUnread} />
              <PanelUserMenu />
            </div>
          </div>
          {showCoachInsights ? <CoachTopBarInsights /> : null}
        </header>
        <main
          id="icerik"
          tabIndex={-1}
          className={`min-h-0 min-w-0 flex-1 outline-none ${
            isLiveChatFullHeight ? "flex flex-col overflow-hidden" : "overflow-y-auto"
          }`}
        >
          <div
            className={cn(
              "mx-auto min-w-0 max-w-6xl px-4 outline-none",
              variant === "student" && "pf-panel-main-student",
              variant === "coach" && "pf-panel-main-coach",
              isLiveChatFullHeight
                ? "flex h-full min-h-0 flex-1 flex-col pb-24 pt-2 lg:px-8 lg:py-4"
                : "pb-24 pt-4 lg:px-8 lg:py-8",
            )}
          >
            {children}
          </div>
        </main>
      </div>
      <MobileBottomNav
        panelAccent={panelNavAccent}
        items={mobileNavItems.map((item) => ({
          ...item,
          active: pathname === item.href || pathname.startsWith(`${item.href}/`),
        }))}
        onMenuClick={() => setMobileMenuSheetOpen(true)}
      />
      {mobileMenuSheetOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            aria-label="Menüyü kapat"
            onClick={() => setMobileMenuSheetOpen(false)}
          />
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 max-h-[75vh] overflow-y-auto rounded-t-3xl border p-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]",
              variant === "student" &&
                cn(
                  theme === "light"
                    ? "border-orange-300/53 bg-gradient-to-b from-orange-50/98 via-orange-50/92 to-orange-50/88"
                    : "border-orange-400/25 bg-gradient-to-b from-[#1a1512] via-[#12100e] to-[#0c0b0a]",
                ),
              variant === "coach" &&
                cn(
                  theme === "light"
                    ? "border-pink-300/48 bg-gradient-to-b from-orange-50/97 via-orange-50/91 to-orange-50/86"
                    : "border-pink-400/29 bg-gradient-to-b from-[#171114] via-[#120f11] to-[#0e0c0d]",
                ),
              variant === "admin" && "border-white/10 bg-[#111111]",
            )}
          >
            <div
              className={cn(
                "mx-auto mb-4 h-1.5 w-14 rounded-full",
                variant === "student" && "bg-gradient-to-r from-pf-orange/80 to-pink-500/70",
                variant === "coach" && "bg-gradient-to-r from-pink-400/82 to-pf-orange-bright/75",
                variant === "admin" && "bg-white/25",
              )}
            />
            <p
              className={cn(
                "mb-3 text-xs font-bold uppercase tracking-[0.2em]",
                variant === "student" && cn(theme === "light" ? "text-orange-900/92" : "text-orange-400/95"),
                variant === "coach" && cn(theme === "light" ? "text-rose-900/93" : "text-pink-300/93"),
                variant === "admin" && "text-zinc-400",
              )}
            >
              Tüm menü
            </p>
            <div className="space-y-4">
              {variant === "coach" ? (
                <>
                  <NavSection title="Operasyon" accent="coach" items={coachNavOperasyon} onNavigate={() => setMobileMenuSheetOpen(false)} />
                  <NavSection title="Topluluk" accent="coach" items={coachNavTopluluk} onNavigate={() => setMobileMenuSheetOpen(false)} />
                </>
              ) : variant === "admin" ? (
                <>
                  <NavSection title="İş süreçleri" accent="admin" items={adminNavItemsOperasyon} onNavigate={() => setMobileMenuSheetOpen(false)} />
                  <NavSection title="Topluluk & iletişim" accent="admin" items={adminNavItemsTopluluk} onNavigate={() => setMobileMenuSheetOpen(false)} />
                  <NavSection title="Sistem" accent="admin" items={adminNavItemsSistem} onNavigate={() => setMobileMenuSheetOpen(false)} />
                  <NavSection title="Bağlantılar" accent="admin" items={[{ href: routes.community, label: "Topluluk" }]} onNavigate={() => setMobileMenuSheetOpen(false)} />
                </>
              ) : (
                <>
                  <NavSection title="Operasyon" accent="student" items={studentNavOperasyon} onNavigate={() => setMobileMenuSheetOpen(false)} />
                  <NavSection title="Topluluk" accent="student" items={studentNavTopluluk} onNavigate={() => setMobileMenuSheetOpen(false)} />
                </>
              )}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuSheetOpen(false);
                  logout();
                }}
                className={cn(
                  "w-full rounded-xl border px-3 py-2 text-left transition",
                  theme === "light" && (variant === "student" || variant === "coach")
                    ? "border-orange-300/61 text-orange-950 hover:bg-orange-950/[0.04]"
                    : "border-white/15 text-zinc-300 hover:bg-white/5 hover:text-white",
                )}
              >
                Çıkış
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {variant === "student" ? <StudentPortalTour onNeedOpenSidebar={openSidebarForTour} /> : null}
    </div>
  );
}
