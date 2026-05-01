import type { Metadata } from "next";
import { Suspense } from "react";
import { CoachStudentsClient } from "@/components/coach/CoachStudentsClient";

export const metadata: Metadata = {
  title: "Öğrenciler",
  description: "Koç paneli — öğrenci listesi ve filtreler.",
};

export default function CoachStudentsPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-sm text-zinc-500">Yükleniyor…</div>}>
      <CoachStudentsClient />
    </Suspense>
  );
}
