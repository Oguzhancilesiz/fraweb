import type { Metadata } from "next";
import { AdminPackagesClient } from "@/components/admin/AdminPackagesClient";

export const metadata: Metadata = {
  title: "Admin paketler",
};

export default function AdminPackagesPage() {
  return <AdminPackagesClient />;
}
