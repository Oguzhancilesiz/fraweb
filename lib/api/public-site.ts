import { cache } from "react";
import { apiGetJson } from "./http";
import type { PublicSiteMeta } from "./types-public";

const revalidateSeconds = 120;

/** Aynı istekte layout + sayfa metadata tekrar çağırınca tek fetch. */
export const getPublicSiteMeta = cache(async (): Promise<PublicSiteMeta | null> => {
  return apiGetJson<PublicSiteMeta>("/api/v1/public/site/meta", {
    next: { revalidate: revalidateSeconds },
  });
});
