import { cache } from "react";
import { apiGetJson } from "./http";

/** API `CommunityBeforeAfterSpotlightDto`. Sunucudan PascalCase gelebilir; normalize edilir. */
export type PublicBeforeAfterSpotlightDto = {
  postPublicId: string;
  heading: string;
  periodLabel: string | null;
  descriptionExcerpt: string;
  beforeImageUrls: string[];
  afterImageUrls: string[];
  authorFirstName: string;
  authorFamilyName: string;
  authorPhotoUrl: string | null;
  authorAvatarInitial: string;
  authorIsCoach: boolean;
};

const revalidateSeconds = 120;

function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function strArr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

function bool(v: unknown): boolean {
  return v === true;
}

export function normalizeBeforeAfterSpotlightRow(raw: unknown): PublicBeforeAfterSpotlightDto | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const postPublicId = str(r.postPublicId ?? r.PostPublicId);
  if (!postPublicId) return null;
  const beforeImageUrls = strArr(r.beforeImageUrls ?? r.BeforeImageUrls);
  const afterImageUrls = strArr(r.afterImageUrls ?? r.AfterImageUrls);
  if (beforeImageUrls.length === 0 || afterImageUrls.length === 0) return null;
  return {
    postPublicId,
    heading: str(r.heading ?? r.Heading)?.trim() || "Dönüşüm",
    periodLabel: str(r.periodLabel ?? r.PeriodLabel)?.trim() || null,
    descriptionExcerpt: str(r.descriptionExcerpt ?? r.DescriptionExcerpt)?.trim() || "",
    beforeImageUrls,
    afterImageUrls,
    authorFirstName: str(r.authorFirstName ?? r.AuthorFirstName)?.trim() || "",
    authorFamilyName: str(r.authorFamilyName ?? r.AuthorFamilyName)?.trim() || "",
    authorPhotoUrl: str(r.authorPhotoUrl ?? r.AuthorPhotoUrl) ?? null,
    authorAvatarInitial: str(r.authorAvatarInitial ?? r.AuthorAvatarInitial)?.slice(0, 1)?.toUpperCase() || "?",
    authorIsCoach: bool(r.authorIsCoach ?? r.AuthorIsCoach),
  };
}

export const getPublicBeforeAfterSpotlight = cache(async (take = 8): Promise<PublicBeforeAfterSpotlightDto[]> => {
  const q = new URLSearchParams({ take: String(Math.min(Math.max(take, 1), 24)) });
  const rows = await apiGetJson<unknown[]>(`/api/v1/public/before-after/spotlight?${q.toString()}`, {
    next: { revalidate: revalidateSeconds },
  });
  if (!rows?.length) return [];
  return rows.map(normalizeBeforeAfterSpotlightRow).filter((x): x is PublicBeforeAfterSpotlightDto => x !== null);
});
