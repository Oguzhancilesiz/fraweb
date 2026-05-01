"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { resolveMediaUrl } from "@/lib/media";
import { usePanelTheme } from "@/contexts/PanelThemeContext";
import { cn } from "@/components/dashboard/DashboardUI";
import { MAX_FEED_COMMENT_BODY, type SocialCommentNodeJson } from "./community-feed-types";
import {
  IconHeart,
  IconUsers,
  commentActionBtn,
  commentActionBtnActive,
  commentActionBtnActiveLight,
  commentActionBtnLight,
} from "./feed-action-ui";
import { countNestedReplies } from "./feed-comment-tree";

function relTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

type CommentProps = {
  node: SocialCommentNodeJson;
  depth: number;
  postPublicId: string;
  token: string;
  onPatchComment: (commentPublicId: string, patch: Partial<SocialCommentNodeJson>) => void;
  onMergeReply: (parentCommentPublicId: string, node: SocialCommentNodeJson, postTotalCommentCount: number) => void;
  onOpenCommentLikers: (commentPublicId: string) => void;
};

function FeedCommentBranch({
  node,
  depth,
  postPublicId,
  token,
  onPatchComment,
  onMergeReply,
  onOpenCommentLikers,
}: CommentProps) {
  const { theme, enabled } = usePanelTheme();
  const L = enabled && theme === "light";
  const cb = L ? commentActionBtnLight : commentActionBtn;
  const cba = L ? commentActionBtnActiveLight : commentActionBtnActive;

  const [replyOpen, setReplyOpen] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const nestedReplyCount = countNestedReplies(node.replies);
  const [repliesOpen, setRepliesOpen] = useState(false);
  const photo = resolveMediaUrl(node.authorPhotoUrl);
  const maxDepth = 10;
  const pad = Math.min(depth, maxDepth);

  async function toggleCommentLike() {
    if (likeBusy) return;
    setLikeBusy(true);
    const r = await apiFetch<{ ok: boolean; likedByMe: boolean; likeCount: number }>(
      `/api/v1/community/feed/comments/${node.publicId}/like`,
      { method: "POST", accessToken: token },
    );
    setLikeBusy(false);
    if (r.ok) onPatchComment(node.publicId, { likedByMe: r.data.likedByMe, likeCount: r.data.likeCount });
  }

  async function submitReply(e: React.FormEvent) {
    e.preventDefault();
    const body = replyBody.trim();
    if (!body || replyBusy) return;
    setReplyBusy(true);
    const r = await apiFetch<{
      ok: boolean;
      node: SocialCommentNodeJson;
      postTotalCommentCount: number;
      parentCommentPublicId?: string | null;
    }>("/api/v1/community/feed/comments", {
      method: "POST",
      accessToken: token,
      body: JSON.stringify({
        postPublicId,
        parentCommentPublicId: node.publicId,
        body,
      }),
    });
    setReplyBusy(false);
    if (!r.ok) return;
    onMergeReply(node.publicId, r.data.node, r.data.postTotalCommentCount);
    setReplyBody("");
    setReplyOpen(false);
    setRepliesOpen(true);
  }

  return (
    <li
      id={`feed-comment-${node.publicId}`}
      className={cn(
        "rounded-lg border py-2 pl-2 pr-2",
        L ? "border-orange-950/22 bg-white/93 shadow-[0_1px_8px_-3px_rgba(249,115,22,0.12)]" : "border-white/[0.06] bg-pf-void/25",
      )}
      style={{ marginLeft: pad > 0 ? `${Math.min(pad, 5) * 12}px` : undefined }}
    >
      <div className="flex gap-2">
        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full text-[10px] font-bold text-pf-orange-bright sm:h-8 sm:w-8 sm:text-[11px]",
            L ? "bg-orange-100" : "bg-white/10",
          )}
        >
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" className="h-full w-full object-cover" />
          ) : (
            (node.authorDisplayName || "?")[0]
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
            <span className={cn("text-xs font-semibold", L ? "text-stone-900" : "text-white")}>{node.authorDisplayName}</span>
            <span className={cn("text-[10px]", L ? "text-stone-600" : "text-zinc-500")}>{relTime(node.createdAtUtc)}</span>
          </div>
          <p className={cn("mt-0.5 whitespace-pre-wrap text-xs leading-relaxed", L ? "text-stone-700" : "text-zinc-300")}>{node.body}</p>
          {node.attachments?.length ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {node.attachments.map((a, i) => {
                const u = resolveMediaUrl(a.url);
                if (!u) return null;
                return (
                  <a
                    key={i}
                    href={u}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      "block h-14 w-14 overflow-hidden rounded-md border sm:h-16 sm:w-16",
                      L ? "border-orange-950/29" : "border-white/10",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt="" className="h-full w-full object-cover" />
                  </a>
                );
              })}
            </div>
          ) : null}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <button
              type="button"
              disabled={likeBusy}
              onClick={() => void toggleCommentLike()}
              className={`${cb} ${node.likedByMe ? cba : ""}`}
              aria-pressed={node.likedByMe}
            >
              <IconHeart filled={node.likedByMe} className="h-3 w-3 opacity-90" />
              <span>{node.likedByMe ? "Beğenildi" : "Beğen"}</span>
              {node.likeCount > 0 ? (
                <span className={cn("font-normal", L ? "text-stone-600" : "text-zinc-500")}>{node.likeCount}</span>
              ) : null}
            </button>
            {depth < 8 ? (
              <button type="button" className={cb} onClick={() => setReplyOpen((o) => !o)}>
                {replyOpen ? "İptal" : "Yanıtla"}
              </button>
            ) : null}
            {node.likeCount > 0 ? (
              <button type="button" className={cb} title="Beğenenler" onClick={() => onOpenCommentLikers(node.publicId)}>
                <IconUsers className="h-3 w-3 opacity-80" />
                <span>Beğenenler</span>
              </button>
            ) : null}
          </div>
          {replyOpen ? (
            <form onSubmit={(e) => void submitReply(e)} className="mt-2 space-y-1.5">
              <textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                rows={2}
                maxLength={MAX_FEED_COMMENT_BODY}
                placeholder="Yanıtını yaz…"
                className={cn(
                  "w-full rounded-lg border px-2 py-1.5 text-xs",
                  L ? "border-orange-950/27 bg-white text-stone-900 placeholder:text-stone-500/75" : "border-white/10 bg-pf-void",
                )}
              />
              <button
                type="submit"
                disabled={replyBusy || !replyBody.trim()}
                className="rounded-lg border border-pf-orange/35 bg-pf-orange px-3 py-1 text-[11px] font-bold text-black hover:bg-pf-orange-bright disabled:opacity-50"
              >
                {replyBusy ? "…" : "Gönder"}
              </button>
            </form>
          ) : null}
        </div>
      </div>
      {nestedReplyCount > 0 ? (
        <div className="mt-1.5 pl-1">
          <button
            type="button"
            onClick={() => setRepliesOpen((o) => !o)}
            className={cn(
              "text-left text-[11px] font-semibold",
              L ? "text-orange-950 hover:text-pf-orange" : "text-zinc-500 hover:text-pf-orange-bright",
            )}
            aria-expanded={repliesOpen}
          >
            {repliesOpen ? "▼ Yanıtları gizle" : `▸ Yanıtları gör · ${nestedReplyCount}`}
          </button>
        </div>
      ) : null}
      {repliesOpen && node.replies?.length ? (
        <ul className={cn("mt-2 space-y-2 border-l pl-2", L ? "border-orange-200/93" : "border-white/10")}>
          {node.replies.map((ch) => (
            <FeedCommentBranch
              key={ch.publicId}
              node={ch}
              depth={depth + 1}
              postPublicId={postPublicId}
              token={token}
              onPatchComment={onPatchComment}
              onMergeReply={onMergeReply}
              onOpenCommentLikers={onOpenCommentLikers}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function FeedCommentNode(props: CommentProps) {
  return <FeedCommentBranch {...props} />;
}
