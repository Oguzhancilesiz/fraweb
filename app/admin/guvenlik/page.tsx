import type { Metadata } from "next";
import { AdminSecurityClient } from "@/components/admin/AdminSecurityClient";

export const metadata: Metadata = {
  title: "Admin canlı güvenlik",
};

export default function AdminSecurityPage() {
  return <AdminSecurityClient />;
}
