import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminUserDetailClient } from "@/components/admin/AdminUserDetailClient";

export const metadata: Metadata = {
  title: "Admin kullanıcı detayı",
};

type Props = { params: Promise<{ userId: string }> };

const GUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function AdminUserDetailPage({ params }: Props) {
  const { userId } = await params;
  if (!GUID_RX.test(userId)) notFound();
  return <AdminUserDetailClient userId={userId} />;
}
