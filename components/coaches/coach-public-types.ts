import type { CommunityFeedPostJson } from "../community/community-feed-types";
import type { ForumTopicListItemJson } from "../community/forum-types";

/** `GET …/community/coaches/{id}` — forum yanıt özeti. */
export type CoachForumReplyListItemJson = {
  postPublicId: string;
  topicPublicId: string;
  topicTitle: string;
  bodyPreview: string;
  createdAtUtc: string;
};

/** `GET …/community/coaches/{id}` tam yanıtı. */
export type CoachCommunityProfileJson = {
  coachUserId: string;
  displayName: string;
  bio?: string | null;
  photoUrl?: string | null;
  likeCount: number;
  likedByMe: boolean;
  viewerIsSelf: boolean;
  feedPosts: CommunityFeedPostJson[];
  forumTopics: ForumTopicListItemJson[];
  forumReplies: CoachForumReplyListItemJson[];
};
