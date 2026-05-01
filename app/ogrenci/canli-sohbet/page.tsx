import type { Metadata } from "next";
import { StudentLiveChatClient } from "@/components/student/StudentLiveChatClient";

export const metadata: Metadata = {
  title: "Canlı sohbet",
  description: "Öğrenci paneli — koç ile canlı mesajlaşma özeti.",
};

export default function StudentLiveChatPage() {
  return <StudentLiveChatClient />;
}

