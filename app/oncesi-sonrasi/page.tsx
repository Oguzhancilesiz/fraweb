import type { Metadata } from "next";
import { BeforeAfterExploreClient } from "@/components/community/BeforeAfterExploreClient";

export const metadata: Metadata = {
  title: "Öncesi & sonrası",
  description: "Dönüşüm paylaşımları — API.",
};

export default function BeforeAfterPage() {
  return <BeforeAfterExploreClient />;
}
