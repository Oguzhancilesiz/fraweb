import type { Metadata } from "next";
import { CoachProgramFeedbackClient } from "@/components/coach/CoachProgramFeedbackClient";

export const metadata: Metadata = {
  title: "Durum bildirimleri",
  description: "Koç paneli — öğrenci program tamamlama geri bildirimleri.",
};

export default function CoachProgramFeedbackPage() {
  return <CoachProgramFeedbackClient />;
}
