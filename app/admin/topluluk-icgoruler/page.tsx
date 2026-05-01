import type { Metadata } from "next";
import { AdminCommunityInsightsClient } from "@/components/admin/AdminCommunityInsightsClient";

export const metadata: Metadata = {
  title: "Admin topluluk içgörüleri",
  description: "Topluluk istatistikleri ve moderasyon dağılımı.",
};

export default function AdminCommunityInsightsPage() {
  return <AdminCommunityInsightsClient />;
}
