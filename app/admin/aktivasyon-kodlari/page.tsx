import type { Metadata } from "next";
import { AdminActivationCodesClient } from "@/components/admin/AdminActivationCodesClient";

export const metadata: Metadata = {
  title: "Admin aktivasyon kodları",
};

export default function AdminActivationCodesPage() {
  return <AdminActivationCodesClient />;
}
