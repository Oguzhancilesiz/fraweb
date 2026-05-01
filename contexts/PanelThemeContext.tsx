"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type PanelThemeMode = "light" | "dark";

const STORAGE_KEY = "pf-panel-theme-ui";

function readStoredTheme(): PanelThemeMode {
  if (typeof window === "undefined") return "dark";
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
  } catch {
    /* ignore */
  }
  return "dark";
}

type PanelThemeCtx = {
  theme: PanelThemeMode;
  setTheme: (t: PanelThemeMode) => void;
  toggle: () => void;
  enabled: boolean;
};

const PanelThemeContext = createContext<PanelThemeCtx | null>(null);

export function PanelThemeProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const [theme, setThemeState] = useState<PanelThemeMode>(() => (!enabled ? "dark" : readStoredTheme()));

  useEffect(() => {
    if (!enabled) {
      setThemeState("dark");
      return;
    }
    setThemeState(readStoredTheme());
  }, [enabled]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      if (e.newValue === "light" || e.newValue === "dark") setThemeState(e.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [enabled]);

  const setTheme = useCallback(
    (t: PanelThemeMode) => {
      if (!enabled) return;
      setThemeState(t);
      try {
        window.localStorage.setItem(STORAGE_KEY, t);
      } catch {
        /* ignore */
      }
    },
    [enabled],
  );

  const toggle = useCallback(() => {
    if (!enabled) return;
    setThemeState((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, [enabled]);

  const value = useMemo<PanelThemeCtx>(
    () => ({
      theme: enabled ? theme : "dark",
      setTheme,
      toggle,
      enabled,
    }),
    [enabled, theme, setTheme, toggle],
  );

  return <PanelThemeContext.Provider value={value}>{children}</PanelThemeContext.Provider>;
}

/** Öğrenci/koç paneli dışında varsayılan: karanlık, tema kapalı. */
export function usePanelTheme(): PanelThemeCtx {
  const ctx = useContext(PanelThemeContext);
  if (!ctx) {
    return { theme: "dark", setTheme: () => {}, toggle: () => {}, enabled: false };
  }
  return ctx;
}
