import type { Metadata } from "next";
import { CommunityFeedClient } from "@/components/community/CommunityFeedClient";
import { CommunityHubShell } from "@/components/community/CommunityHubShell";

export const metadata: Metadata = {
  title: "Topluluk",
  description: "Topluluk akışı — API.",
};

export default function CommunityPage() {
  return (
    <CommunityHubShell activeTab="feed">
      <CommunityFeedClient />
    </CommunityHubShell>
  );
}
