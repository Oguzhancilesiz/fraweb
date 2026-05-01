/** Sunucu + istemci: kök `package.json` script’inde NEXT_PUBLIC_API_URL set edilir. */
export function getPublicApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (raw) return raw.replace(/\/+$/, "");
  return "http://localhost:5289";
}
