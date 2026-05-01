import type { Metadata } from "next";
import { AdminAuditLogsClient } from "@/components/admin/AdminAuditLogsClient";

export const metadata: Metadata = {
  title: "Admin denetim (audit)",
};

export default function AdminAuditPage() {
  return <AdminAuditLogsClient />;
}
