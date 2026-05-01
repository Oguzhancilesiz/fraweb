"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

export type SiteTheme = "light" | "dark";

const STORAGE_KEY = "pf-site-theme";

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("pf-site-theme", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("pf-site-theme", onStoreChange);
  };
}

function getSnapshot(): SiteTheme {
  if (typeof document === "undefined") return "dark";
  const raw = document.documentElement.getAttribute("data-site-theme");
  return raw === "light" || raw === "dark" ? raw : "dark";
}

function getServerSnapshot(): SiteTheme {
  return "dark";
}

function persistTheme(theme: SiteTheme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
  document.documentElement.setAttribute("data-site-theme", theme);
  window.dispatchEvent(new Event("pf-site-theme"));
}

type SiteThemeCtx = {
  theme: SiteTheme;
  setTheme: (t: SiteTheme) => void;
  toggleTheme: () => void;
};

const SiteThemeContext = createContext<SiteThemeCtx | null>(null);

export function SiteThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((t: SiteTheme) => {
    persistTheme(t);
  }, []);

  const toggleTheme = useCallback(() => {
    persistTheme(theme === "light" ? "dark" : "light");
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);

  return <SiteThemeContext.Provider value={value}>{children}</SiteThemeContext.Provider>;
}

export function useSiteTheme() {
  const ctx = useContext(SiteThemeContext);
  if (!ctx) {
    return {
      theme: "dark" as SiteTheme,
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }
  return ctx;
}
