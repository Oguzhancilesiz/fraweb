import type { Metadata } from "next";
import { AdminModerationArchiveClient } from "@/components/admin/AdminModerationArchiveClient";

export const metadata: Metadata = {
  title: "Admin içerik geçmişi",
};

export default function AdminModerationArchivePage() {
  return <AdminModerationArchiveClient />;
}
