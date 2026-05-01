import type { Metadata } from "next";
import { AdminSiteSettingsClient } from "@/components/admin/AdminSiteSettingsClient";

export const metadata: Metadata = {
  title: "Admin site ayarları",
};

export default function AdminSiteSettingsPage() {
  return <AdminSiteSettingsClient />;
}
