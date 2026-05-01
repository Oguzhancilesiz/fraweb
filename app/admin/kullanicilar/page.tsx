import type { Metadata } from "next";
import { AdminUsersClient } from "@/components/admin/AdminUsersClient";

export const metadata: Metadata = {
  title: "Admin kullanıcılar",
  description: "Yönetim kullanıcı dizini.",
};

export default function AdminUsersPage() {
  return <AdminUsersClient />;
}
