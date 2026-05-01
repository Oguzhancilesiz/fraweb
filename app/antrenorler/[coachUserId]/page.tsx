import type { Metadata } from "next";
import { CommunityHubShell } from "@/components/community/CommunityHubShell";
import { CoachPublicProfileClient } from "@/components/coaches/CoachPublicProfileClient";

export const metadata: Metadata = {
  title: "Antrenör profili",
  description: "Antrenör profili, paylaşımlar ve forum özeti.",
};

export default async function CoachPublicProfilePage({ params }: { params: Promise<{ coachUserId: string }> }) {
  const { coachUserId } = await params;
  return (
    <CommunityHubShell activeTab="coaches">
      <CoachPublicProfileClient coachUserId={coachUserId} />
    </CommunityHubShell>
  );
}
