import { getPublicApiBaseUrl } from "./config";

type FetchInit = RequestInit & { next?: { revalidate?: number } };

/** Sunucu bileşenlerinde API çağrısı (CORS yok). İstemci tarafında kullanmayın. */
export async function apiGetJson<T>(path: string, init?: FetchInit): Promise<T | null> {
  const base = getPublicApiBaseUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        ...init?.headers,
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
