import type { Metadata } from "next";
import { AdminMuscleWikiClient } from "@/components/admin/AdminMuscleWikiClient";

export const metadata: Metadata = {
  title: "Admin MuscleWiki",
};

export default function AdminMuscleWikiPage() {
  return <AdminMuscleWikiClient />;
}
