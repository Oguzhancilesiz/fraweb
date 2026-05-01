"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePanelTheme } from "@/contexts/PanelThemeContext";
import { cn } from "@/components/dashboard/DashboardUI";
import { apiFetch } from "@/lib/api/client";
import { canAccessAdminArea, canAccessCoachArea } from "@/lib/auth/paths";
import { resolveMediaUrl } from "@/lib/media";
import { routes } from "@/lib/site";

type CoachSettings = {
  fullName?: string;
  displayName?: string;
  email?: string;
  profilePhotoUrl?: string | null;
};

type StudentSettings = {
  fullName?: string;
  email?: string;
  profilePhotoUrl?: string | null;
};

type ProfileGet =
  | { role: "coach"; settings: CoachSettings }
  | { role: "student"; settings: StudentSettings };

function initialsFrom(name: string | null | undefined, email: string | null | undefined): string {
  const s = (name?.trim() || email?.trim() || "?").replace(/\s+/g, " ");
  const parts = s.split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return s.slice(0, 2).toUpperCase() || "?";
}

function roleSummaryTr(roles: string[]): string {
  const set = new Set(roles.map((r) => r.trim()));
  if (set.has("SuperAdmin")) return "Süper yönetici";
  if (set.has("Admin")) return "Yönetici";
  if (set.has("Coach") && set.has("Student")) return "Koç · Öğrenci";
  if (set.has("Coach")) return "Koç";
  if (set.has("Student")) return "Öğrenci";
  return roles[0] ?? "Üye";
}

export function PanelUserMenu() {
  const { theme, enabled } = usePanelTheme();
  const panelLight = enabled && theme === "light";
  const { user, token, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [imgBroken, setImgBroken] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const loadProfile = useCallback(async () => {
    if (!token) return;
    const r = await apiFetch<ProfileGet>("/api/v1/profile", { accessToken: token });
    if (!r.ok) return;
    const s = r.data.settings;
    if (r.data.role === "coach") {
      const c = s as CoachSettings;
      const name = c.displayName?.trim() || c.fullName?.trim() || null;
      setDisplayName(name);
      setPhotoUrl(resolveMediaUrl(c.profilePhotoUrl));
    } else {
      const st = s as StudentSettings;
      setDisplayName(st.fullName?.trim() || null);
      setPhotoUrl(resolveMediaUrl(st.profilePhotoUrl));
    }
  }, [token]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;

  const email = user.email;
  const name = displayName?.trim() || user.fullName?.trim() || email.split("@")[0] || "Hesap";
  const initials = initialsFrom(displayName || user.fullName, email);
  const roles = user.roles ?? [];
  const badge = roleSummaryTr(roles);
  const isStudent = roles.some((r) => r === "Student");
  const isCoachRole = roles.some((r) => r === "Coach");
  const showAdminLink = canAccessAdminArea(roles);
  const showCoachLink = canAccessCoachArea(roles);
  const showCommunityLinks = isStudent || isCoachRole;
  const showProfileSettingsLink = showCommunityLinks || showAdminLink;

  const showPhoto = photoUrl && !imgBroken;

  const menuLink = cn(
    "block px-4 py-2.5",
    panelLight
      ? "text-stone-800 hover:bg-orange-950/[0.042] hover:text-orange-950"
      : "text-zinc-300 hover:bg-white/5 hover:text-white",
  );

  return (
    <div ref={wrapRef} className="relative z-50">
      <button
        type="button"
        className={cn(
          "flex max-w-[min(100%,220px)] items-center gap-2 rounded-xl border px-2 py-1.5 text-left transition",
          panelLight
            ? "border-orange-900/16 bg-white/90 shadow-[0_1px_0_rgba(255,255,255,0.75)] hover:border-orange-800/22 hover:bg-orange-50/93"
            : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10",
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Hesap menüsü"
        onClick={() =>
          setOpen((prev) => {
            const next = !prev;
            if (next) void loadProfile();
            return next;
          })
        }
      >
        {showPhoto ? (
          <img
            src={photoUrl}
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 rounded-full object-cover"
            onError={() => setImgBroken(true)}
          />
        ) : (
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-display text-xs font-bold",
              panelLight
                ? "border-pf-orange-bright/53 bg-pink-100/78 text-orange-950"
                : "border-pf-orange/40 bg-pf-orange/15 text-pf-orange-bright",
            )}
            aria-hidden
          >
            {initials}
          </span>
        )}
        <span className="hidden min-w-0 flex-1 flex-col sm:flex">
          <span className={cn("truncate text-xs font-semibold", panelLight ? "text-stone-900" : "text-white")}>{name}</span>
          <span className={cn("truncate text-[10px]", panelLight ? "text-stone-600" : "text-zinc-500")}>{badge}</span>
        </span>
        <svg
          className={cn(
            "hidden h-4 w-4 shrink-0 sm:block transition-transform",
            panelLight ? "text-stone-500" : "text-zinc-500",
            open ? "rotate-180" : "",
          )}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute right-0 mt-2 w-[min(100vw-2rem,17rem)] rounded-2xl border py-2 shadow-2xl",
            panelLight
              ? "border-orange-950/13 bg-orange-50/97 backdrop-blur-md"
              : "border-white/10 bg-pf-ink",
          )}
        >
          <div className={cn("border-b px-4 pb-3 pt-1", panelLight ? "border-orange-950/13" : "border-white/10")}>
            <p className={cn("truncate font-semibold", panelLight ? "text-stone-900" : "text-white")}>{name}</p>
            <p className={cn("truncate text-xs", panelLight ? "text-stone-600" : "text-zinc-500")}>{email}</p>
            <span
              className={cn(
                "mt-2 inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-medium",
                panelLight
                  ? "border-orange-900/15 bg-white/84 text-stone-700"
                  : "border-white/15 bg-white/5 text-zinc-300",
              )}
            >
              {badge}
            </span>
          </div>
          <ul className="py-1 text-sm">
            <li>
              <Link href={routes.home} role="menuitem" className={menuLink} onClick={() => setOpen(false)}>
                Ana site
              </Link>
            </li>
            {isStudent ? (
              <li>
                <Link href={routes.student} role="menuitem" className={menuLink} onClick={() => setOpen(false)}>
                  Öğrenci paneli
                </Link>
              </li>
            ) : null}
            {showCoachLink ? (
              <li>
                <Link href={routes.coach} role="menuitem" className={menuLink} onClick={() => setOpen(false)}>
                  Koç paneli
                </Link>
              </li>
            ) : null}
            {showAdminLink ? (
              <li>
                <Link href={routes.admin} role="menuitem" className={menuLink} onClick={() => setOpen(false)}>
                  Admin paneli
                </Link>
              </li>
            ) : null}
            {showCommunityLinks ? (
              <>
                <li>
                  <Link href={routes.community} role="menuitem" className={menuLink} onClick={() => setOpen(false)}>
                    Topluluk akışı
                  </Link>
                </li>
                <li>
                  <Link href={routes.communityMine} role="menuitem" className={menuLink} onClick={() => setOpen(false)}>
                    Paylaşımlarım
                  </Link>
                </li>
              </>
            ) : null}
            {showProfileSettingsLink ? (
              <li>
                <Link href={routes.profileSettings} role="menuitem" className={menuLink} onClick={() => setOpen(false)}>
                  Profil ayarları
                </Link>
              </li>
            ) : null}
            <li className={cn("my-2 border-t", panelLight ? "border-orange-950/13" : "border-white/10")} />
            <li>
              <button
                type="button"
                role="menuitem"
                className={cn(
                  "w-full px-4 py-2.5 text-left",
                  panelLight ? "text-red-800 hover:bg-red-600/15" : "text-red-300 hover:bg-red-500/10",
                )}
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
              >
                Çıkış yap
              </button>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}
