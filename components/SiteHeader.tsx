"use client";

import Link from "next/link";
import { useState } from "react";
import { PublicThemeToggle } from "@/components/marketing/PublicThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { PanelUserMenu } from "@/components/panel/PanelUserMenu";
import { canAccessAdminArea, canAccessCoachArea } from "@/lib/auth/paths";
import { primaryDashboardPath } from "@/lib/auth/paths";
import { routes } from "@/lib/site";

const nav = [
  { href: "/#ust", label: "Anasayfa" },
  { href: "/#programlar", label: "Programlar" },
  { href: "/#nasil-calisir", label: "Nasıl çalışır?" },
  { href: routes.packages, label: "Paketler" },
  { href: routes.coaches, label: "Antrenörler" },
  { href: routes.community, label: "Topluluk" },
] as const;

function LogoMark() {
  return (
    <span
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-pf-orange/35 bg-gradient-to-br from-pf-orange/20 to-pf-pink/15 text-pf-orange transition group-hover:border-pf-orange/55"
      aria-hidden
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    </span>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, ready, logout } = useAuth();
  const dash = user ? primaryDashboardPath(user.roles) : null;
  const showAdminLink = canAccessAdminArea(user?.roles ?? []);
  const showCoachLink = canAccessCoachArea(user?.roles ?? []);
  const showStudentLink = !!user?.roles?.includes("Student");
  const showCommunityMineLink = showStudentLink || !!user?.roles?.includes("Coach");

  return (
    <header className="pf-site-header sticky top-0 z-50 border-b border-white/10 bg-pf-void/92 backdrop-blur-md transition-colors duration-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 lg:px-8">
        <Link href={routes.home} className="group flex items-center gap-2.5 text-lg font-bold tracking-tight" onClick={() => setOpen(false)}>
          <LogoMark />
          <span className="text-public-strong">
            PT <span className="bg-gradient-to-r from-pf-orange-bright to-pink-500 bg-clip-text text-transparent">Fraoula</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Ana menü">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="pf-site-nav-link rounded-lg px-3 py-2 text-sm font-medium transition">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <PublicThemeToggle />
          {ready && user ? (
            <>
              <PanelUserMenu />
              {dash ? (
                <Link
                  href={dash}
                  className="pf-header-panel-link rounded-full border border-white/22 px-3 py-2 text-sm font-semibold backdrop-blur-sm transition hover:border-pf-orange/45 hover:bg-pf-orange/8"
                >
                  Panele git
                </Link>
              ) : null}
            </>
          ) : (
            <>
              <Link href={routes.login} className="pf-header-auth-text rounded-full px-3 py-2 text-sm font-semibold transition">
                Giriş
              </Link>
              <Link
                href={routes.register}
                className="pf-header-register rounded-full border border-pf-pink/45 bg-gradient-to-br from-pf-orange/14 to-pf-pink/12 px-4 py-2 text-sm font-bold shadow-sm transition hover:border-pf-orange/55 hover:brightness-110"
              >
                Kayıt
              </Link>
            </>
          )}
          {!user ? (
            <Link
              href="/#onboarding-demo"
              className="rounded-full bg-gradient-to-r from-pf-orange to-pink-500 px-4 py-2 text-sm font-bold text-black shadow-lg shadow-pf-orange/18 transition hover:brightness-105"
            >
              Programa başla
            </Link>
          ) : null}
        </div>

        <div className="pf-mobile-menu-trigger flex h-10 items-center gap-1 rounded-xl border border-white/15 bg-pf-raised px-1.5 lg:hidden">
          <PublicThemeToggle className="h-9 w-9 shrink-0 border-0" />
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white transition hover:bg-white/8 focus:outline-none focus-visible:ring-2 focus-visible:ring-pf-orange/45"
            aria-expanded={open}
            aria-controls="pf-mobile-menu"
            aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {open ? (
        <div id="pf-mobile-menu" className="border-t border-white/10 bg-pf-ink/98 px-4 py-4 backdrop-blur-md lg:hidden">
          <div className="mx-auto max-w-7xl space-y-1">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-200" onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
              {ready && user ? (
                <>
                  {showStudentLink ? (
                    <Link href={routes.student} className="rounded-lg py-2.5 text-center text-sm font-semibold text-zinc-200" onClick={() => setOpen(false)}>
                      Öğrenci paneli
                    </Link>
                  ) : null}
                  {showCoachLink ? (
                    <Link href={routes.coach} className="rounded-lg py-2.5 text-center text-sm font-semibold text-zinc-200" onClick={() => setOpen(false)}>
                      Koç paneli
                    </Link>
                  ) : null}
                  {showAdminLink ? (
                    <Link href={routes.admin} className="rounded-lg py-2.5 text-center text-sm font-semibold text-zinc-200" onClick={() => setOpen(false)}>
                      Admin paneli
                    </Link>
                  ) : null}
                  <Link href={routes.profileSettings} className="rounded-lg py-2.5 text-center text-sm font-semibold text-zinc-200" onClick={() => setOpen(false)}>
                    Profil ayarları
                  </Link>
                  {showCommunityMineLink ? (
                    <Link href={routes.communityMine} className="rounded-lg py-2.5 text-center text-sm font-semibold text-zinc-200" onClick={() => setOpen(false)}>
                      Paylaşımlarım
                    </Link>
                  ) : null}
                  {dash ? (
                    <Link href={dash} className="rounded-lg py-2.5 text-center text-sm font-semibold text-pf-mist" onClick={() => setOpen(false)}>
                      Panele git
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    className="rounded-lg py-2.5 text-center text-sm font-semibold text-pf-mist"
                    onClick={() => {
                      setOpen(false);
                      logout();
                    }}
                  >
                    Çıkış
                  </button>
                </>
              ) : (
                <>
                  <Link href={routes.login} className="text-center text-sm font-semibold text-pf-mist" onClick={() => setOpen(false)}>
                    Giriş
                  </Link>
                  <Link href={routes.register} className="text-center text-sm font-semibold text-pf-orange-bright" onClick={() => setOpen(false)}>
                    Kayıt
                  </Link>
                </>
              )}
              {!user ? (
                <Link
                  href="/#onboarding-demo"
                  className="rounded-full bg-gradient-to-r from-pf-orange to-pink-500 py-3 text-center text-sm font-bold text-black"
                  onClick={() => setOpen(false)}
                >
                  Programa başla
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
