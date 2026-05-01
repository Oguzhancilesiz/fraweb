import type { Metadata } from "next";
import { StudentPackagesClient } from "@/components/student/StudentPackagesClient";

export const metadata: Metadata = {
  title: "Paketlerim",
  description: "Öğrenci paneli — paket hakları ve geçmiş.",
};

export default function StudentPackagesPage() {
  return <StudentPackagesClient />;
}

