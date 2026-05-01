import type { Metadata } from "next";
import { StudentMonthlyAssessmentEditorClient } from "@/components/student/StudentMonthlyAssessmentEditorClient";

export const metadata: Metadata = {
  title: "Değerlendirme formu",
  description: "Aylık değerlendirme taslağını doldur ve gönder.",
};

type Props = { params: Promise<{ formId: string }> };

export default async function StudentAssessmentEditPage({ params }: Props) {
  const { formId } = await params;
  return <StudentMonthlyAssessmentEditorClient formIdParam={formId} />;
}
