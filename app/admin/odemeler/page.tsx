import type { Metadata } from "next";
import { AdminPaymentsClient } from "@/components/admin/AdminPaymentsClient";

export const metadata: Metadata = {
  title: "Admin ödemeler",
  description: "Yönetim ödeme sipariş listesi.",
};

export default function AdminPaymentsPage() {
  return <AdminPaymentsClient />;
}
