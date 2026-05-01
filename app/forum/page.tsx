import type { Metadata } from "next";
import { CommunityHubShell } from "@/components/community/CommunityHubShell";
import { ForumTopicsClient } from "@/components/community/ForumTopicsClient";

export const metadata: Metadata = {
  title: "Forum",
  description: "Topluluk forumu — API.",
};

export default function ForumPage() {
  return (
    <CommunityHubShell activeTab="forum">
      <ForumTopicsClient />
    </CommunityHubShell>
  );
}
