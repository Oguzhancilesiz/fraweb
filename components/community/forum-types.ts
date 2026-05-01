import type { SocialCommentNodeJson } from "./community-feed-types";

/** `GET …/forum/topics` satırı. */
export type ForumTopicListItemJson = {
  publicId: string;
  title: string;
  lastActivityUtc: string;
  createdAtUtc?: string;
  commentCount: number;
  authorDisplayName: string;
  authorUserId?: string;
  authorPhotoUrl?: string | null;
  likeCount: number;
  moderationStatus?: number;
  moderationNote?: string | null;
  removedFromCommunityAtUtc?: string | null;
};

/** `GET …/forum/topics/{id}` yanıtı. */
export type ForumTopicDetailJson = {
  publicId: string;
  title: string;
  openingBody: string;
  createdAtUtc: string;
  authorUserId: string;
  authorDisplayName: string;
  authorPhotoUrl?: string | null;
  topicLikeCount: number;
  topicLikedByMe: boolean;
  moderationStatus: number;
  moderationNote?: string | null;
  comments: SocialCommentNodeJson[];
};
