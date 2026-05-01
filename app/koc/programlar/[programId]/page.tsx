import type { Metadata } from "next";
import { CoachProgramDetailClient } from "@/components/coach/CoachProgramDetailClient";

export const metadata: Metadata = {
  title: "Program detayı",
  description: "Koç paneli — program görüntüleme ve işlemler.",
};

export default async function CoachProgramDetailPage({ params }: { params: Promise<{ programId: string }> }) {
  const { programId } = await params;
  return <CoachProgramDetailClient programId={programId} />;
}
