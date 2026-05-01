import type { Metadata } from "next";
import { AdminStudentPackagesClient } from "@/components/admin/AdminStudentPackagesClient";

export const metadata: Metadata = {
  title: "Admin öğrenci paketleri",
};

export default function AdminStudentPackagesPage() {
  return <AdminStudentPackagesClient />;
}
