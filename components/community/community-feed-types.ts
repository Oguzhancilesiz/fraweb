/** API `CommunityFeedPostDto` / `SocialCommentNodeDto` (camelCase JSON).
 * `ContentModerationStatus`: Pending=0, Approved=1, Rejected=2 */

export const MODERATION_PENDING = 0;
export const MODERATION_APPROVED = 1;
export const MODERATION_REJECTED = 2;

/** Sort key: pending first, then rejected, then approved */
export function feedPostModerationSortKey(moderationStatus: number): number {
  const s = Number(moderationStatus);
  if (s === MODERATION_PENDING) return 0;
  if (s === MODERATION_REJECTED) return 1;
  return 2;
}

export function feedModerationLabel(status: unknown): string {
  const s = typeof status === "string" ? parseInt(status, 10) : Number(status);
  if (s === MODERATION_PENDING) return "Onay bekliyor";
  if (s === MODERATION_APPROVED) return "Onaylandı";
  if (s === MODERATION_REJECTED) return "Reddedildi";
  return "—";
}

export type CommunityFeedAttachmentJson = {
  url: string;
  contentType: string;
};

export type CommunityFeedPostMediaJson = {
  hasMedia: boolean;
  isBeforeAfterSplitLayout: boolean;
  beforeGallery: CommunityFeedAttachmentJson[];
  afterGallery: CommunityFeedAttachmentJson[];
  unifiedGallery: CommunityFeedAttachmentJson[];
};

export type SocialCommentNodeJson = {
  publicId: string;
  moderationStatus: number;
  moderationNote?: string | null;
  body: string;
  createdAtUtc: string;
  authorUserId: string;
  authorDisplayName: string;
  authorPhotoUrl?: string | null;
  likeCount: number;
  likedByMe: boolean;
  attachments: CommunityFeedAttachmentJson[];
  replies: SocialCommentNodeJson[];
  isForumPost: boolean;
};

export type CommunityFeedPostJson = {
  publicId: string;
  moderationStatus: number;
  moderationNote?: string | null;
  kind: number | string;
  body: string;
  heading?: string | null;
  periodLabel?: string | null;
  beforeImageCount?: number | null;
  createdAtUtc: string;
  authorUserId: string;
  authorDisplayName: string;
  authorPhotoUrl?: string | null;
  attachments: CommunityFeedAttachmentJson[];
  likeCount: number;
  likedByMe: boolean;
  totalCommentCount: number;
  loadedCommentNodeCount: number;
  hasMoreComments: boolean;
  commentsCursorBeforeUtc?: string | null;
  favoritedByMe: boolean;
  showOnPublicHomeSpotlight: boolean;
  showInMainCommunityFeed: boolean;
  comments: SocialCommentNodeJson[];
  removedFromCommunityAtUtc?: string | null;
  media: CommunityFeedPostMediaJson;
};

export type CommunityFeedPageJson = {
  items: CommunityFeedPostJson[];
  hasMore: boolean;
  nextBeforeUtc: string | null;
};

export type CommunityLikeUserJson = {
  userId: string;
  displayName: string;
  photoUrl?: string | null;
};

export const MAX_FEED_COMMENT_BODY = 2000;

export const FEED_KIND_OPTIONS = [
  { value: 0, label: "Genel" },
  { value: 1, label: "Öğün" },
  { value: 2, label: "Antrenman" },
  { value: 3, label: "Soru" },
] as const;
