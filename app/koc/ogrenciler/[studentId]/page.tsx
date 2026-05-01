import type { Metadata } from "next";
import { CoachStudentDetailClient } from "@/components/coach/CoachStudentDetailClient";

export const metadata: Metadata = {
  title: "Öğrenci detayı",
  description: "Koç paneli — öğrenci profili.",
};

export default async function CoachStudentDetailPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  return <CoachStudentDetailClient studentId={studentId} />;
}
