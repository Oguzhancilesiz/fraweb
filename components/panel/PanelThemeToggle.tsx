"use client";

import { usePanelTheme } from "@/contexts/PanelThemeContext";
import { cn } from "@/components/dashboard/DashboardUI";

export function PanelThemeToggle() {
  const { enabled, theme, toggle } = usePanelTheme();

  if (!enabled) return null;

  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={() => toggle()}
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition",
        isLight
          ? "border-orange-300/70 bg-orange-50/85 text-orange-950 shadow-[0_1px_0_rgba(255,255,255,0.8)] hover:bg-orange-100/90"
          : "border-white/15 bg-white/[0.06] text-orange-50/95 hover:bg-white/10 hover:text-white",
      )}
      title={isLight ? "Karanlık tema" : "Aydınlık tema"}
      aria-label={isLight ? "Karanlık temaya geç" : "Aydınlık temaya geç"}
      aria-pressed={isLight}
    >
      {isLight ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}
