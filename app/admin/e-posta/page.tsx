import type { Metadata } from "next";
import { AdminEmailCenterClient } from "@/components/admin/AdminEmailCenterClient";

export const metadata: Metadata = {
  title: "Admin e-posta merkezi",
};

export default function AdminEmailPage() {
  return <AdminEmailCenterClient />;
}
