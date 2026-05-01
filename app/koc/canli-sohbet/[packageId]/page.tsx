import type { Metadata } from "next";
import { CoachLiveChatThreadClient } from "@/components/coach/CoachLiveChatThreadClient";

export const metadata: Metadata = {
  title: "Sohbet",
  description: "Koç paneli — öğrenci ile canlı sohbet.",
};

export default async function CoachLiveChatThreadPage({ params }: { params: Promise<{ packageId: string }> }) {
  const { packageId } = await params;
  return <CoachLiveChatThreadClient packageId={packageId} />;
}
