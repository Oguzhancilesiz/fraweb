"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api/client";
import { clearSession, getAccessToken, getStoredUser, setSession } from "@/lib/auth/session-browser";
import type { AuthUser, LoginResponse } from "@/lib/auth/types";
import { routes } from "@/lib/site";

type LoginOutcome = { ok: true; roles: string[] } | { ok: false; message: string };

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<LoginOutcome>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setToken(getAccessToken());
    setUser(getStoredUser());
    setReady(true);
  }, []);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === "ptf_access_token" && !e.newValue) {
        setUser(null);
        setToken(null);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginOutcome> => {
    const r = await apiFetch<LoginResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: email.trim(), password }),
    });
    if (!r.ok) return { ok: false, message: r.message };
    const exp =
      typeof r.data.expiresAtUtc === "string"
        ? r.data.expiresAtUtc
        : new Date(r.data.expiresAtUtc as unknown as string).toISOString();
    setSession(r.data.accessToken, exp, r.data.user);
    setToken(r.data.accessToken);
    const nextUser: AuthUser = {
      userId: r.data.user.userId,
      email: r.data.user.email,
      fullName: r.data.user.fullName ?? null,
      roles: r.data.user.roles ?? [],
    };
    setUser(nextUser);
    return { ok: true, roles: nextUser.roles };
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setToken(null);
    router.push(routes.home);
  }, [router]);

  const refreshUser = useCallback(async () => {
    const t = getAccessToken();
    if (!t) return;
    const r = await apiFetch<AuthUser>("/api/v1/auth/me", { accessToken: t });
    if (r.ok && r.data) {
      setUser(r.data);
      if (typeof window !== "undefined") {
        localStorage.setItem("ptf_user", JSON.stringify(r.data));
      }
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      ready,
      login,
      logout,
      refreshUser,
    }),
    [user, token, ready, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth yalnızca AuthProvider içinde kullanılmalıdır.");
  return ctx;
}
