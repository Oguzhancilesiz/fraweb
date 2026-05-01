import type { Metadata } from "next";
import { AdminPurchaseIntentsClient } from "@/components/admin/AdminPurchaseIntentsClient";

export const metadata: Metadata = {
  title: "Admin ödeme niyetleri",
};

export default function AdminPurchaseIntentsPage() {
  return <AdminPurchaseIntentsClient />;
}
