import type { Metadata } from "next";
import { StudentMonthlyAssessmentDetailClient } from "@/components/student/StudentMonthlyAssessmentDetailClient";

export const metadata: Metadata = {
  title: "Değerlendirme özeti",
  description: "Koçuna ilettiğin aylık değerlendirmeyi görüntüle.",
};

type Props = { params: Promise<{ formId: string }> };

export default async function StudentAssessmentDetailPage({ params }: Props) {
  const { formId } = await params;
  return <StudentMonthlyAssessmentDetailClient formIdParam={formId} />;
}
