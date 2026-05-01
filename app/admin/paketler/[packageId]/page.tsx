import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPackageEditorClient } from "@/components/admin/AdminPackageEditorClient";

export const metadata: Metadata = {
  title: "Admin paket düzenle",
};

type Props = { params: Promise<{ packageId: string }> };

export default async function AdminEditPackagePage({ params }: Props) {
  const { packageId } = await params;
  const id = Number(packageId.trim());
  if (!Number.isFinite(id) || id <= 0) notFound();
  return <AdminPackageEditorClient mode="edit" packageId={id} />;
}
