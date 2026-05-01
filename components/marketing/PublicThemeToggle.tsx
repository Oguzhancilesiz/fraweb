"use client";

import { useEffect, useState } from "react";
import { cn } from "@/components/dashboard/DashboardUI";
import { useSiteTheme } from "@/contexts/SiteThemeContext";

export function PublicThemeToggle({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const { theme, toggleTheme } = useSiteTheme();
  const isLight = theme === "light";

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <button
      type="button"
      onClick={() => toggleTheme()}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-pf-orange/45 focus-visible:ring-offset-2 disabled:opacity-40",
        isLight
          ? "border-orange-950/28 bg-white text-stone-800 shadow-sm hover:bg-orange-50 focus-visible:ring-offset-orange-50"
          : "border-white/18 bg-pf-raised text-zinc-200 hover:bg-white/5 focus-visible:ring-offset-pf-void",
        className,
      )}
      disabled={!mounted}
      aria-label={isLight ? "Karanlık moda geç" : "Aydınlık moda geç"}
      title={isLight ? "Karanlık mod" : "Aydınlık mod"}
      suppressHydrationWarning
    >
      {!mounted ? (
        <span className="h-4 w-4 rounded-full bg-current/20 opacity-35" aria-hidden />
      ) : isLight ? (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      )}
    </button>
  );
}
