import type { Metadata } from "next";
import { AdminHomeClient } from "@/components/admin/AdminHomeClient";

export const metadata: Metadata = {
  title: "Admin paneli",
  description: "Yönetim genel bakış ekranı.",
};

export default function AdminPage() {
  return <AdminHomeClient />;
}
