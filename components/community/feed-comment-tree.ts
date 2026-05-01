import type { CommunityFeedPostJson, SocialCommentNodeJson } from "./community-feed-types";

/** Alt ağaçtaki tüm yanıt düğümü sayısı (doğrudan + iç içe). */
export function countNestedReplies(nodes: SocialCommentNodeJson[] | undefined): number {
  if (!nodes?.length) return 0;
  return nodes.reduce((acc, r) => acc + 1 + countNestedReplies(r.replies ?? []), 0);
}

export function mapCommentTree(
  nodes: SocialCommentNodeJson[],
  commentPublicId: string,
  patch: Partial<SocialCommentNodeJson>,
): SocialCommentNodeJson[] {
  return nodes.map((n) => {
    if (n.publicId === commentPublicId) return { ...n, ...patch };
    if (n.replies?.length) return { ...n, replies: mapCommentTree(n.replies, commentPublicId, patch) };
    return n;
  });
}

export function mergeReplyIntoTree(
  nodes: SocialCommentNodeJson[],
  parentCommentPublicId: string,
  newNode: SocialCommentNodeJson,
): SocialCommentNodeJson[] {
  return nodes.map((n) => {
    if (n.publicId === parentCommentPublicId) return { ...n, replies: [...(n.replies ?? []), newNode] };
    if (n.replies?.length) return { ...n, replies: mergeReplyIntoTree(n.replies, parentCommentPublicId, newNode) };
    return n;
  });
}

export function prependRootComments(post: CommunityFeedPostJson, roots: SocialCommentNodeJson[]): CommunityFeedPostJson {
  return {
    ...post,
    comments: [...roots, ...post.comments],
    loadedCommentNodeCount: post.loadedCommentNodeCount + roots.length,
  };
}
