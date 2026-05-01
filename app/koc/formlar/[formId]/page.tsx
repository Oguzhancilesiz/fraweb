import type { Metadata } from "next";
import { CoachFormReviewClient } from "@/components/coach/CoachFormReviewClient";

export const metadata: Metadata = {
  title: "Aylık form",
  description: "Koç paneli — değerlendirme formu ve inceleme.",
};

export default async function CoachFormPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params;
  return <CoachFormReviewClient formId={formId} />;
}
