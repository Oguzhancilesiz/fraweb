import type { Metadata } from "next";
import { CoachProgramsClient } from "@/components/coach/CoachProgramsClient";

export const metadata: Metadata = {
  title: "Programlar",
  description: "Koç paneli — antrenman programları.",
};

export default function CoachProgramsPage() {
  return <CoachProgramsClient />;
}
