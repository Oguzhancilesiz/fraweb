import { apiGetJson } from "./http";
import type { PublicPackageDetailResponse, PublicPackageListItem } from "./types-public";

const revalidateSeconds = 60;

export async function listPublicPackages(): Promise<PublicPackageListItem[] | null> {
  return apiGetJson<PublicPackageListItem[]>("/api/v1/public/packages", {
    next: { revalidate: revalidateSeconds },
  });
}

export async function getPublicPackageBySlug(slug: string): Promise<PublicPackageDetailResponse | null> {
  return apiGetJson<PublicPackageDetailResponse>(
    `/api/v1/public/packages/${encodeURIComponent(slug)}`,
    { next: { revalidate: revalidateSeconds } },
  );
}
