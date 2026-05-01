import type { Metadata } from "next";
import { CoachHomeClient } from "@/components/coach/CoachHomeClient";

export const metadata: Metadata = {
  title: "Koç alanı",
  description: "Koç paneli özeti — API.",
};

export default function CoachPage() {
  return <CoachHomeClient />;
}
