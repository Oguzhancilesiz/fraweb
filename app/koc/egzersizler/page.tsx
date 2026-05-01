import type { Metadata } from "next";
import { CoachExerciseLibraryClient } from "@/components/coach/CoachExerciseLibraryClient";

export const metadata: Metadata = {
  title: "Egzersizler",
  description: "Koç paneli — egzersiz kütüphanesi.",
};

export default function CoachExercisesPage() {
  return <CoachExerciseLibraryClient />;
}
