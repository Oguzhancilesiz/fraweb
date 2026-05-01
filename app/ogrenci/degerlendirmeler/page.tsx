import type { Metadata } from "next";
import { StudentAssessmentsClient } from "@/components/student/StudentAssessmentsClient";

export const metadata: Metadata = {
  title: "Değerlendirmeler",
  description: "Öğrenci paneli — aylık değerlendirme kayıtları.",
};

export default function StudentAssessmentsPage() {
  return <StudentAssessmentsClient />;
}

