"use client";

export type AdminOverviewJson = {
  statistics: {
    usersInRoleStudent: number;
    usersInRoleCoach: number;
    usersInRoleAdmin: number;
    usersInRoleSuperAdmin: number;
    activeStudentPackagesCount: number;
    monthlyAssessmentsAwaitingCoachReviewCount: number;
    paidOrdersLast30DaysCount: number;
    paidOrdersLast30DaysTotalTry: number;
    auditLogEntriesLast24Hours: number;
    trainingProgramsPublishedCount: number;
    trainingProgramsDraftCount: number;
    activeCoachingPackagesInCatalogCount: number;
    exerciseCatalogCacheRowsCount: number;
  };
  moderationPendingFeedPosts: number;
  moderationPendingFeedComments: number;
  moderationPendingForumTopics: number;
  moderationPendingForumPosts: number;
  moderationPendingTotal: number;
};

export type AdminCommunityStatsJson = {
  feedPostsTotal: number;
  feedPostsPending: number;
  feedPostsApproved: number;
  feedPostsRejected: number;
  feedCommentsTotal: number;
  feedCommentsPending: number;
  feedCommentsApproved: number;
  feedCommentsRejected: number;
  forumTopicsTotal: number;
  forumTopicsPending: number;
  forumTopicsApproved: number;
  forumTopicsRejected: number;
  forumPostsTotal: number;
  forumPostsPending: number;
  forumPostsApproved: number;
  forumPostsRejected: number;
};

export type AdminUsersResultJson = {
  totalCount: number;
  items: Array<{
    id: string;
    email: string;
    fullName: string;
    emailConfirmed: boolean;
    isActive: boolean;
    lastLoginAtUtc?: string | null;
    roles: string[];
  }>;
};

export type ModerationPendingJson = {
  feedPosts: Array<{
    publicId: string;
    preview: string;
    kindLabel: string;
    authorDisplayName: string;
    authorEmail?: string;
    createdAtUtc: string;
    mediaUrls?: string[];
  }>;
  feedComments: Array<{
    publicId: string;
    feedPostPublicId?: string;
    postPreview?: string;
    postMediaUrls?: string[];
    preview: string;
    authorDisplayName: string;
    createdAtUtc: string;
  }>;
  forumTopics: Array<{ publicId: string; title: string; authorDisplayName: string; createdAtUtc: string; openingPreview?: string }>;
  forumPosts: Array<{
    publicId: string;
    preview: string;
    topicTitle: string;
    topicPublicId?: string;
    authorDisplayName: string;
    createdAtUtc: string;
    mediaUrls?: string[];
  }>;
};

export function hasAdminRole(roles: string[] | undefined): boolean {
  if (!roles?.length) return false;
  return roles.some((r) => r === "Admin" || r === "SuperAdmin");
}

export function fmtDate(value?: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return value;
  }
}
