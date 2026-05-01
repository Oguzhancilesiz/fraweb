import type { Metadata } from "next";
import { AdminModerationClient } from "@/components/admin/AdminModerationClient";

export const metadata: Metadata = {
  title: "Admin moderasyon",
  description: "Topluluk içerik moderasyon kuyruğu.",
};

export default function AdminModerationPage() {
  return <AdminModerationClient />;
}
