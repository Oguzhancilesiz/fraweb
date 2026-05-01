import type { Metadata } from "next";
import { CommunityHubShell } from "@/components/community/CommunityHubShell";
import { CoachesDirectoryClient } from "@/components/coaches/CoachesDirectoryClient";

export const metadata: Metadata = {
  title: "Antrenörler",
  description: "Topluluk antrenör dizini — profil ve paylaşımlar (giriş gerekir).",
};

export default function CoachesPage() {
  return (
    <CommunityHubShell activeTab="coaches">
      <CoachesDirectoryClient />
    </CommunityHubShell>
  );
}
