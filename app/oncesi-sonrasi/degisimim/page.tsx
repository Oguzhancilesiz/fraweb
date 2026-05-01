import type { Metadata } from "next";
import { BeforeAfterMineClient } from "@/components/community/BeforeAfterMineClient";

export const metadata: Metadata = {
  title: "Değişimim",
  description: "Öncesi ve sonrası — kendi paylaşımlarınız.",
};

export default function BeforeAfterMinePage() {
  return <BeforeAfterMineClient />;
}
