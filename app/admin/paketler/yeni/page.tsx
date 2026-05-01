import type { Metadata } from "next";
import { AdminPackageEditorClient } from "@/components/admin/AdminPackageEditorClient";

export const metadata: Metadata = {
  title: "Admin yeni paket",
};

export default function AdminNewPackagePage() {
  return <AdminPackageEditorClient mode="create" />;
}
