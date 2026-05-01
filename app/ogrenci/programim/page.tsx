import type { Metadata } from "next";
import { StudentProgramClient } from "@/components/student/StudentProgramClient";

export const metadata: Metadata = {
  title: "Programım",
  description: "Öğrenci paneli — güncel program ve ilerleme özeti.",
};

export default function StudentProgramPage() {
  return <StudentProgramClient />;
}

