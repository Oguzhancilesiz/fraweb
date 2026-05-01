import type { Metadata } from "next";
import { CommunityHubShell } from "@/components/community/CommunityHubShell";
import { CommunityMineOverviewClient } from "@/components/community/CommunityMineOverviewClient";

export const metadata: Metadata = {
  title: "Paylaşımlarım",
  description: "Topluluk içeriğinizin özeti.",
};

export default function CommunityMinePage() {
  return (
    <CommunityHubShell activeTab="mine">
      <CommunityMineOverviewClient />
    </CommunityHubShell>
  );
}
