import type { Metadata } from "next";
import { CoachLiveChatInboxClient } from "@/components/coach/CoachLiveChatInboxClient";

export const metadata: Metadata = {
  title: "Canlı sohbet",
  description: "Koç paneli — öğrenci sohbet gelen kutusu.",
};

export default function CoachLiveChatPage() {
  return <CoachLiveChatInboxClient />;
}
