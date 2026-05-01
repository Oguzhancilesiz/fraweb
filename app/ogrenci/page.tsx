import type { Metadata } from "next";
import { StudentHomeClient } from "@/components/student/StudentHomeClient";

export const metadata: Metadata = {
  title: "Öğrenci alanı",
  description: "Öğrenci ana sayfa özeti — API.",
};

export default function StudentPage() {
  return <StudentHomeClient />;
}
