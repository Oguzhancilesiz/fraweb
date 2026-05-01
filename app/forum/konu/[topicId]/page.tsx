import type { Metadata } from "next";
import { CommunityHubShell } from "@/components/community/CommunityHubShell";
import { ForumTopicDetailClient } from "@/components/community/ForumTopicDetailClient";

export const metadata: Metadata = {
  title: "Forum konusu",
  description: "Topluluk forumu — konu ve yanıtlar.",
};

export default async function ForumTopicPage({ params }: { params: Promise<{ topicId: string }> }) {
  const { topicId } = await params;
  return (
    <CommunityHubShell activeTab="forum">
      <ForumTopicDetailClient topicPublicId={topicId} />
    </CommunityHubShell>
  );
}
