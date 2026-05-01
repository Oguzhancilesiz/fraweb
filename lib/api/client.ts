import { getPublicApiBaseUrl } from "./config";

export type ApiOk<T> = { ok: true; status: number; data: T };
export type ApiErr = { ok: false; status: number; message: string };
export type ApiResult<T> = ApiOk<T> | ApiErr;

function parseErrorBody(text: string, fallback: string): string {
  try {
    const j = JSON.parse(text) as Record<string, unknown>;
    if (typeof j.detail === "string" && j.detail.trim()) return j.detail.trim();
    if (typeof j.title === "string" && j.title.trim()) return j.title.trim();
    if (typeof j.message === "string" && j.message.trim()) return j.message.trim();
    if (typeof j.error === "string" && j.error.trim()) return j.error.trim();
    if (typeof j.errorMessage === "string" && j.errorMessage.trim()) return j.errorMessage.trim();
    const errs = j.errors;
    if (errs && typeof errs === "object" && !Array.isArray(errs)) {
      const lines = Object.values(errs as Record<string, string[]>)
        .flat()
        .filter((x): x is string => typeof x === "string" && x.length > 0);
      if (lines.length) return lines.join(" ");
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

/** Tarayıcıdan API çağrısı (CORS + Bearer). */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { accessToken?: string | null },
): Promise<ApiResult<T>> {
  const base = getPublicApiBaseUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...((init?.headers as Record<string, string>) ?? {}),
  };
  if (init?.body && typeof init.body === "string" && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  const token = init?.accessToken;
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(url, { ...init, headers });
    if (res.status === 204) return { ok: true, status: 204, data: undefined as T };
    const text = await res.text();
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        message: parseErrorBody(text, res.statusText || "İstek başarısız"),
      };
    }
    if (!text) return { ok: true, status: res.status, data: undefined as T };
    return { ok: true, status: res.status, data: JSON.parse(text) as T };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      message: e instanceof Error ? e.message : "Ağ hatası",
    };
  }
}
