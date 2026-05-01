import { AUTH_EXPIRES_KEY, AUTH_TOKEN_KEY, AUTH_USER_KEY } from "./constants";
import type { AuthUser } from "./types";

function mapPayloadUser(u: LoginResponseUser): AuthUser {
  return {
    userId: u.userId,
    email: u.email,
    fullName: u.fullName ?? null,
    roles: u.roles ?? [],
  };
}

type LoginResponseUser = {
  userId: string;
  email: string;
  fullName?: string | null;
  roles?: string[];
};

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  const t = localStorage.getItem(AUTH_TOKEN_KEY);
  const exp = localStorage.getItem(AUTH_EXPIRES_KEY);
  if (!t || !exp) return null;
  const ms = Date.parse(exp);
  if (Number.isFinite(ms) && Date.now() > ms) {
    clearSession();
    return null;
  }
  return t;
}

export function setSession(accessToken: string, expiresAtUtc: string, user: LoginResponseUser) {
  localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
  localStorage.setItem(AUTH_EXPIRES_KEY, expiresAtUtc);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(mapPayloadUser(user)));
}

export function clearSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_EXPIRES_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}
